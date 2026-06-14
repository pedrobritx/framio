'use client';

import type { Artwork } from '@/lib/types';
import FavoriteButton from './FavoriteButton';
import CollectionPicker from './CollectionPicker';

/** Favorite + Add-to-collection actions for the Artwork Detail sheet. */
export default function ArtworkDetailActions({ art }: { art: Artwork }) {
  return (
    <div className="flex flex-wrap gap-3">
      <FavoriteButton art={art} variant="full" />
      <CollectionPicker art={art} variant="full" />
    </div>
  );
}
