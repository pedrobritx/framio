'use client';

import { useEffect, useState } from 'react';
import ArtworkCard from '@/components/ArtworkCard';
import { searchArtworks } from '@/lib/sources';
import type { Artwork } from '@/lib/types';

/**
 * Serendipity shelf for the artwork page. The guide's strongest UX lever is
 * "related works" — here, more by the same hand, then more from the same museum,
 * resolved live from the keyless adapters. Fails quietly: no shelf if nothing
 * lands, so the detail page never shows a broken rail.
 */
export default function RelatedWorks({ art }: { art: Artwork }) {
  const [items, setItems] = useState<Artwork[]>([]);

  const known = art.artist && art.artist !== 'Unknown artist' ? art.artist : '';

  useEffect(() => {
    let active = true;
    const ac = new AbortController();
    setItems([]);
    const run = async () => {
      try {
        // Prefer "more by this artist"; fall back to the work's medium/title noun.
        const primary = known
          ? { artistOrCulture: known, publicDomainOnly: true }
          : { q: art.medium || art.title, publicDomainOnly: true };
        const res = await searchArtworks(primary, undefined, ac.signal);
        if (!active) return;
        const filtered = res.artworks.filter((a) => a.id !== art.id).slice(0, 10);
        setItems(filtered);
      } catch {
        /* leave the shelf empty on a transient failure */
      }
    };
    run();
    return () => {
      active = false;
      ac.abort();
    };
  }, [art.id, art.artist, art.medium, art.title, known]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-stone pt-10" aria-labelledby="related-heading">
      <p className="eyebrow">Discover more</p>
      <h2 id="related-heading" className="mt-1 font-editorial text-2xl md:text-3xl">
        {known ? `More from ${known}` : 'Related works'}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((a) => (
          <ArtworkCard key={a.id} art={a} />
        ))}
      </div>
    </section>
  );
}
