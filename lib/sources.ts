import type { Artwork, ArtColor, ArtSource } from './types';
import { mapMetObject } from './met';
import { colorDistance, fitsFrame } from './curation';

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
 *
 * More institutions (Getty, NGA, Smithsonian, Wikimedia…) need a server-side
 * proxy and slot in behind the same `SourceAdapter` interface.
 */

export type MuseumSource = Exclude<ArtSource, 'upload'>;

export const SOURCES: { id: MuseumSource; label: string; short: string }[] = [
  { id: 'met', label: 'The Met', short: 'Met' },
  { id: 'aic', label: 'Art Institute of Chicago', short: 'Chicago' },
  { id: 'cma', label: 'Cleveland Museum of Art', short: 'Cleveland' },
];

export const ALL_SOURCES: MuseumSource[] = SOURCES.map((s) => s.id);

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
  /** Which museums to query. Defaults to all. */
  sources?: MuseumSource[];
}

/** Opaque paging state, one entry per source, threaded through "Load more". */
export interface SearchCursor {
  met?: { ids: number[]; offset: number };
  aic?: { page: number; totalPages: number };
  cma?: { skip: number; total: number };
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
  cursor: SearchCursor['met'],
  signal?: AbortSignal,
): Promise<{ artworks: Artwork[]; next: SearchCursor['met']; hasMore: boolean }> {
  let ids = cursor?.ids;
  let offset = cursor?.offset ?? 0;
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
    next: { ids, offset: nextOffset },
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
  thumbnail?: { width?: number; height?: number } | null;
}

const AIC_FIELDS =
  'id,title,artist_title,artist_display,date_display,medium_display,image_id,is_public_domain,department_title,color,thumbnail';

function aicImage(imageId: string, size: number | 'full'): string {
  const region = size === 'full' ? 'full' : `${size},`;
  return `https://www.artic.edu/iiif/2/${imageId}/full/${region}/0/default.jpg`;
}

function mapAic(it: AicItem): Artwork | null {
  if (!it.image_id) return null;
  const w = it.thumbnail?.width;
  const h = it.thumbnail?.height;
  const aspect = w && h ? w / h : undefined;
  const color =
    it.color && typeof it.color.h === 'number'
      ? { h: it.color.h, s: it.color.s ?? 0, l: it.color.l ?? 0 }
      : undefined;
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
  };
}

async function aicPage(
  query: SearchQuery,
  cursor: SearchCursor['aic'],
  signal?: AbortSignal,
): Promise<{ artworks: Artwork[]; next: SearchCursor['aic']; hasMore: boolean }> {
  const page = cursor ? cursor.page + 1 : 1;
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
  const artworks = items
    .map(mapAic)
    .filter((a): a is Artwork => a !== null);
  return { artworks, next: { page, totalPages }, hasMore: page < totalPages };
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
}

const CMA_FIELDS =
  'id,title,creators,creation_date,technique,department,url,share_license_status,images';

function mapCma(it: CmaItem): Artwork | null {
  const thumb = it.images?.web?.url;
  // `print` is a high-res JPEG; `full` is a huge multi-hundred-MB TIFF — avoid it.
  const full = it.images?.print?.url || thumb;
  if (!thumb || !full) return null;
  const cc0 = (it.share_license_status || '').toUpperCase() === 'CC0';
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
  };
}

async function cmaPage(
  query: SearchQuery,
  cursor: SearchCursor['cma'],
  signal?: AbortSignal,
): Promise<{ artworks: Artwork[]; next: SearchCursor['cma']; hasMore: boolean }> {
  const skip = cursor ? cursor.skip + PER_SOURCE : 0;
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
    next: { skip, total },
    hasMore: skip + PER_SOURCE < total,
  };
}

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
  return filtered.sort(
    (a, b) => colorDistance(a.color!, target) - colorDistance(b.color!, target),
  );
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
  // Colour browse is its own path: pool AIC once, then page the ranked list.
  if (query.color) {
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

  const sources = query.sources?.length ? query.sources : ALL_SOURCES;
  const next: SearchCursor = {};
  const lists: Artwork[][] = [];
  let hasMore = false;

  const jobs: Promise<void>[] = [];

  if (sources.includes('met')) {
    jobs.push(
      metPage(query, cursor?.met, signal).then((r) => {
        lists.push(r.artworks);
        next.met = r.next;
        hasMore = hasMore || r.hasMore;
      }),
    );
  }
  if (sources.includes('aic')) {
    jobs.push(
      aicPage(query, cursor?.aic, signal).then((r) => {
        lists.push(r.artworks);
        next.aic = r.next;
        hasMore = hasMore || r.hasMore;
      }),
    );
  }
  if (sources.includes('cma')) {
    jobs.push(
      cmaPage(query, cursor?.cma, signal).then((r) => {
        lists.push(r.artworks);
        next.cma = r.next;
        hasMore = hasMore || r.hasMore;
      }),
    );
  }

  await Promise.all(jobs);
  let artworks = interleave(lists);
  // Frame-fit: drop works whose known aspect crops badly to 16:9. Works with no
  // known dimensions (e.g. the Met) are kept — we can't rule them out.
  if (query.aspectFit) {
    artworks = artworks.filter((a) => a.aspect == null || fitsFrame(a.aspect));
  }
  return { artworks, cursor: next, hasMore };
}

/* --------------------------------------------------- single artwork by id */

async function getAic(id: string, signal?: AbortSignal): Promise<Artwork | null> {
  const data = await getJson<{ data: AicItem }>(
    `${AIC_BASE}/${id}?fields=${AIC_FIELDS}`,
    signal,
  );
  return data?.data ? mapAic(data.data) : null;
}

async function getCma(id: string, signal?: AbortSignal): Promise<Artwork | null> {
  const data = await getJson<{ data: CmaItem }>(
    `${CMA_BASE}/${id}?fields=${CMA_FIELDS}`,
    signal,
  );
  return data?.data ? mapCma(data.data) : null;
}

/** Resolve a composite id (`met:123`, `aic:456`, `cma:789`) to an Artwork. */
export async function getArtwork(
  compositeId: string,
  signal?: AbortSignal,
): Promise<Artwork | null> {
  const sep = compositeId.indexOf(':');
  const source = (sep === -1 ? '' : compositeId.slice(0, sep)) as ArtSource;
  const sourceId = sep === -1 ? compositeId : compositeId.slice(sep + 1);
  switch (source) {
    case 'aic':
      return getAic(sourceId, signal);
    case 'cma':
      return getCma(sourceId, signal);
    case 'met':
    default:
      return metResolve(sourceId, signal);
  }
}
