import type { Artwork } from '@/lib/types';
import ArtworkCard from './ArtworkCard';

export default function ArtworkGrid({ artworks }: { artworks: Artwork[] }) {
  if (!artworks.length) {
    return (
      <p className="text-ink-soft">
        Couldn&apos;t reach the museum just now. Refresh to try again.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {artworks.map((art) => (
        <ArtworkCard key={art.id} art={art} />
      ))}
    </div>
  );
}
