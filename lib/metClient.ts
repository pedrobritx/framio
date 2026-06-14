import { mapMetObject } from './met';
import type { Artwork } from './types';

/**
 * Browser-side Met search.
 *
 * The static build has no server at request time, but the Met Open Access API is
 * keyless and CORS-enabled, so Search runs directly from the browser. `/search`
 * returns objectIDs only; we resolve details for the visible slice on demand.
 */

const BASE =
  process.env.NEXT_PUBLIC_MET_API_BASE ??
  'https://collectionapi.metmuseum.org/public/collection/v1';

export interface SearchFilters {
  /** Free-text keyword (school/topic/title all fold into this). */
  q?: string;
  /** Artist name or culture (Met `artistOrCulture`). */
  artistOrCulture?: string;
  /** Medium (Met `medium`). */
  medium?: string;
  /** Met department id. */
  departmentId?: number;
  /** Date range (both required by the API when used). */
  dateBegin?: number;
  dateEnd?: number;
  /** Limit to CC0 / Open Access works (the only ones we can export). */
  publicDomainOnly?: boolean;
}

/** Run a search; returns matching Met object ids (most-relevant first). */
export async function searchIds(
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<number[]> {
  const p = new URLSearchParams();
  p.set('q', filters.q?.trim() || '*');
  p.set('hasImages', 'true');
  if (filters.publicDomainOnly) p.set('isPublicDomain', 'true');
  if (filters.artistOrCulture) p.set('artistOrCulture', filters.artistOrCulture);
  if (filters.medium) p.set('medium', filters.medium);
  if (filters.departmentId) p.set('departmentId', String(filters.departmentId));
  if (filters.dateBegin != null && filters.dateEnd != null) {
    p.set('dateBegin', String(filters.dateBegin));
    p.set('dateEnd', String(filters.dateEnd));
  }
  try {
    const res = await fetch(`${BASE}/search?${p.toString()}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { objectIDs: number[] | null };
    return data.objectIDs ?? [];
  } catch {
    return [];
  }
}

/** Resolve one object to an Artwork, or null when it has no usable image. */
export async function fetchObject(
  id: number | string,
  signal?: AbortSignal,
): Promise<Artwork | null> {
  try {
    const res = await fetch(`${BASE}/objects/${id}`, { signal });
    if (!res.ok) return null;
    const o = await res.json();
    if (!o || !o.objectID) return null;
    const art = mapMetObject(o);
    return art.imageUrl ? art : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a batch of ids to artworks (small concurrency, preserves input order).
 * Entries without an image are dropped.
 */
export async function fetchObjects(
  ids: (number | string)[],
  signal?: AbortSignal,
): Promise<Artwork[]> {
  const results = new Array<Artwork | null>(ids.length).fill(null);
  const CONCURRENCY = 6;
  let next = 0;

  async function worker() {
    while (next < ids.length) {
      const i = next++;
      results[i] = await fetchObject(ids[i], signal);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker),
  );
  return results.filter((a): a is Artwork => a !== null);
}
