import type { Artwork } from './types';

/**
 * Internal link builders. The static export uses `trailingSlash`, and the
 * artwork/studio screens resolve their subject client-side from the query
 * string — so any source (Met, AIC, Cleveland, uploads) deep-links the same
 * way without needing a pre-rendered page per id.
 */

export function artworkHref(art: Artwork | string): string {
  const id = typeof art === 'string' ? art : art.id;
  return `/artwork/?id=${encodeURIComponent(id)}`;
}

export function studioHref(opts: {
  id?: string;
  src?: string;
  title?: string;
}): string {
  const p = new URLSearchParams();
  if (opts.id) p.set('id', opts.id);
  if (opts.src) p.set('src', opts.src);
  if (opts.title) p.set('title', opts.title);
  return `/studio/?${p.toString()}`;
}
