import { getFeatured } from './met';
import type { Artwork } from './types';

/**
 * The static showcase set.
 *
 * On GitHub Pages there is no server at request time, so every page that can be
 * reached has to be rendered at build time. This module resolves one curated set
 * of public-domain works from The Met and is the single source of truth for both
 * the Browse grid and `generateStaticParams` for `/artwork/[id]` — guaranteeing
 * that every card links to a page that actually exists in the export.
 */

const THEMES = [
  'landscape painting',
  'portrait',
  'still life',
  'impressionism',
  'japanese woodblock',
  'flowers',
] as const;

const PER_THEME = 10;

let cache: Artwork[] | null = null;

/** Curated, de-duplicated artworks across themes. Memoized per build process. */
export async function getGallery(): Promise<Artwork[]> {
  if (cache) return cache;

  const groups = await Promise.all(
    THEMES.map((theme) => getFeatured(theme, PER_THEME)),
  );

  const seen = new Set<string>();
  const all: Artwork[] = [];
  for (const group of groups) {
    for (const art of group) {
      if (art.imageUrl && !seen.has(art.sourceId)) {
        seen.add(art.sourceId);
        all.push(art);
      }
    }
  }

  cache = all;
  return all;
}

/** The hero, chosen deterministically per day from the curated set. */
export async function getHero(): Promise<Artwork | null> {
  const gallery = await getGallery();
  if (!gallery.length) return null;
  const seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  return gallery[seed % gallery.length];
}
