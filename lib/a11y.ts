import type { Artwork } from './types';

/**
 * Alt text for an artwork image.
 *
 * Prefers a curated visual description (museum- or community-written). Failing
 * that, composes an honest caption from the metadata — and never ships the
 * placeholder junk ("Untitled by Unknown artist") that a bare title/artist
 * join produces.
 */
export function artAlt(art: Artwork): string {
  if (art.altText) return art.altText;

  const title = art.title && art.title !== 'Untitled' ? art.title : '';
  const artist =
    art.artist && art.artist !== 'Unknown artist' ? art.artist : '';
  const year = art.year?.trim() ?? '';

  const head = [title, artist].filter(Boolean).join(' — ');
  const dated = head && year ? `${head}, ${year}` : head;

  if (dated) return art.museum ? `${dated}. ${art.museum}.` : dated;
  // Nothing usable — say what we honestly know.
  return art.museum ? `Artwork from ${art.museum}` : 'Artwork';
}
