import type { Artwork } from './types';

/**
 * The Metropolitan Museum of Art — Open Access Collection API.
 * Keyless, CC0, ~80 req/s. https://metmuseum.github.io/
 *
 * `/search` returns objectIDs only, so we fetch object details for just the
 * visible slice and let Next's fetch cache (revalidate) keep us fast and well
 * under the rate limit.
 */

const BASE =
  process.env.MET_API_BASE ??
  'https://collectionapi.metmuseum.org/public/collection/v1';

const REVALIDATE = 60 * 60 * 24; // 24h — the collection is effectively static

interface MetObject {
  objectID: number;
  title?: string;
  artistDisplayName?: string;
  objectDate?: string;
  medium?: string;
  repository?: string;
  department?: string;
  isPublicDomain?: boolean;
  rightsAndReproduction?: string;
  primaryImage?: string;
  primaryImageSmall?: string;
  objectURL?: string;
}

export function mapMetObject(o: MetObject): Artwork {
  return {
    id: `met:${o.objectID}`,
    source: 'met',
    sourceId: String(o.objectID),
    title: o.title?.trim() || 'Untitled',
    artist: o.artistDisplayName?.trim() || 'Unknown artist',
    year: o.objectDate?.trim() || '',
    medium: o.medium?.trim() || '',
    museum: o.repository?.trim() || 'The Metropolitan Museum of Art',
    department: o.department || undefined,
    rights: o.isPublicDomain
      ? 'Public Domain · CC0'
      : o.rightsAndReproduction || undefined,
    isPublicDomain: Boolean(o.isPublicDomain),
    imageUrl: o.primaryImage || o.primaryImageSmall || '',
    thumbUrl: o.primaryImageSmall || o.primaryImage || '',
    objectUrl: o.objectURL || undefined,
  };
}

export async function searchObjectIds(
  query: string,
  opts?: { publicDomainOnly?: boolean },
): Promise<number[]> {
  const params = new URLSearchParams({ q: query, hasImages: 'true' });
  if (opts?.publicDomainOnly) params.set('isPublicDomain', 'true');
  try {
    const res = await fetch(`${BASE}/search?${params.toString()}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { objectIDs: number[] | null };
    return data.objectIDs ?? [];
  } catch {
    return [];
  }
}

export async function getObject(id: number | string): Promise<Artwork | null> {
  try {
    const res = await fetch(`${BASE}/objects/${id}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const o = (await res.json()) as MetObject;
    if (!o || !o.objectID) return null;
    const art = mapMetObject(o);
    return art.imageUrl ? art : null;
  } catch {
    return null;
  }
}

/** Fetch details for many ids with a small concurrency cap, keeping `limit` with images. */
export async function getObjects(
  ids: (number | string)[],
  limit = 12,
): Promise<Artwork[]> {
  const out: Artwork[] = [];
  const queue = [...ids];
  const CONCURRENCY = 6;

  async function worker() {
    while (queue.length && out.length < limit) {
      const id = queue.shift();
      if (id === undefined) return;
      const art = await getObject(id);
      if (art) out.push(art);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out.slice(0, limit);
}

/** A featured shelf: search, then resolve a varied slice to `count` artworks with images. */
export async function getFeatured(query: string, count = 12): Promise<Artwork[]> {
  const ids = await searchObjectIds(query, { publicDomainOnly: true });
  return getObjects(ids.slice(0, count * 4), count);
}

/** One hero work, chosen deterministically per day. */
export async function getArtworkOfDay(): Promise<Artwork | null> {
  const ids = await searchObjectIds('masterpiece painting', {
    publicDomainOnly: true,
  });
  if (!ids.length) return null;
  const seed = Number(
    new Date().toISOString().slice(0, 10).replace(/-/g, ''),
  );
  for (let i = 0; i < 6; i++) {
    const art = await getObject(ids[(seed + i) % ids.length]);
    if (art) return art;
  }
  return null;
}
