import type { Artwork } from '../types';

/**
 * Credit that travels with the file.
 *
 * Canvas `toBlob` emits a JPEG with no metadata at all — an exported artwork
 * would leave Framio stripped of its artist, museum, and license. This module
 * writes that credit back, by hand (three small JPEG segments, no
 * dependencies):
 *
 *   • EXIF APP1 — ImageDescription / Artist / Copyright / Software, the tags
 *     every photo manager and OS reads;
 *   • XMP APP1  — the full record: Dublin Core title/creator/rights/source,
 *     the accessibility description (dc:description — access travels inside
 *     the file), CC0 rights statement, and the museum credit;
 *   • COM       — a plain-text credit line even `strings` can find.
 *
 * Embedding must never break an export: any parse anomaly returns the
 * original blob unchanged.
 */

export interface ExportMetadata {
  title: string;
  artist?: string;
  year?: string;
  museum?: string;
  /** Human-readable rights line, e.g. "Public Domain · CC0". */
  rights?: string;
  /** Link back to the work at the museum. */
  sourceUrl?: string;
  /** Visual description — the a11y text, shipped inside the file. */
  description?: string;
  /** Machine-readable license URL (CC0 deed) — open-access works only. */
  webStatement?: string;
  software: string;
}

/** How much of a long description travels in the file. */
const MAX_EMBED_DESCRIPTION = 2000;

/**
 * Export metadata for a museum work. Only open-access works are exportable,
 * and only they get a license statement — never stamp rights on uploads.
 */
export function metadataFor(art: Artwork): ExportMetadata {
  const open = art.isPublicDomain;
  return {
    title: art.title,
    artist: art.artist !== 'Unknown artist' ? art.artist : undefined,
    year: art.year || undefined,
    museum: art.museum || undefined,
    rights: open
      ? `Public Domain / CC0${art.museum ? ` — courtesy of ${art.museum}` : ''}`
      : undefined,
    sourceUrl: art.objectUrl,
    description: art.altText || art.description || undefined,
    webStatement: open
      ? 'https://creativecommons.org/publicdomain/zero/1.0/'
      : undefined,
    software: 'Framio',
  };
}

/** Metadata for a user's own image: their title, nothing claimed. */
export function uploadMetadata(title: string): ExportMetadata {
  return { title, software: 'Framio' };
}

/* ------------------------------------------------------------------- XMP */

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function altTag(ns: string, value: string): string {
  return `<${ns}><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(
    value,
  )}</rdf:li></rdf:Alt></${ns.split(' ')[0]}>`;
}

/** The XMP packet (XML string) — exported for tests. */
export function buildXmpPacket(meta: ExportMetadata): string {
  const parts: string[] = [];
  parts.push(altTag('dc:title', meta.title));
  if (meta.artist) {
    parts.push(
      `<dc:creator><rdf:Seq><rdf:li>${xmlEscape(
        meta.artist,
      )}</rdf:li></rdf:Seq></dc:creator>`,
    );
  }
  if (meta.description) {
    parts.push(
      altTag('dc:description', meta.description.slice(0, MAX_EMBED_DESCRIPTION)),
    );
  }
  if (meta.rights) parts.push(altTag('dc:rights', meta.rights));
  if (meta.sourceUrl) {
    parts.push(`<dc:source>${xmlEscape(meta.sourceUrl)}</dc:source>`);
  }
  if (meta.webStatement) {
    parts.push('<xmpRights:Marked>False</xmpRights:Marked>');
    parts.push(
      `<xmpRights:WebStatement>${xmlEscape(
        meta.webStatement,
      )}</xmpRights:WebStatement>`,
    );
  }
  if (meta.rights) parts.push(altTag('xmpRights:UsageTerms', meta.rights));
  if (meta.museum) {
    parts.push(`<photoshop:Credit>${xmlEscape(meta.museum)}</photoshop:Credit>`);
  }

  return (
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">' +
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    '<rdf:Description rdf:about=""' +
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
    ' xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"' +
    ' xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"' +
    ' xmlns:xmp="http://ns.adobe.com/xap/1.0/"' +
    ` xmp:CreatorTool="${xmlEscape(meta.software)}">` +
    parts.join('') +
    '</rdf:Description></rdf:RDF></x:xmpmeta>' +
    '<?xpacket end="w"?>'
  );
}

const XMP_HEADER = 'http://ns.adobe.com/xap/1.0/\0';

/** The full XMP APP1 segment (marker + length + payload). */
export function buildXmpApp1(meta: ExportMetadata): Uint8Array {
  const payload = new TextEncoder().encode(XMP_HEADER + buildXmpPacket(meta));
  return wrapSegment(0xe1, payload);
}

/* ------------------------------------------------------------------ EXIF */

interface ExifEntry {
  tag: number;
  value: string;
}

/**
 * A minimal EXIF APP1: little-endian TIFF header + one IFD0 of ASCII tags.
 * Values are UTF-8 encoded (universally tolerated; XMP carries full fidelity).
 */
export function buildExifApp1(meta: ExportMetadata): Uint8Array {
  const describe = [meta.title, meta.artist, meta.year]
    .filter(Boolean)
    .join(' — ');
  const copyright = [meta.rights, meta.sourceUrl && `Source: ${meta.sourceUrl}`]
    .filter(Boolean)
    .join('. ');

  const entries: ExifEntry[] = [
    { tag: 0x010e, value: describe }, // ImageDescription
    { tag: 0x0131, value: meta.software }, // Software
  ];
  if (meta.artist) entries.push({ tag: 0x013b, value: meta.artist }); // Artist
  if (copyright) entries.push({ tag: 0x8298, value: copyright }); // Copyright
  entries.sort((a, b) => a.tag - b.tag); // IFD entries must be ascending

  const encoder = new TextEncoder();
  const values = entries.map((e) => {
    const bytes = encoder.encode(e.value);
    const withNul = new Uint8Array(bytes.length + 1);
    withNul.set(bytes);
    return withNul;
  });

  const ifdOffset = 8; // right after the TIFF header
  const ifdSize = 2 + entries.length * 12 + 4;
  const valueAreaStart = ifdOffset + ifdSize;

  const totalTiff = valueAreaStart + values.reduce((n, v) => n + v.length, 0);
  const tiff = new Uint8Array(totalTiff);
  const view = new DataView(tiff.buffer);

  // TIFF header: "II", 42, offset of IFD0.
  tiff[0] = 0x49;
  tiff[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdOffset, true);

  view.setUint16(ifdOffset, entries.length, true);
  let entryPos = ifdOffset + 2;
  let valuePos = valueAreaStart;
  entries.forEach((e, i) => {
    const v = values[i];
    view.setUint16(entryPos, e.tag, true);
    view.setUint16(entryPos + 2, 2, true); // type 2 = ASCII
    view.setUint32(entryPos + 4, v.length, true);
    if (v.length <= 4) {
      tiff.set(v, entryPos + 8); // short values live inline
    } else {
      view.setUint32(entryPos + 8, valuePos, true);
      tiff.set(v, valuePos);
      valuePos += v.length;
    }
    entryPos += 12;
  });
  view.setUint32(entryPos, 0, true); // no next IFD

  const header = encoder.encode('Exif\0\0');
  const payload = new Uint8Array(header.length + tiff.length);
  payload.set(header);
  payload.set(tiff, header.length);
  return wrapSegment(0xe1, payload);
}

/* ------------------------------------------------------------------- COM */

/** A plain-text credit comment for viewers that read nothing else. */
export function buildComSegment(meta: ExportMetadata): Uint8Array {
  const line = [
    [meta.title, meta.artist, meta.year].filter(Boolean).join(' — '),
    meta.museum,
    meta.rights,
    meta.sourceUrl,
  ]
    .filter(Boolean)
    .join(' · ');
  return wrapSegment(0xfe, new TextEncoder().encode(line));
}

/* ---------------------------------------------------------------- splice */

/** Wrap a payload as a JPEG segment: FF <marker> <len16 incl. itself>. */
function wrapSegment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  if (length > 0xffff) {
    throw new Error(`segment payload too large: ${payload.length}`);
  }
  const seg = new Uint8Array(payload.length + 4);
  seg[0] = 0xff;
  seg[1] = marker;
  seg[2] = (length >> 8) & 0xff;
  seg[3] = length & 0xff;
  seg.set(payload, 4);
  return seg;
}

/**
 * Splice credit metadata into a JPEG blob. The segments go right after the
 * JFIF APP0 the canvas encoder emits (or straight after SOI when there is
 * none). Returns the original blob untouched on any anomaly.
 */
export async function embedJpegMetadata(
  jpeg: Blob,
  meta: ExportMetadata,
): Promise<Blob> {
  try {
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return jpeg;

    let insertAt = 2;
    if (bytes[2] === 0xff && bytes[3] === 0xe0) {
      const app0Len = (bytes[4] << 8) | bytes[5];
      const after = 4 + app0Len;
      if (after >= bytes.length) return jpeg;
      insertAt = after;
    }

    const segments = [
      buildExifApp1(meta),
      buildXmpApp1(meta),
      buildComSegment(meta),
    ];
    const extra = segments.reduce((n, s) => n + s.length, 0);
    const out = new Uint8Array(bytes.length + extra);
    out.set(bytes.subarray(0, insertAt));
    let pos = insertAt;
    for (const seg of segments) {
      out.set(seg, pos);
      pos += seg.length;
    }
    out.set(bytes.subarray(insertAt), pos);
    return new Blob([out], { type: 'image/jpeg' });
  } catch {
    return jpeg;
  }
}
