import Image from 'next/image';
import Link from 'next/link';
import type { Artwork } from '@/lib/types';
import ArtworkActions from './ArtworkActions';

export default function ArtworkCard({ art }: { art: Artwork }) {
  return (
    <div className="group relative">
      <Link href={`/artwork/${art.sourceId}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden border border-stone bg-ivory">
          {art.thumbUrl && (
            <Image
              src={art.thumbUrl}
              alt={art.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
              className="object-cover transition-transform duration-700 ease-gallery group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-500 ease-gallery group-hover:opacity-100">
            <p className="truncate text-xs text-white/80">{art.artist}</p>
            <p className="truncate font-editorial text-sm text-white">{art.title}</p>
          </div>
        </div>
      </Link>
      <ArtworkActions art={art} />
    </div>
  );
}
