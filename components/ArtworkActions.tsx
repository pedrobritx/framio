'use client';

import type { Artwork } from '@/lib/types';
import FavoriteButton from './FavoriteButton';
import CollectionPicker from './CollectionPicker';

/**
 * The quick-actions overlay shown on every artwork card: favorite + add to
 * collection. Visible on touch, fades in on hover (desktop).
 */
export default function ArtworkActions({ art }: { art: Artwork }) {
  return (
    <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5 opacity-100 transition-opacity duration-300 ease-gallery md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
      <FavoriteButton art={art} />
      <CollectionPicker art={art} />
    </div>
  );
}
