'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArtworkActions from '@/components/ArtworkActions';
import { useStore } from '@/lib/store';

type Tab = 'favorites' | 'uploads' | 'exports';

const TABS: { id: Tab; label: string }[] = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'exports', label: 'Exports' },
];

export default function LibraryPage() {
  const { favorites } = useStore();
  const [tab, setTab] = useState<Tab>('favorites');

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-2">
        <p className="eyebrow">Library</p>
        <h1 className="font-editorial text-4xl md:text-5xl">Your material</h1>
      </header>

      <div className="mt-6 flex gap-5 border-b border-stone">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'true' : undefined}
            className={`-mb-px border-b-2 pb-2 text-sm uppercase tracking-label transition-colors duration-300 ease-gallery ${
              tab === t.id ? 'border-brass text-brass' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
            {t.id === 'favorites' && favorites.length > 0 ? ` · ${favorites.length}` : ''}
          </button>
        ))}
      </div>

      <section className="mt-8">
        {tab === 'favorites' &&
          (favorites.length === 0 ? (
            <p className="text-ink-soft">
              No favorites yet. Tap the heart on any work while{' '}
              <Link href="/search" className="text-brass">
                browsing
              </Link>{' '}
              to keep it here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {favorites.map((art) => (
                <div key={art.id} className="group relative">
                  <Link href={`/artwork/${art.sourceId}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden border border-stone bg-ivory">
                      {art.thumbUrl && (
                        <Image
                          src={art.thumbUrl}
                          alt={art.title}
                          fill
                          sizes="(max-width: 640px) 50vw, 20vw"
                          className="object-cover transition-transform duration-700 ease-gallery group-hover:scale-[1.04]"
                        />
                      )}
                    </div>
                  </Link>
                  <ArtworkActions art={art} />
                </div>
              ))}
            </div>
          ))}

        {tab === 'uploads' && (
          <p className="max-w-xl text-ink-soft">
            Bring your own images — drag-and-drop your photos and they flow through Frame Studio
            exactly like museum works. Upload storage arrives with a connected Supabase project
            (see docs/ARCHITECTURE.md).
          </p>
        )}

        {tab === 'exports' && (
          <p className="max-w-xl text-ink-soft">
            Files you&apos;ve framed for the TV will be listed here. For now, each export downloads
            straight from Frame Studio as a {''}
            3840×2160 JPEG.
          </p>
        )}
      </section>
    </div>
  );
}
