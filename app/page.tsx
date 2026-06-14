import Image from 'next/image';
import Link from 'next/link';
import ArtworkGrid from '@/components/ArtworkGrid';
import { getGallery, getHero } from '@/lib/gallery';

export default async function BrowsePage() {
  const [hero, gallery] = await Promise.all([getHero(), getGallery()]);
  const featured = hero
    ? gallery.filter((art) => art.sourceId !== hero.sourceId)
    : gallery;

  return (
    <div className="space-y-14 px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-2">
        <p className="eyebrow">Browse</p>
        <h1 className="font-editorial text-4xl md:text-5xl">A living gallery</h1>
      </header>

      {hero && (
        <section aria-labelledby="hero-heading">
          <p
            id="hero-heading"
            className="mb-3 text-xs uppercase tracking-label text-brass"
          >
            Artwork of the Day
          </p>
          <Link href={`/artwork/${hero.sourceId}`} className="group block">
            <div className="relative aspect-[16/9] overflow-hidden border border-stone bg-ivory">
              <Image
                src={hero.imageUrl}
                alt={`${hero.title} by ${hero.artist}`}
                fill
                priority
                sizes="100vw"
                className="object-cover transition-transform duration-[1200ms] ease-gallery group-hover:scale-[1.03]"
              />
            </div>
            <div className="mt-4">
              <p className="font-editorial text-2xl">{hero.title}</p>
              <p className="text-ink-soft">
                {hero.artist}
                {hero.year ? `, ${hero.year}` : ''}
              </p>
            </div>
          </Link>
        </section>
      )}

      <section className="space-y-5" aria-labelledby="collection-heading">
        <h2 id="collection-heading" className="font-editorial text-2xl">
          From the collection
        </h2>
        <ArtworkGrid artworks={featured} />
      </section>
    </div>
  );
}
