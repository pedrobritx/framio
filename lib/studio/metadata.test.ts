import { describe, expect, it } from 'vitest';
import {
  buildExifApp1,
  buildXmpApp1,
  buildXmpPacket,
  embedJpegMetadata,
  metadataFor,
  uploadMetadata,
  type ExportMetadata,
} from './metadata';
import type { Artwork } from '../types';

const meta: ExportMetadata = {
  title: 'Wheat Field with Cypresses',
  artist: 'Vincent van Gogh',
  year: '1889',
  museum: 'The Met',
  rights: 'Public Domain / CC0 — courtesy of The Met',
  sourceUrl: 'https://www.metmuseum.org/art/collection/search/436535',
  description: 'A windblown wheat field under a turbulent sky.',
  webStatement: 'https://creativecommons.org/publicdomain/zero/1.0/',
  software: 'Framio',
};

/** Read one type-2 (ASCII) IFD0 tag value out of an EXIF APP1 segment. */
function readExifTag(app1: Uint8Array, tag: number): string | null {
  // FF E1 len "Exif\0\0" then TIFF. Header "Exif\0\0" is 6 bytes.
  const tiff = app1.subarray(4 + 6);
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const le = tiff[0] === 0x49;
  const ifdOffset = view.getUint32(4, le);
  const count = view.getUint16(ifdOffset, le);
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    const entry = ifdOffset + 2 + i * 12;
    const t = view.getUint16(entry, le);
    if (t !== tag) continue;
    const len = view.getUint32(entry + 4, le);
    let bytes: Uint8Array;
    if (len <= 4) {
      bytes = tiff.subarray(entry + 8, entry + 8 + len);
    } else {
      const off = view.getUint32(entry + 8, le);
      bytes = tiff.subarray(off, off + len);
    }
    return dec.decode(bytes).replace(/\0+$/, '');
  }
  return null;
}

describe('metadataFor', () => {
  const base: Artwork = {
    id: 'met:436535',
    source: 'met',
    sourceId: '436535',
    title: 'Wheat Field',
    artist: 'Vincent van Gogh',
    year: '1889',
    medium: 'Oil on canvas',
    museum: 'The Met',
    isPublicDomain: true,
    imageUrl: 'x',
    thumbUrl: 'x',
    objectUrl: 'https://example.test/436535',
    altText: 'A wheat field.',
  };

  it('stamps CC0 rights + web statement on open-access works', () => {
    const m = metadataFor(base);
    expect(m.rights).toContain('CC0');
    expect(m.webStatement).toContain('creativecommons.org/publicdomain/zero');
    expect(m.description).toBe('A wheat field.');
  });

  it('never claims rights it does not have (in-copyright work)', () => {
    const m = metadataFor({ ...base, isPublicDomain: false });
    expect(m.rights).toBeUndefined();
    expect(m.webStatement).toBeUndefined();
  });

  it('drops an unknown artist rather than writing "Unknown artist"', () => {
    const m = metadataFor({ ...base, artist: 'Unknown artist' });
    expect(m.artist).toBeUndefined();
  });

  it('uploadMetadata claims nothing but the title', () => {
    const m = uploadMetadata('My photo');
    expect(m.title).toBe('My photo');
    expect(m.rights).toBeUndefined();
    expect(m.webStatement).toBeUndefined();
    expect(m.artist).toBeUndefined();
  });
});

describe('EXIF APP1', () => {
  const app1 = buildExifApp1(meta);

  it('is a well-formed APP1 segment', () => {
    expect(app1[0]).toBe(0xff);
    expect(app1[1]).toBe(0xe1);
    const len = (app1[2] << 8) | app1[3];
    expect(len).toBe(app1.length - 2);
  });

  it('round-trips ImageDescription, Artist, Copyright, and Software', () => {
    expect(readExifTag(app1, 0x010e)).toBe(
      'Wheat Field with Cypresses — Vincent van Gogh — 1889',
    );
    expect(readExifTag(app1, 0x013b)).toBe('Vincent van Gogh');
    expect(readExifTag(app1, 0x8298)).toContain('Public Domain / CC0');
    expect(readExifTag(app1, 0x8298)).toContain('metmuseum.org');
    expect(readExifTag(app1, 0x0131)).toBe('Framio');
  });
});

describe('XMP', () => {
  it('produces parseable XML with escaped, credited fields', () => {
    const packet = buildXmpPacket({
      ...meta,
      title: 'A & B <"quote">',
    });
    const doc = new DOMParser().parseFromString(packet, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(packet).toContain('&amp;');
    expect(packet).toContain('&lt;');
    expect(packet).toContain(
      'creativecommons.org/publicdomain/zero/1.0/',
    );
    // The accessibility description travels inside the file.
    expect(packet).toContain('windblown wheat field');
  });

  it('keeps the XMP segment within the 64KB JPEG limit for a long description', () => {
    const app1 = buildXmpApp1({ ...meta, description: 'x'.repeat(50_000) });
    expect(app1.length).toBeLessThan(0xffff);
  });
});

/** A minimal valid JPEG: SOI + APP0(JFIF) + EOI. */
function stubJpeg(): Blob {
  const app0 = [
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  ];
  const bytes = new Uint8Array([0xff, 0xd8, ...app0, 0xff, 0xd9]);
  return new Blob([bytes], { type: 'image/jpeg' });
}

describe('embedJpegMetadata', () => {
  it('inserts EXIF, XMP, and COM after the JFIF APP0', async () => {
    const out = new Uint8Array(await (await embedJpegMetadata(stubJpeg(), meta)).arrayBuffer());
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
    // SOI (2) + APP0 segment (marker 2 + length 16 = 18) → our APP1 at byte 20.
    const afterApp0 = 2 + 18;
    expect(out[afterApp0]).toBe(0xff);
    expect(out[afterApp0 + 1]).toBe(0xe1);
    const text = new TextDecoder('latin1').decode(out);
    expect(text).toContain('Exif');
    expect(text).toContain('xmpmeta');
    expect(text).toContain('Wheat Field with Cypresses');
  });

  it('returns the original blob unchanged on a non-JPEG input', async () => {
    const notJpeg = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' });
    const out = await embedJpegMetadata(notJpeg, meta);
    const bytes = new Uint8Array(await out.arrayBuffer());
    expect(Array.from(bytes)).toEqual([1, 2, 3, 4]);
  });

  it('an uploaded image never carries a CC0 claim', async () => {
    const out = await embedJpegMetadata(stubJpeg(), uploadMetadata('My photo'));
    const text = new TextDecoder('latin1').decode(new Uint8Array(await out.arrayBuffer()));
    expect(text).not.toContain('CC0');
    expect(text).not.toContain('publicdomain/zero');
    expect(text).toContain('My photo');
  });
});
