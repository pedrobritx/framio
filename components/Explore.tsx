import Link from 'next/link';
import ArtworkCard from '@/components/ArtworkCard';
import ArtImage from '@/components/ArtImage';
import { artworkHref } from '@/lib/links';
import { COLORS, EXHIBITIONS, MOODS } from '@/lib/curation';
import { ARTISTS } from '@/lib/facets';
import { artAlt } from '@/lib/a11y';
import { watchHref } from '@/lib/watch';
import { PlayIcon } from '@/components/icons';
import type { Artwork } from '@/lib/types';
import { SearchIcon } from '@/components/icons';

/** Quick artist row — the names people actually look for. */
const QUICK_ARTISTS = ARTISTS.slice(0, 12);

function gradient(from: string, to: string) {
  return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
}

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-editorial text-2xl md:text-3xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/**
 * The curation-first home. Like the Art Store, browsing leads — mood, colour,
 * and themed exhibitions are the front door; intent-driven search is one tap
 * away. Everything links into the faceted /search surface, pre-seeded.
 */
export default function Explore({
  hero,
  featured,
}: {
  hero: Artwork | null;
  featured: Artwork[];
}) {
  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      {/* Masthead */}
      <header className="max-w-3xl">
        <p className="eyebrow">Framio · your personal museum</p>
        <h1 className="mt-2 font-editorial text-4xl leading-tight md:text-6xl">
          What are you in the mood for?
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          A living gallery for your Frame TV — public-domain masterpieces from the
          world&apos;s museums, curated by mood, colour, and theme, framed for your wall.
        </p>
        <Link
          href="/search/"
          className="mt-6 inline-flex items-center gap-2 border border-stone px-4 py-3 text-sm text-ink transition-colors duration-300 ease-gallery hover:border-brass hover:text-brass"
        >
          <SearchIcon className="text-base text-ink-soft" />
          Search artists, movements, subjects…
        </Link>
      </header>

      {/* Hero — Artwork of the Day */}
      {hero && (
        <section className="mt-12" aria-labelledby="hero-heading">
          <p id="hero-heading" className="mb-3 eyebrow text-brass">
            Artwork of the Day
          </p>
          <Link href={artworkHref(hero)} className="group block">
            <div className="relative aspect-[16/9] overflow-hidden border border-stone bg-ivory">
              <ArtImage
                src={hero.imageUrl}
                alt={artAlt(hero)}
                label={hero.title}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-gallery group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 md:p-7">
                <p className="font-editorial text-2xl text-white md:text-3xl">
                  {hero.title}
                </p>
                <p className="text-white/85">
                  {hero.artist}
                  {hero.year ? `, ${hero.year}` : ''}
                </p>
              </div>
            </div>
          </Link>
          <div className="mt-4">
            <Link
              href={watchHref()}
              className="inline-flex items-center gap-2 border border-stone px-4 py-2 text-sm transition-colors duration-300 ease-gallery hover:border-brass"
            >
              <PlayIcon className="text-brass" />
              Watch today’s gallery
            </Link>
          </div>
        </section>
      )}

      {/* Moods */}
      <section className="mt-14" aria-labelledby="moods-heading">
        <SectionHeading eyebrow="Browse" title="By mood" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MOODS.map((m) => (
            <Link
              key={m.slug}
              href={`/search/?mood=${m.slug}`}
              className="group relative flex aspect-[5/3] flex-col justify-end overflow-hidden border border-stone p-4 transition-transform duration-500 ease-gallery hover:-translate-y-0.5"
              style={gradient(m.from, m.to)}
            >
              <span className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/0" />
              <span className="relative font-editorial text-xl text-white drop-shadow">
                {m.label}
              </span>
              <span className="relative mt-0.5 text-xs text-white/85 drop-shadow">
                {m.blurb}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Colours */}
      <section className="mt-14" aria-labelledby="colors-heading">
        <SectionHeading eyebrow="Browse" title="By colour">
          <span className="text-xs text-ink-soft">
            Ranked by Art Institute of Chicago colour data
          </span>
        </SectionHeading>
        <div className="mt-5 flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <Link
              key={c.slug}
              href={`/search/?color=${c.slug}`}
              className="group flex flex-col items-center gap-1.5"
              aria-label={`Browse ${c.label} works`}
            >
              <span
                className="h-12 w-12 rounded-full border border-stone shadow-sm transition-transform duration-300 ease-gallery group-hover:scale-110 sm:h-14 sm:w-14"
                style={{ background: c.hex }}
              />
              <span className="text-xs text-ink-soft transition-colors group-hover:text-ink">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Exhibitions */}
      <section className="mt-14" aria-labelledby="exhibitions-heading">
        <SectionHeading eyebrow="Curated" title="Exhibitions" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {EXHIBITIONS.map((e) => (
            <Link
              key={e.slug}
              href={`/search/?theme=${e.slug}`}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden border border-stone p-4 transition-transform duration-500 ease-gallery hover:-translate-y-0.5"
              style={gradient(e.from, e.to)}
            >
              <span className="absolute inset-0 bg-black/15 transition-colors duration-500 group-hover:bg-black/5" />
              <span className="relative font-editorial text-xl text-white drop-shadow md:text-2xl">
                {e.title}
              </span>
              <span className="relative mt-1 text-xs text-white/85 drop-shadow">
                {e.blurb}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Artists */}
      <section className="mt-14" aria-labelledby="artists-heading">
        <SectionHeading eyebrow="Browse" title="By artist" />
        <div className="mt-5 flex flex-wrap gap-2">
          {QUICK_ARTISTS.map((a) => (
            <Link
              key={a}
              href={`/search/?artist=${encodeURIComponent(a)}`}
              className="rounded-full border border-stone px-3 py-1.5 text-sm text-ink transition-colors duration-300 ease-gallery hover:border-brass hover:text-brass"
            >
              {a}
            </Link>
          ))}
        </div>
      </section>

      {/* From the collection */}
      <section className="mt-14" aria-labelledby="collection-heading">
        <SectionHeading eyebrow="Open access" title="From the collection" />
        {featured.length ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featured.map((art) => (
              <ArtworkCard key={art.id} art={art} />
            ))}
          </div>
        ) : (
          <p className="mt-5 text-ink-soft">
            Couldn&apos;t reach the museum just now. Refresh to try again.
          </p>
        )}
      </section>

      {/* Footer — surface the manifesto and the open-source story up front */}
      <footer className="mt-20 border-t border-stone pt-8">
        <Link
          href="/about/"
          className="group inline-flex items-baseline gap-2 font-editorial text-2xl text-ink transition-colors hover:text-brass md:text-3xl"
        >
          Read the manifesto
          <span className="text-brass transition-transform duration-300 ease-gallery group-hover:translate-x-1">
            →
          </span>
        </Link>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
          Why Framio exists, the open collections behind it, and the license
          that keeps it free.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-label text-ink-soft">
          <Link href="/about/" className="transition-colors hover:text-brass">
            About
          </Link>
          <a
            href="https://github.com/pedrobritx/framio"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-brass"
          >
            Source on GitHub
          </a>
          <a
            href="https://github.com/pedrobritx/framio/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-brass"
          >
            MIT License
          </a>
        </div>
        <p className="mt-6 text-xs text-ink-soft">
          Built by Pedro Brito · Open source (MIT) · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
