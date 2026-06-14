import Image from 'next/image';
import Link from 'next/link';
import ArtworkGrid from '@/components/ArtworkGrid';
import { SearchIcon } from '@/components/icons';
import { SCHOOLS, TOPICS } from '@/lib/facets';
import { getGallery, getHero } from '@/lib/gallery';

const QUICK_SCHOOLS = SCHOOLS.slice(0, 6);
const QUICK_TOPICS = TOPICS.slice(0, 5);

export default async function BrowsePage() {
  const [hero, gallery] = await Promise.all([getHero(), getGallery()]);
  const featured = hero
    ? gallery.filter((art) => art.sourceId !== hero.sourceId)
    : gallery;

  return (
    <div className="space-y-14 px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-5">
        <div className="space-y-2">
          <p className="eyebrow">Browse</p>
          <h1 className="font-editorial text-4xl md:text-5xl">A living gallery</h1>
        </div>

        <Link
          href="/search"
          className="flex max-w-xl items-center gap-3 border border-stone bg-paper px-4 py-3 text-sm text-ink-soft transition-colors duration-300 ease-gallery hover:border-brass"
        >
          <SearchIcon className="text-lg" />
          Search by word, school, artist, period, museum, or topic…
        </Link>

        <div className="flex flex-wrap gap-2">
          {QUICK_SCHOOLS.map((s) => (
            <Link
              key={s}
              href={`/search?school=${encodeURIComponent(s)}`}
              className="rounded-full border border-stone px-3 py-1 text-sm text-ink-soft transition-colors duration-300 ease-gallery hover:border-brass hover:text-ink"
            >
              {s}
            </Link>
          ))}
          {QUICK_TOPICS.map((t) => (
            <Link
              key={t.label}
              href={`/search?topic=${encodeURIComponent(t.label)}`}
              className="rounded-full border border-stone px-3 py-1 text-sm text-ink-soft transition-colors duration-300 ease-gallery hover:border-brass hover:text-ink"
            >
              {t.label}
            </Link>
          ))}
        </div>
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
