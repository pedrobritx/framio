'use client';

import type { Artwork } from '@/lib/types';
import { toggleFavorite, useIsFavorite } from '@/lib/store';
import { announce } from '@/lib/announce';
import { HeartIcon } from './icons';

/**
 * Heart toggle. `icon` is the small overlay used on cards; `full` is the labelled
 * button used on the Artwork Detail and Library screens.
 */
export default function FavoriteButton({
  art,
  variant = 'icon',
}: {
  art: Artwork;
  variant?: 'icon' | 'full';
}) {
  const active = useIsFavorite(art.id);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(art);
    announce(
      active
        ? `Removed from favorites — ${art.title}`
        : `Added to favorites — ${art.title}`,
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex items-center gap-2 border px-5 py-2.5 text-sm transition-colors duration-300 ease-gallery ${
          active
            ? 'border-brass bg-brass/10 text-brass-text'
            : 'border-stone hover:border-brass'
        }`}
      >
        <HeartIcon filled={active} className="text-base" />
        {active ? 'Favorited' : 'Favorite'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-base shadow-sm backdrop-blur transition-colors duration-300 ease-gallery hover:bg-paper ${
        active ? 'text-brass-text' : 'text-ink'
      }`}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
