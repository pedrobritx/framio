import type { Artwork } from './types';
import data from '@/data/descriptions.json';

/**
 * Framio's open descriptions — community-written visual descriptions and alt
 * text, dedicated CC0, keyed by composite artwork id (`met:436535`).
 *
 * Museums that publish descriptions (AIC, Cleveland, SMK, Commons) are mapped
 * in their adapters; this dataset fills the gaps (the Met publishes none) and
 * can override museum text with descriptions written specifically for access.
 * See docs/DESCRIPTIONS.md for how to contribute an entry.
 */

export interface CommunityText {
  altText?: string;
  description?: string;
  contributor: string;
  lang: string;
}

const ENTRIES = data as Record<string, CommunityText | string>;

/** The community entry for a composite artwork id, if anyone has written one. */
export function communityText(id: string): CommunityText | undefined {
  const entry = ENTRIES[id];
  // `$comment` and any future metadata keys are strings — skip them.
  if (!entry || typeof entry === 'string') return undefined;
  return entry;
}

/**
 * Layer community-written text onto an artwork. Community text wins over
 * museum text: entries are purpose-written for access, not marketing copy.
 */
export function applyCommunityText(art: Artwork): Artwork {
  const entry = communityText(art.id);
  if (!entry) return art;
  return {
    ...art,
    altText: entry.altText ?? art.altText,
    description: entry.description ?? art.description,
    descriptionSource: entry.description ? 'community' : art.descriptionSource,
  };
}
