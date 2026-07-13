import type { Artwork, ArtColor, ArtSource } from './types';
import { mapMetObject } from './met';
import { colorDistance, fitsFrame } from './curation';
import { applyCommunityText } from './descriptions';

/**
 * Multi-museum art search — runs entirely in the browser.
 *
 * Every source here is keyless and CORS-enabled, so Discover can query them
 * directly from a static build. Results are normalised to the shared `Artwork`
 * shape and interleaved so no single museum dominates the grid.
 *
 *   • The Met            — collectionapi.metmuseum.org   (~half a million works)
 *   • Art Institute      — api.artic.edu                 (strong Impressionism)
 *   • Cleveland Museum   — openaccess-api.clevelandart.org
 *   • SMK (Denmark)      — api.smk.dk                     (Statens Museum for Kunst)
 *   • Wikimedia Commons  — commons.wikimedia.org          (broad public-domain backstop)
 *
 * Each museum is a small `MuseumAdapter`. Adding one is local: implement the
 * adapter and register it in `ADAPTERS`. Sources whose image host blocks
 * hotlinking (see `imagesReliable`) are kept out of the default grid so the
 * Discover wall never fills with title-only blanks, but stay available as a
 * filter toggle and for features only they power (e.g. AIC's colour browse).
 *
 * Key-gated institutions (Rijksmuseum, Harvard, Smithsonian, Europeana) follow
 * the same interface and register only when their `NEXT_PUBLIC_*` key is set
 * (see the conditional spread in `ADAPTERS`). NGA publishes CSV opendata that
 * needs build-time ingestion — a Phase 2 source, not a live browser adapter.
 */

export type MuseumSource = Exclude<ArtSource, 'upload'>;

/* --------------------------------------------------------------- image proxy */

/**
 * Some museum image hosts (notably the Art Institute of Chicago's IIIF server)
 * now sit behind Cloudflare bot protection and answer hotlinked `<img>`
 * requests with a 403 challenge page instead of the picture. Point
 * `NEXT_PUBLIC_IMAGE_PROXY` at a proxy you control (e.g. a free Cloudflare
 * Worker) to route those images through it. Use a `{url}` placeholder for the
 * encoded source, or omit it to have the encoded URL appended.
 */
const IMAGE_PROXY = process.env.NEXT_PUBLIC_IMAGE_PROXY?.trim() ?? '';
export const imageProxyEnabled = IMAGE_PROXY.length > 0;

export function proxyImage(url: string): string {
  if (!IMAGE_PROXY || !url) return url;
  return IMAGE_PROXY.includes('{url}')
    ? IMAGE_PROXY.replace('{url}', encodeURIComponent(url))
    : IMAGE_PROXY + encodeURIComponent(url);
}

/* ----------------------------------------------------------- adapter contract */

interface SourcePage {
  artworks: Artwork[];
  /** Opaque per-source paging state, handed back on the next call. */
  next: unknown;
  hasMore: boolean;
}

interface MuseumAdapter {
  id: MuseumSource;
  label: string;
  short: string;
  /**
   * False when the source's image host blocks hotlinking. Such sources are
   * dropped from the default grid (but stay toggleable) unless an image proxy
   * is configured.
   */
  imagesReliable: boolean;
  /** Publishes a dominant colour per work — drives browse-by-colour. */
  hasColor?: boolean;
  search(query: SearchQuery, cursor: unknown, signal?: AbortSignal): Promise<SourcePage>;
  getById(id: string, signal?: AbortSignal): Promise<Artwork | null>;
}

export interface SearchQuery {
  /** Free-text keyword (title, subject, school/movement all fold into this). */
  q?: string;
  /** Artist name or culture. */
  artistOrCulture?: string;
  /** Medium / classification keyword. */
  medium?: string;
  /** Date range (years; negative = BCE). */
  dateBegin?: number;
  dateEnd?: number;
  /** Limit to CC0 / open-access works (the only ones exportable to a Frame). */
  publicDomainOnly?: boolean;
  /** Keep only works that crop cleanly onto the Frame's 16:9 (where known). */
  aspectFit?: boolean;
  /** Rank results by perceptual distance to this colour (browse-by-colour). */
  color?: ArtColor;
  /** Which museums to query. Defaults to the image-reliable set. */
  sources?: MuseumSource[];
}

/** Opaque paging state, one entry per source, threaded through "Load more". */
export interface SearchCursor {
  [source: string]: unknown;
  /** Colour browse pools a ranked list once, then pages through it locally. */
  color?: { pool: Artwork[]; offset: number };
}

export interface SearchResult {
  artworks: Artwork[];
  cursor: SearchCursor;
  hasMore: boolean;
}

const PER_SOURCE = 12;
const MET_RESOLVE_CONCURRENCY = 6;

const MET_BASE =
  process.env.NEXT_PUBLIC_MET_API_BASE ??
  'https://collectionapi.metmuseum.org/public/collection/v1';
const AIC_BASE = 'https://api.artic.edu/api/v1/artworks';
const CMA_BASE = 'https://openaccess-api.clevelandart.org/api/artworks';
const SMK_BASE = 'https://api.smk.dk/api/v1/art';
const WIKI_BASE = 'https://commons.wikimedia.org/w/api.php';

/* ----------------------------------------------------------------- helpers */

/** A single keyword string folding the query's text parts together. */
function keyword(query: SearchQuery): string {
  return [query.q, query.artistOrCulture, query.medium]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function firstLine(s?: string): string {
  return (s ?? '').split('\n')[0]?.trim() ?? '';
}

function stripHtml(s?: string): string {
  return (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Cap museum prose at a readable length, cutting at a sentence boundary where
 * one exists. Keeps descriptions honest paragraphs, not essays — and keeps the
 * XMP packet they travel in (lib/studio/metadata.ts) comfortably small.
 */
const MAX_DESCRIPTION = 1200;
export function clampText(s: string, max = MAX_DESCRIPTION): string {
  const text = s.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > max * 0.5) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------- Met */

interface MetCursor {
  ids: number[];
  offset: number;
}

function metSearchUrl(query: SearchQuery): string {
  const p = new URLSearchParams();
  p.set('q', query.q?.trim() || '*');
  p.set('hasImages', 'true');
  if (query.publicDomainOnly) p.set('isPublicDomain', 'true');
  if (query.artistOrCulture) p.set('artistOrCulture', query.artistOrCulture);
  if (query.medium) p.set('medium', query.medium);
  if (query.dateBegin != null && query.dateEnd != null) {
    p.set('dateBegin', String(query.dateBegin));
    p.set('dateEnd', String(query.dateEnd));
  }
  return `${MET_BASE}/search?${p.toString()}`;
}

async function metResolve(
  id: number | string,
  signal?: AbortSignal,
): Promise<Artwork | null> {
  const o = await getJson<Record<string, unknown>>(
    `${MET_BASE}/objects/${id}`,
    signal,
  );
  if (!o || !o.objectID) return null;
  const art = mapMetObject(o as never);
  return art.imageUrl ? art : null;
}

/** Resolve a batch of Met ids to artworks, preserving order, dropping blanks. */
async function metResolveMany(
  ids: (number | string)[],
  signal?: AbortSignal,
): Promise<Artwork[]> {
  const out = new Array<Artwork | null>(ids.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < ids.length) {
      const i = next++;
      out[i] = await metResolve(ids[i], signal);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(MET_RESOLVE_CONCURRENCY, ids.length) }, worker),
  );
  return out.filter((a): a is Artwork => a !== null);
}

async function metPage(
  query: SearchQuery,
  cursor: unknown,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const c = cursor as MetCursor | undefined;
  let ids = c?.ids;
  let offset = c?.offset ?? 0;
  if (!ids) {
    const data = await getJson<{ objectIDs: number[] | null }>(
      metSearchUrl(query),
      signal,
    );
    ids = data?.objectIDs ?? [];
    offset = 0;
  }
  // Over-fetch a little: some objects resolve without a usable image.
  const slice = ids.slice(offset, offset + PER_SOURCE * 2);
  const artworks = (await metResolveMany(slice, signal)).slice(0, PER_SOURCE);
  const nextOffset = offset + slice.length;
  return {
    artworks,
    next: { ids, offset: nextOffset } satisfies MetCursor,
    hasMore: nextOffset < ids.length,
  };
}

/* --------------------------------------------------- Art Institute (Chicago) */

interface AicItem {
  id: number;
  title?: string;
  artist_title?: string;
  artist_display?: string;
  date_display?: string;
  medium_display?: string;
  image_id?: string | null;
  is_public_domain?: boolean;
  department_title?: string;
  /** AIC's published dominant colour. */
  color?: { h?: number; s?: number; l?: number } | null;
  /** `alt_text` is AIC's curated visual description of the image. */
  thumbnail?: { width?: number; height?: number; alt_text?: string | null } | null;
  /** Long curatorial text (CC-BY per AIC's API terms; shown with credit). */
  description?: string | null;
  short_description?: string | null;
}

interface AicCursor {
  page: number;
  totalPages: number;
}

const AIC_FIELDS =
  'id,title,artist_title,artist_display,date_display,medium_display,image_id,is_public_domain,department_title,color,thumbnail,description,short_description';

function aicImage(imageId: string, size: number | 'full'): string {
  const region = size === 'full' ? 'full' : `${size},`;
  // AIC's IIIF host sits behind Cloudflare bot protection that 403s hotlinks,
  // so route it through the configured proxy when one is set.
  return proxyImage(
    `https://www.artic.edu/iiif/2/${imageId}/full/${region}/0/default.jpg`,
  );
}

export function mapAic(it: AicItem): Artwork | null {
  if (!it.image_id) return null;
  const w = it.thumbnail?.width;
  const h = it.thumbnail?.height;
  const aspect = w && h ? w / h : undefined;
  const color =
    it.color && typeof it.color.h === 'number'
      ? { h: it.color.h, s: it.color.s ?? 0, l: it.color.l ?? 0 }
      : undefined;
  const description = stripHtml(it.short_description || it.description || '');
  return {
    id: `aic:${it.id}`,
    source: 'aic',
    sourceId: String(it.id),
    title: it.title?.trim() || 'Untitled',
    artist: it.artist_title?.trim() || firstLine(it.artist_display) || 'Unknown artist',
    year: it.date_display?.trim() || '',
    medium: it.medium_display?.trim() || '',
    museum: 'Art Institute of Chicago',
    department: it.department_title || undefined,
    rights: it.is_public_domain ? 'Public Domain · CC0' : undefined,
    isPublicDomain: Boolean(it.is_public_domain),
    imageUrl: aicImage(it.image_id, 1686),
    thumbUrl: aicImage(it.image_id, 400),
    objectUrl: `https://www.artic.edu/artworks/${it.id}`,
    width: w,
    height: h,
    aspect,
    color,
    description: description ? clampText(description) : undefined,
    altText: it.thumbnail?.alt_text?.trim() || undefined,
    descriptionSource: description ? 'museum' : undefined,
  };
}

async function aicPage(
  query: SearchQuery,
  cursor: unknown,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const c = cursor as AicCursor | undefined;
  const page = c ? c.page + 1 : 1;
  const p = new URLSearchParams();
  const kw = keyword(query);
  if (kw) p.set('q', kw);
  p.set('fields', AIC_FIELDS);
  p.set('limit', String(PER_SOURCE));
  p.set('page', String(page));
  if (query.publicDomainOnly) p.set('query[term][is_public_domain]', 'true');
  const data = await getJson<{
    data: AicItem[];
    pagination?: { total_pages?: number };
  }>(`${AIC_BASE}/search?${p.toString()}`, signal);
  const items = data?.data ?? [];
  const totalPages = data?.pagination?.total_pages ?? page;
  const artworks = items.map(mapAic).filter((a): a is Artwork => a !== null);
  return {
    artworks,
    next: { page, totalPages } satisfies AicCursor,
    hasMore: page < totalPages,
  };
}

async function getAic(id: string, signal?: AbortSignal): Promise<Artwork | null> {
  const data = await getJson<{ data: AicItem }>(
    `${AIC_BASE}/${id}?fields=${AIC_FIELDS}`,
    signal,
  );
  return data?.data ? mapAic(data.data) : null;
}

/* ------------------------------------------------------ Cleveland Museum of Art */

interface CmaImage {
  url?: string;
}
interface CmaItem {
  id: number;
  title?: string;
  creators?: { description?: string }[];
  creation_date?: string;
  technique?: string;
  department?: string;
  url?: string;
  share_license_status?: string;
  images?: { web?: CmaImage; print?: CmaImage; full?: CmaImage };
  description?: string | null;
  did_you_know?: string | null;
}

interface CmaCursor {
  skip: number;
  total: number;
}

const CMA_FIELDS =
  'id,title,creators,creation_date,technique,department,url,share_license_status,images,description,did_you_know';

export function mapCma(it: CmaItem): Artwork | null {
  const thumb = it.images?.web?.url;
  // `print` is a high-res JPEG; `full` is a huge multi-hundred-MB TIFF — avoid it.
  const full = it.images?.print?.url || thumb;
  if (!thumb || !full) return null;
  const cc0 = (it.share_license_status || '').toUpperCase() === 'CC0';
  // Cleveland's wall text, with its "did you know" aside as a second paragraph.
  const description = [stripHtml(it.description ?? ''), stripHtml(it.did_you_know ?? '')]
    .filter(Boolean)
    .join('\n\n');
  return {
    id: `cma:${it.id}`,
    source: 'cma',
    sourceId: String(it.id),
    title: it.title?.trim() || 'Untitled',
    artist: firstLine(it.creators?.[0]?.description).replace(/\s*\(.*\)\s*$/, '') || 'Unknown artist',
    year: it.creation_date?.trim() || '',
    medium: it.technique?.trim() || '',
    museum: 'Cleveland Museum of Art',
    department: it.department || undefined,
    rights: cc0 ? 'Public Domain · CC0' : it.share_license_status || undefined,
    isPublicDomain: cc0,
    imageUrl: full,
    thumbUrl: thumb,
    objectUrl: it.url || undefined,
    description: description ? clampText(description) : undefined,
    descriptionSource: description ? 'museum' : undefined,
  };
}

async function cmaPage(
  query: SearchQuery,
  cursor: unknown,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const c = cursor as CmaCursor | undefined;
  const skip = c ? c.skip + PER_SOURCE : 0;
  const p = new URLSearchParams();
  const kw = keyword(query);
  if (kw) p.set('q', kw);
  p.set('fields', CMA_FIELDS);
  p.set('has_image', '1');
  p.set('limit', String(PER_SOURCE));
  p.set('skip', String(skip));
  if (query.publicDomainOnly) p.set('cc0', '1');
  const data = await getJson<{ data: CmaItem[]; info?: { total?: number } }>(
    `${CMA_BASE}?${p.toString()}`,
    signal,
  );
  const items = data?.data ?? [];
  const total = data?.info?.total ?? skip + items.length;
  const artworks = items.map(mapCma).filter((a): a is Artwork => a !== null);
  return {
    artworks,
    next: { skip, total } satisfies CmaCursor,
    hasMore: skip + PER_SOURCE < total,
  };
}

async function getCma(id: string, signal?: AbortSignal): Promise<Artwork | null> {
  const data = await getJson<{ data: CmaItem }>(
    `${CMA_BASE}/${id}?fields=${CMA_FIELDS}`,
    signal,
  );
  return data?.data ? mapCma(data.data) : null;
}

/* -------------------------------------------- SMK — Statens Museum for Kunst */

interface SmkItem {
  object_number?: string;
  titles?: { title?: string }[];
  artist?: string[];
  production?: { creator?: string }[];
  production_date?: { period?: string; start?: string }[];
  techniques?: string[];
  image_thumbnail?: string;
  image_width?: number;
  image_height?: number;
  frontend_url?: string;
  public_domain?: boolean;
  /** Free-prose notes; often Danish. Shown with an SMK credit. */
  content_description?: string[] | null;
  labels?: { text?: string }[] | null;
}

interface SmkCursor {
  offset: number;
  found: number;
}

/**
 * SMK's search index no longer accepts `frontend_url` in `fields` (and `lang`
 * breaks `production_date` / `frontend_url` suffixing), so the canonical page
 * URL is built from the object number instead and `lang` is never sent.
 */
const SMK_FIELDS =
  'object_number,titles,artist,production,production_date,techniques,image_thumbnail,image_width,image_height,public_domain,content_description,labels';

/** SMK thumbnails are IIIF (`/full/!1024,/…`); swap the size segment. */
function smkImage(thumb: string, size: number): string {
  return thumb.replace(/\/full\/!?\d+,?\//, `/full/!${size},/`);
}

export function mapSmk(it: SmkItem): Artwork | null {
  const thumb = it.image_thumbnail;
  if (!thumb || !it.object_number) return null;
  const w = it.image_width;
  const h = it.image_height;
  const aspect = w && h ? w / h : undefined;
  const date = it.production_date?.[0];
  const description =
    it.content_description?.find((s) => s?.trim())?.trim() ||
    it.labels?.find((l) => l.text?.trim())?.text?.trim() ||
    '';
  return {
    id: `smk:${it.object_number}`,
    source: 'smk',
    sourceId: it.object_number,
    title: it.titles?.[0]?.title?.trim() || 'Untitled',
    artist:
      it.artist?.[0]?.trim() ||
      it.production?.[0]?.creator?.trim() ||
      'Unknown artist',
    year: date?.period?.trim() || date?.start?.slice(0, 4) || '',
    medium: it.techniques?.[0]?.trim() || '',
    museum: 'Statens Museum for Kunst',
    rights: it.public_domain ? 'Public Domain · CC0' : undefined,
    isPublicDomain: Boolean(it.public_domain),
    imageUrl: smkImage(thumb, 1686),
    thumbUrl: smkImage(thumb, 400),
    objectUrl:
      it.frontend_url ||
      `https://open.smk.dk/artwork/image/${encodeURIComponent(it.object_number)}`,
    width: w,
    height: h,
    aspect,
    description: description ? clampText(description) : undefined,
    descriptionSource: description ? 'museum' : undefined,
  };
}

async function smkPage(
  query: SearchQuery,
  cursor: unknown,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const c = cursor as SmkCursor | undefined;
  const offset = c ? c.offset + PER_SOURCE : 0;
  const p = new URLSearchParams();
  p.set('keys', keyword(query) || '*');
  // SMK carries plenty of non-open works; the Frame use-case only wants CC0/PD.
  p.set('filters', '[has_image:true],[public_domain:true]');
  p.set('offset', String(offset));
  p.set('rows', String(PER_SOURCE));
  p.set('fields', SMK_FIELDS);
  const data = await getJson<{ found?: number; items?: SmkItem[] }>(
    `${SMK_BASE}/search/?${p.toString()}`,
    signal,
  );
  const items = data?.items ?? [];
  const found = data?.found ?? offset + items.length;
  const artworks = items.map(mapSmk).filter((a): a is Artwork => a !== null);
  return {
    artworks,
    next: { offset, found } satisfies SmkCursor,
    hasMore: offset + PER_SOURCE < found,
  };
}

async function getSmk(id: string, signal?: AbortSignal): Promise<Artwork | null> {
  const data = await getJson<{ items?: SmkItem[] }>(
    `${SMK_BASE}/?object_number=${encodeURIComponent(id)}&fields=${SMK_FIELDS}&lang=en`,
    signal,
  );
  const it = data?.items?.[0];
  return it ? mapSmk(it) : null;
}

/* ----------------------------------------------------- Wikimedia Commons */

interface WikiPage {
  title?: string;
  imageinfo?: {
    url?: string;
    thumburl?: string;
    width?: number;
    height?: number;
    descriptionshorturl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

interface WikiCursor {
  offset: number;
}

/**
 * A robust large render via Special:FilePath, which clamps `width` to the
 * original and always resolves to a real image — hand-built thumbnail widths
 * (e.g. `…/1686px-Name.jpg`) can 400 on Commons. `fileTitle` keeps its
 * "File:" prefix, stripped here.
 */
function wikiFilePath(fileTitle: string, width: number): string {
  const name = fileTitle.replace(/^File:/, '');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    name,
  )}?width=${width}`;
}

export function mapWiki(p: WikiPage): Artwork | null {
  const ii = p.imageinfo?.[0];
  if (!ii?.thumburl || !p.title) return null;
  const em = ii.extmetadata ?? {};
  const w = ii.width;
  const h = ii.height;
  const aspect = w && h ? w / h : undefined;
  const fileTitle = p.title;
  const title =
    stripHtml(em.ObjectName?.value) ||
    fileTitle.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').trim() ||
    'Untitled';
  const license = stripHtml(em.LicenseShortName?.value);
  const description = stripHtml(em.ImageDescription?.value);
  return {
    id: `wiki:${fileTitle}`,
    source: 'wiki',
    sourceId: fileTitle,
    title,
    artist: stripHtml(em.Artist?.value) || 'Unknown artist',
    year: stripHtml(em.DateTimeOriginal?.value) || '',
    medium: stripHtml(em.Medium?.value) || '',
    museum: stripHtml(em.Attribution?.value) || 'Wikimedia Commons',
    rights: license || 'Public Domain',
    // We constrain the search to PD-licensed files (P6216=Q19652).
    isPublicDomain: true,
    imageUrl: wikiFilePath(fileTitle, 1600),
    thumbUrl: ii.thumburl,
    objectUrl:
      ii.descriptionshorturl ||
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle)}`,
    width: w,
    height: h,
    aspect,
    description: description ? clampText(description) : undefined,
    descriptionSource: description ? 'museum' : undefined,
  };
}

function wikiParams(): URLSearchParams {
  const p = new URLSearchParams();
  p.set('action', 'query');
  p.set('format', 'json');
  // Required for anonymous cross-origin requests to the MediaWiki API.
  p.set('origin', '*');
  p.set('prop', 'imageinfo');
  p.set('iiprop', 'url|size|extmetadata');
  p.set('iiurlwidth', '400');
  return p;
}

async function wikiPage(
  query: SearchQuery,
  cursor: unknown,
  signal?: AbortSignal,
): Promise<SourcePage> {
  const c = cursor as WikiCursor | undefined;
  const offset = c?.offset ?? 0;
  const kw = keyword(query);
  // Namespace 6 = File; P6216=Q19652 = copyright status "public domain".
  const term = `${kw || 'painting'} haswbstatement:P6216=Q19652`;
  const p = wikiParams();
  p.set('generator', 'search');
  p.set('gsrsearch', term);
  p.set('gsrnamespace', '6');
  p.set('gsrlimit', String(PER_SOURCE));
  if (offset) p.set('gsroffset', String(offset));
  const data = await getJson<{
    continue?: { gsroffset?: number };
    query?: { pages?: Record<string, WikiPage> };
  }>(`${WIKI_BASE}?${p.toString()}`, signal);
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const artworks = pages.map(mapWiki).filter((a): a is Artwork => a !== null);
  const nextOffset = data?.continue?.gsroffset;
  return {
    artworks,
    next: { offset: nextOffset ?? offset } satisfies WikiCursor,
    hasMore: typeof nextOffset === 'number',
  };
}

async function getWiki(id: string, signal?: AbortSignal): Promise<Artwork | null> {
  const p = wikiParams();
  p.set('titles', id);
  const data = await getJson<{ query?: { pages?: Record<string, WikiPage> } }>(
    `${WIKI_BASE}?${p.toString()}`,
    signal,
  );
  const page = data?.query?.pages ? Object.values(data.query.pages)[0] : undefined;
  return page ? mapWiki(page) : null;
}

/* --------------------------------------------------------- adapter registry */

const met: MuseumAdapter = {
  id: 'met',
  label: 'The Met',
  short: 'Met',
  imagesReliable: true,
  search: metPage,
  getById: (id, signal) => metResolve(id, signal),
};

const aic: MuseumAdapter = {
  id: 'aic',
  label: 'Art Institute of Chicago',
  short: 'Chicago',
  // AIC's IIIF host blocks hotlinks behind Cloudflare; only reliable via proxy.
  imagesReliable: imageProxyEnabled,
  hasColor: true,
  search: aicPage,
  getById: getAic,
};

const cma: MuseumAdapter = {
  id: 'cma',
  label: 'Cleveland Museum of Art',
  short: 'Cleveland',
  imagesReliable: true,
  search: cmaPage,
  getById: getCma,
};

const smk: MuseumAdapter = {
  id: 'smk',
  label: 'Statens Museum for Kunst',
  short: 'SMK',
  imagesReliable: true,
  search: smkPage,
  getById: getSmk,
};

const wiki: MuseumAdapter = {
  id: 'wiki',
  label: 'Wikimedia Commons',
  short: 'Commons',
  imagesReliable: true,
  search: wikiPage,
  getById: getWiki,
};

/**
 * Registered adapters. Key-gated institutions slot in here behind their env
 * keys, e.g.:
 *
 *   ...(process.env.NEXT_PUBLIC_RIJKS_KEY ? [rijks] : []),
 *   ...(process.env.NEXT_PUBLIC_HARVARD_KEY ? [harvard] : []),
 */
const ADAPTERS: MuseumAdapter[] = [met, aic, cma, smk, wiki];

const ADAPTER_BY_ID = new Map<MuseumSource, MuseumAdapter>(
  ADAPTERS.map((a) => [a.id, a]),
);

/** Source descriptors for the UI (filter chips, card badges). */
export const SOURCES: { id: MuseumSource; label: string; short: string }[] =
  ADAPTERS.map(({ id, label, short }) => ({ id, label, short }));

/** Every registered source — used to populate the museum filter. */
export const ALL_SOURCES: MuseumSource[] = ADAPTERS.map((a) => a.id);

/**
 * The default selection: sources whose images load reliably, so the resting
 * grid never fills with title-only blanks. Unreliable ones (AIC without a
 * proxy) stay available as a toggle and for colour browse.
 */
export const DEFAULT_SOURCES: MuseumSource[] = ADAPTERS.filter(
  (a) => a.imagesReliable,
).map((a) => a.id);

/** The colour-browse engine (the source that publishes dominant colour). */
const COLOR_SOURCE = ADAPTERS.find((a) => a.hasColor);

/* --------------------------------------------------------- colour browse */

/**
 * Browse-by-colour. The Art Institute of Chicago is the one keyless source that
 * publishes a dominant colour per work, so colour ranking pools a wide slice of
 * its catalogue (optionally narrowed by the active keyword) and sorts by
 * perceptual distance to the chosen swatch — Framio's keyless Art Palette.
 */
async function buildColorPool(
  query: SearchQuery,
  signal?: AbortSignal,
): Promise<Artwork[]> {
  const target = query.color!;
  const p = new URLSearchParams();
  const kw = keyword(query);
  if (kw) p.set('q', kw);
  p.set('fields', AIC_FIELDS);
  p.set('limit', '100');
  p.set('page', '1');
  if (query.publicDomainOnly) p.set('query[term][is_public_domain]', 'true');
  const data = await getJson<{ data: AicItem[] }>(
    `${AIC_BASE}/search?${p.toString()}`,
    signal,
  );
  const pool = (data?.data ?? [])
    .map(mapAic)
    .filter((a): a is Artwork => a !== null && a.color !== undefined);
  const filtered = query.aspectFit ? pool.filter((a) => fitsFrame(a.aspect)) : pool;
  return filtered
    .sort(
      (a, b) => colorDistance(a.color!, target) - colorDistance(b.color!, target),
    )
    .map(applyCommunityText);
}

/* ----------------------------------------------------------------- combined */

/** Interleave per-source lists round-robin, de-duplicating by id. */
function interleave(lists: Artwork[][]): Artwork[] {
  const out: Artwork[] = [];
  const seen = new Set<string>();
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      const art = list[i];
      if (art && !seen.has(art.id)) {
        seen.add(art.id);
        out.push(art);
      }
    }
  }
  return out;
}

/**
 * Run (or continue) a search across the selected museums. Pass the previous
 * `cursor` to fetch the next page of each source.
 */
export async function searchArtworks(
  query: SearchQuery,
  cursor?: SearchCursor,
  signal?: AbortSignal,
): Promise<SearchResult> {
  // Colour browse is its own path: pool the colour source once, then page it.
  if (query.color && COLOR_SOURCE) {
    const pool = cursor?.color?.pool ?? (await buildColorPool(query, signal));
    const offset = cursor?.color?.offset ?? 0;
    const slice = pool.slice(offset, offset + PER_SOURCE * 2);
    const nextOffset = offset + slice.length;
    return {
      artworks: slice,
      cursor: { color: { pool, offset: nextOffset } },
      hasMore: nextOffset < pool.length,
    };
  }

  const selected = query.sources?.length ? query.sources : DEFAULT_SOURCES;
  const active = ADAPTERS.filter((a) => selected.includes(a.id));
  const next: SearchCursor = {};
  const lists: Artwork[][] = [];
  let hasMore = false;

  await Promise.all(
    active.map(async (adapter) => {
      const r = await adapter.search(query, cursor?.[adapter.id], signal);
      lists.push(r.artworks);
      next[adapter.id] = r.next;
      hasMore = hasMore || r.hasMore;
    }),
  );

  let artworks = interleave(lists);
  // Frame-fit: drop works whose known aspect crops badly to 16:9. Works with no
  // known dimensions (e.g. the Met) are kept — we can't rule them out.
  if (query.aspectFit) {
    artworks = artworks.filter((a) => a.aspect == null || fitsFrame(a.aspect));
  }
  return { artworks: artworks.map(applyCommunityText), cursor: next, hasMore };
}

/* --------------------------------------------------- single artwork by id */

/** Resolve a composite id (`met:123`, `aic:456`, `smk:KMS1`, …) to an Artwork. */
export async function getArtwork(
  compositeId: string,
  signal?: AbortSignal,
): Promise<Artwork | null> {
  const sep = compositeId.indexOf(':');
  const source = (sep === -1 ? '' : compositeId.slice(0, sep)) as MuseumSource;
  const sourceId = sep === -1 ? compositeId : compositeId.slice(sep + 1);
  const adapter = ADAPTER_BY_ID.get(source);
  const art = adapter
    ? await adapter.getById(sourceId, signal)
    : // Bare id (no source prefix) → the Met, preserving older deep links.
      await metResolve(compositeId, signal);
  return art ? applyCommunityText(art) : null;
}
