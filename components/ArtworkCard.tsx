import Link from 'next/link';
import type { Artwork } from '@/lib/types';
import { artworkHref } from '@/lib/links';
import { fitsFrame } from '@/lib/curation';
import ArtworkActions from './ArtworkActions';
import ArtImage from './ArtImage';
import { SOURCES } from '@/lib/sources';

const SOURCE_LABEL: Record<string, string> = {
  ...Object.fromEntries(SOURCES.map((s) => [s.id, s.short])),
  upload: 'Upload',
};

export default function ArtworkCard({ art }: { art: Artwork }) {
  return (
    <div className="group relative">
      <Link href={artworkHref(art)} className="block">
        <div className="relative aspect-[4/5] overflow-hidden border border-stone bg-ivory">
          <ArtImage
            src={art.thumbUrl}
            alt={art.title}
            label={art.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-gallery group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-500 ease-gallery group-hover:opacity-100">
            <p className="truncate text-xs text-white/80">{art.artist}</p>
            <p className="truncate font-editorial text-sm text-white">{art.title}</p>
          </div>
          {SOURCE_LABEL[art.source] && (
            <span className="absolute left-2 top-2 rounded-full bg-paper/85 px-2 py-0.5 text-[0.6rem] uppercase tracking-label text-ink-soft backdrop-blur">
              {SOURCE_LABEL[art.source]}
            </span>
          )}
          {fitsFrame(art.aspect) && (
            <span
              className="absolute right-2 top-2 rounded-full bg-brass/90 px-2 py-0.5 text-[0.6rem] uppercase tracking-label text-paper backdrop-blur"
              title="Crops cleanly to your Frame's 16:9"
            >
              16:9
            </span>
          )}
        </div>
      </Link>
      <ArtworkActions art={art} />
    </div>
  );
}
