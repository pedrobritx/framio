import type { ArtColor } from './types';

/**
 * Framio's curation vocabulary — the "what are you in the mood for?" model.
 *
 * The best TV-art platforms (Samsung's Art Store, Google's Art Palette, Cosmos)
 * lead with *curation*, not a search box: rotating collections organised by mood,
 * colour, and theme. This module is that vocabulary. Each entry folds down to a
 * plain keyword/colour query the keyless museum adapters in `lib/sources.ts`
 * already understand, so the whole experience works on a static build.
 */

/* ------------------------------------------------------------------- moods */

export interface Mood {
  slug: string;
  label: string;
  blurb: string;
  /** Keyword(s) folded into the cross-museum search. */
  q: string;
  /** Tile wash — a soft gradient evoking the mood. */
  from: string;
  to: string;
}

export const MOODS: Mood[] = [
  {
    slug: 'calm',
    label: 'Calm',
    blurb: 'Still water, soft light, quiet rooms.',
    q: 'serene landscape water mist',
    from: '#a8c0d6',
    to: '#e7e2d9',
  },
  {
    slug: 'dramatic',
    label: 'Dramatic',
    blurb: 'Storms, shadow, and high contrast.',
    q: 'storm dramatic dark sky',
    from: '#3a3f4b',
    to: '#9a7b4f',
  },
  {
    slug: 'romantic',
    label: 'Romantic',
    blurb: 'Blossom, gardens, and golden hour.',
    q: 'romantic garden flowers',
    from: '#e0a8b8',
    to: '#f0d9c0',
  },
  {
    slug: 'mysterious',
    label: 'Mysterious',
    blurb: 'Night scenes and deep interiors.',
    q: 'night nocturne moonlight',
    from: '#2b3148',
    to: '#5a4a6a',
  },
  {
    slug: 'joyful',
    label: 'Joyful',
    blurb: 'Bright colour and open air.',
    q: 'bright vivid flowers festival',
    from: '#f2b134',
    to: '#e8745b',
  },
  {
    slug: 'serene',
    label: 'Serene',
    blurb: 'Minimal, meditative, spacious.',
    q: 'minimal misty mountains',
    from: '#cdd8d3',
    to: '#eef0ec',
  },
  {
    slug: 'opulent',
    label: 'Opulent',
    blurb: 'Gold, baroque, and grandeur.',
    q: 'baroque gold ornate interior',
    from: '#7a5c2e',
    to: '#d9b870',
  },
  {
    slug: 'wild',
    label: 'Wild',
    blurb: 'Untamed nature and open seas.',
    q: 'wilderness seascape mountains',
    from: '#2f5d50',
    to: '#7aa37f',
  },
];

export function moodBySlug(slug: string | null | undefined): Mood | undefined {
  return MOODS.find((m) => m.slug === slug);
}

/* ------------------------------------------------------------------ colours */

export interface Swatch {
  slug: string;
  label: string;
  hex: string;
  hsl: ArtColor;
}

/**
 * Browse-by-colour palette. The Art Institute of Chicago publishes a dominant
 * colour per work; picking a swatch ranks works by perceptual distance to it
 * (see `colorDistance`). This is the keyless analogue of Google's Art Palette.
 */
export const COLORS: Swatch[] = [
  { slug: 'crimson', label: 'Crimson', hex: '#9e2b25', hsl: { h: 3, s: 61, l: 38 } },
  { slug: 'amber', label: 'Amber', hex: '#c8862a', hsl: { h: 35, s: 65, l: 47 } },
  { slug: 'gold', label: 'Gold', hex: '#d9b24a', hsl: { h: 45, s: 65, l: 57 } },
  { slug: 'olive', label: 'Olive', hex: '#7a7d3c', hsl: { h: 62, s: 35, l: 36 } },
  { slug: 'forest', label: 'Forest', hex: '#3a6a4a', hsl: { h: 140, s: 30, l: 32 } },
  { slug: 'teal', label: 'Teal', hex: '#2f7d80', hsl: { h: 182, s: 46, l: 34 } },
  { slug: 'sky', label: 'Sky', hex: '#6fa8c7', hsl: { h: 200, s: 42, l: 61 } },
  { slug: 'indigo', label: 'Indigo', hex: '#324a8a', hsl: { h: 224, s: 47, l: 37 } },
  { slug: 'violet', label: 'Violet', hex: '#6a4a8a', hsl: { h: 268, s: 30, l: 42 } },
  { slug: 'rose', label: 'Rose', hex: '#c47a8a', hsl: { h: 345, s: 38, l: 62 } },
  { slug: 'sand', label: 'Sand', hex: '#cdbb98', hsl: { h: 41, s: 36, l: 70 } },
  { slug: 'charcoal', label: 'Charcoal', hex: '#3a3a3c', hsl: { h: 240, s: 3, l: 23 } },
];

export function colorBySlug(slug: string | null | undefined): Swatch | undefined {
  return COLORS.find((c) => c.slug === slug);
}

/**
 * Perceptual-ish distance between two HSL colours. Hue is treated as a circle
 * and down-weighted for near-greys (low saturation), so a muted slate doesn't
 * read as "blue". Good enough to rank a grid by colour without a LAB pipeline.
 */
export function colorDistance(a: ArtColor, b: ArtColor): number {
  let dh = Math.abs(a.h - b.h) % 360;
  if (dh > 180) dh = 360 - dh;
  const sat = Math.min(a.s, b.s) / 100; // hue matters less when either is grey
  const hueTerm = (dh / 180) * sat;
  const satTerm = Math.abs(a.s - b.s) / 100;
  const litTerm = Math.abs(a.l - b.l) / 100;
  return hueTerm * 1.6 + satTerm * 0.7 + litTerm * 1.0;
}

/* ------------------------------------------------------------- exhibitions */

export interface Exhibition {
  slug: string;
  title: string;
  blurb: string;
  /** Keyword query driving the collection. */
  q: string;
  /** Optional artist/culture anchor. */
  artistOrCulture?: string;
  from: string;
  to: string;
}

/** Curated "exhibitions" — rotating themed sets, the Art Store's core loop. */
export const EXHIBITIONS: Exhibition[] = [
  {
    slug: 'seascapes',
    title: 'Distant Shores',
    blurb: 'Seascapes, harbours, and open water.',
    q: 'seascape ship harbour ocean',
    from: '#2f6d8a',
    to: '#bcd2dc',
  },
  {
    slug: 'night-skies',
    title: 'After Dark',
    blurb: 'Moonlight, nocturnes, and city nights.',
    q: 'night nocturne moonlight stars',
    from: '#1f2438',
    to: '#4a5578',
  },
  {
    slug: 'botanicals',
    title: 'In Bloom',
    blurb: 'Flowers, gardens, and still-life botany.',
    q: 'flowers botanical still life',
    from: '#9a6f8a',
    to: '#e8c6cf',
  },
  {
    slug: 'ukiyo-e',
    title: 'Floating World',
    blurb: 'Japanese woodblock prints.',
    q: 'woodblock ukiyo-e landscape',
    artistOrCulture: 'Japanese',
    from: '#2f5d50',
    to: '#cdd8a0',
  },
  {
    slug: 'golden-hour',
    title: 'Golden Hour',
    blurb: 'Warm light over land and sky.',
    q: 'sunset golden landscape',
    from: '#b86a2e',
    to: '#f0c674',
  },
  {
    slug: 'quiet-interiors',
    title: 'Quiet Interiors',
    blurb: 'Still rooms and domestic light.',
    q: 'interior room still domestic',
    from: '#7a6f5e',
    to: '#ddd2c0',
  },
  {
    slug: 'grand-landscapes',
    title: 'Grand Landscapes',
    blurb: 'Mountains, valleys, and wide country.',
    q: 'mountains valley panoramic landscape',
    from: '#4a6b52',
    to: '#c2cbae',
  },
  {
    slug: 'portraits',
    title: 'Faces',
    blurb: 'Portraits across the centuries.',
    q: 'portrait',
    from: '#6a4a44',
    to: '#d8b8a8',
  },
];

export function exhibitionBySlug(
  slug: string | null | undefined,
): Exhibition | undefined {
  return EXHIBITIONS.find((e) => e.slug === slug);
}

/* ---------------------------------------------------------------- the Frame */

/** Every Samsung Frame is 16:9. */
export const FRAME_ASPECT = 16 / 9; // ≈ 1.778

/** Does a work crop onto the Frame without heavy loss? (lenient band) */
export function fitsFrame(aspect: number | undefined): boolean {
  if (!aspect) return false;
  return aspect >= 1.4 && aspect <= 2.1;
}
