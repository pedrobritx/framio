'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ArtworkDetailActions from '@/components/ArtworkDetailActions';
import { getArtwork } from '@/lib/sources';
import { getUpload } from '@/lib/store';
import { studioHref } from '@/lib/links';
import type { Artwork } from '@/lib/types';

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-t border-stone pt-3">
      <dt className="w-28 shrink-0 text-xs uppercase tracking-label text-ink-soft">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

type Status = 'loading' | 'ready' | 'missing';

function ArtworkInner() {
  const sp = useSearchParams();
  const id = sp.get('id') ?? '';
  const [art, setArt] = useState<Artwork | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!id) {
      setStatus('missing');
      return;
    }
    // Uploads live only in this browser — resolve them from the local store.
    if (id.startsWith('upload:')) {
      const upload = getUpload(id);
      setArt(upload ?? null);
      setStatus(upload ? 'ready' : 'missing');
      return;
    }
    let active = true;
    const ac = new AbortController();
    setStatus('loading');
    getArtwork(id, ac.signal)
      .then((resolved) => {
        if (!active) return;
        setArt(resolved);
        setStatus(resolved ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStatus('missing');
      });
    return () => {
      active = false;
      ac.abort();
    };
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="px-6 py-8 md:px-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:gap-12">
          <div className="aspect-[4/3] animate-pulse border border-stone bg-ivory md:min-h-[70vh]" />
          <div className="space-y-4">
            <div className="h-9 w-2/3 animate-pulse bg-ivory" />
            <div className="h-5 w-1/2 animate-pulse bg-ivory" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'missing' || !art) {
    return (
      <div className="max-w-2xl px-6 py-16 md:px-10 md:py-24">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-2 font-editorial text-4xl md:text-5xl">
          That work slipped off the wall
        </h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          We couldn&apos;t load this artwork. It may have left the open-access
          collection, or the link is incomplete.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass"
        >
          Back to Browse
        </Link>
      </div>
    );
  }

  const studio =
    art.source === 'upload'
      ? studioHref({ id: art.id, title: art.title })
      : studioHref({ src: art.imageUrl, title: art.title });

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <div className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:gap-12">
        <div className="relative aspect-[4/3] w-full overflow-hidden border border-stone bg-ivory md:aspect-auto md:min-h-[70vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art.imageUrl}
            alt={`${art.title} by ${art.artist}`}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        <aside className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-editorial text-3xl leading-tight md:text-4xl">
              {art.title}
            </h1>
            <p className="text-lg text-ink-soft">
              {art.artist}
              {art.year ? `, ${art.year}` : ''}
            </p>
          </div>

          <dl className="space-y-3 text-sm">
            {art.medium && <MetaRow label="Medium" value={art.medium} />}
            <MetaRow label="Museum" value={art.museum} />
            {art.department && <MetaRow label="Department" value={art.department} />}
            <MetaRow
              label="Rights"
              value={
                art.isPublicDomain
                  ? 'Public Domain · CC0'
                  : art.rights ?? 'See museum'
              }
            />
          </dl>

          <ArtworkDetailActions art={art} />

          <div className="flex flex-wrap gap-3 pt-2">
            {art.isPublicDomain ? (
              <Link
                href={studio}
                className="bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass"
              >
                Open in Frame Studio
              </Link>
            ) : (
              <span className="border border-stone px-5 py-2.5 text-sm text-ink-soft">
                Discovery only
              </span>
            )}
            {art.objectUrl && (
              <a
                href={art.objectUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-stone px-5 py-2.5 text-sm transition-colors duration-300 ease-gallery hover:border-brass"
              >
                View at the museum
              </a>
            )}
          </div>

          {!art.isPublicDomain && (
            <p className="text-xs text-ink-soft">
              This work may be in copyright — shown for discovery, not export.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function ArtworkPage() {
  return (
    <Suspense fallback={null}>
      <ArtworkInner />
    </Suspense>
  );
}
