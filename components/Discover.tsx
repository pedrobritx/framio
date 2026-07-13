'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ArtworkCard from '@/components/ArtworkCard';
import ArtImage from '@/components/ArtImage';
import { SearchIcon } from '@/components/icons';
import { artworkHref } from '@/lib/links';
import { artAlt } from '@/lib/a11y';
import {
  ARTISTS,
  CULTURES,
  MEDIUMS,
  PERIODS,
  SCHOOLS,
  TOPICS,
} from '@/lib/facets';
import {
  COLORS,
  MOODS,
  colorBySlug,
  exhibitionBySlug,
  moodBySlug,
} from '@/lib/curation';
import {
  DEFAULT_SOURCES,
  SOURCES,
  searchArtworks,
  type MuseumSource,
  type SearchCursor,
  type SearchQuery,
} from '@/lib/sources';
import type { Artwork } from '@/lib/types';

type State = {
  text: string;
  artist: string | null;
  school: string | null;
  topic: string | null;
  culture: string | null;
  periodIndex: number | null;
  medium: string | null;
  mood: string | null; // mood slug
  color: string | null; // colour slug
  aspectFit: boolean;
  sources: MuseumSource[];
  publicDomainOnly: boolean;
};

const INITIAL: State = {
  text: '',
  artist: null,
  school: null,
  topic: null,
  culture: null,
  periodIndex: null,
  medium: null,
  mood: null,
  color: null,
  aspectFit: false,
  sources: [...DEFAULT_SOURCES],
  publicDomainOnly: true,
};

/** Quick-start suggestions for the resting (no-query) state. */
const QUICK_ARTISTS = ARTISTS.slice(0, 8);
const QUICK_SCHOOLS = SCHOOLS.slice(0, 6);
const QUICK_TOPICS = TOPICS.slice(0, 5);

function toQuery(s: State): SearchQuery {
  const topicQ = s.topic ? TOPICS.find((t) => t.label === s.topic)?.q : undefined;
  const moodQ = moodBySlug(s.mood)?.q;
  const q = [s.text.trim(), s.school, topicQ, moodQ].filter(Boolean).join(' ').trim();
  const period = s.periodIndex != null ? PERIODS[s.periodIndex] : undefined;
  return {
    q,
    artistOrCulture: s.artist ?? s.culture ?? undefined,
    medium: s.medium ?? undefined,
    dateBegin: period?.begin,
    dateEnd: period?.end,
    aspectFit: s.aspectFit || undefined,
    color: colorBySlug(s.color)?.hsl,
    publicDomainOnly: s.publicDomainOnly,
    sources: s.sources,
  };
}

function countFilters(s: State): number {
  return (
    (s.artist ? 1 : 0) +
    (s.school ? 1 : 0) +
    (s.topic ? 1 : 0) +
    (s.culture ? 1 : 0) +
    (s.periodIndex != null ? 1 : 0) +
    (s.medium ? 1 : 0) +
    (s.mood ? 1 : 0) +
    (s.color ? 1 : 0) +
    (s.aspectFit ? 1 : 0)
  );
}

/** The selected filters, as removable summary pills. */
function activeFilters(s: State): { key: keyof State; label: string }[] {
  const out: { key: keyof State; label: string }[] = [];
  if (s.artist) out.push({ key: 'artist', label: s.artist });
  if (s.mood) out.push({ key: 'mood', label: `Mood: ${moodBySlug(s.mood)?.label ?? s.mood}` });
  if (s.color) out.push({ key: 'color', label: `Colour: ${colorBySlug(s.color)?.label ?? s.color}` });
  if (s.school) out.push({ key: 'school', label: s.school });
  if (s.topic) out.push({ key: 'topic', label: s.topic });
  if (s.culture) out.push({ key: 'culture', label: s.culture });
  if (s.periodIndex != null)
    out.push({ key: 'periodIndex', label: PERIODS[s.periodIndex].label });
  if (s.medium) out.push({ key: 'medium', label: s.medium });
  if (s.aspectFit) out.push({ key: 'aspectFit', label: 'Fits your Frame' });
  return out;
}

/** A labelled row of single-select chips; selecting the active one clears it. */
function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-label text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : o.key)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-300 ease-gallery ${
                active
                  ? 'border-brass bg-brass text-paper'
                  : 'border-stone text-ink hover:border-brass hover:text-brass'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Discover({
  hero,
  featured,
}: {
  hero: Artwork | null;
  featured: Artwork[];
}) {
  const [state, setState] = useState<State>(INITIAL);
  const [items, setItems] = useState<Artwork[]>([]);
  const [cursor, setCursor] = useState<SearchCursor | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Seed from URL for deep links / curation tiles:
  //   ?q ?artist ?school ?topic ?culture ?mood ?color ?theme ?frame
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';
    const artist = params.get('artist');
    const school = params.get('school');
    const topic = params.get('topic');
    const culture = params.get('culture');
    const mood = params.get('mood');
    const color = params.get('color');
    const theme = params.get('theme');
    const frame = params.get('frame');
    const exhibition = exhibitionBySlug(theme);
    setState((s) => ({
      ...s,
      // An exhibition expands into a keyword (+ optional culture) search.
      text: exhibition ? exhibition.q : q,
      artist: artist && ARTISTS.includes(artist) ? artist : null,
      school: school && SCHOOLS.includes(school) ? school : null,
      topic: topic && TOPICS.some((t) => t.label === topic) ? topic : null,
      culture:
        exhibition?.artistOrCulture && CULTURES.includes(exhibition.artistOrCulture)
          ? exhibition.artistOrCulture
          : culture && CULTURES.includes(culture)
            ? culture
            : null,
      mood: moodBySlug(mood) ? mood : null,
      color: colorBySlug(color) ? color : null,
      aspectFit: frame === '1' || frame === 'true',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((patch: Partial<State>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const filterCount = countFilters(state);
  const pills = activeFilters(state);
  const isSearching = state.text.trim().length > 0 || filterCount > 0;

  const query = useMemo(() => toQuery(state), [state]);
  const queryKey = JSON.stringify(query);

  // Live, debounced search whenever the query or any filter changes.
  useEffect(() => {
    if (!isSearching) {
      abortRef.current?.abort();
      setItems([]);
      setCursor(undefined);
      setHasMore(false);
      setLoading(false);
      setError(false);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(false);
      try {
        const res = await searchArtworks(query, undefined, ac.signal);
        if (!active || ac.signal.aborted) return;
        setItems(res.artworks);
        setCursor(res.cursor);
        setHasMore(res.hasMore);
        setError(false);
      } catch {
        if (!active || ac.signal.aborted) return;
        setError(true);
      } finally {
        if (active && !ac.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [queryKey, query, isSearching]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const ac = new AbortController();
    try {
      const res = await searchArtworks(query, cursor, ac.signal);
      setItems((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...res.artworks.filter((a) => !seen.has(a.id))];
      });
      setCursor(res.cursor);
      setHasMore(res.hasMore);
    } catch {
      /* leave the grid as-is on a transient failure */
    } finally {
      setLoadingMore(false);
    }
  }

  function clearAll() {
    setState({ ...INITIAL, sources: state.sources });
    setShowFilters(false);
  }

  function removePill(key: keyof State) {
    if (key === 'aspectFit') update({ aspectFit: false });
    else update({ [key]: null } as Partial<State>);
  }

  function toggleSource(id: MuseumSource) {
    setState((s) => {
      const has = s.sources.includes(id);
      // Never let the reader switch every museum off.
      if (has && s.sources.length === 1) return s;
      return {
        ...s,
        sources: has ? s.sources.filter((x) => x !== id) : [...s.sources, id],
      };
    });
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-2">
        <p className="eyebrow">Search</p>
        <h1 className="font-editorial text-4xl md:text-5xl">Find the work</h1>
      </header>

      {/* Search bar + filter toggle */}
      <div className="mt-6 flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-3 border border-stone bg-paper px-4 transition-colors focus-within:border-brass">
          <SearchIcon className="shrink-0 text-lg text-ink-soft" />
          <input
            id="artwork-search"
            type="search"
            value={state.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Search artist, movement, subject — “Monet”, “Van Gogh”, “seascape”…"
            className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-ink-soft"
            aria-label="Search artworks"
          />
          {state.text && (
            <button
              type="button"
              onClick={() => update({ text: '' })}
              aria-label="Clear search text"
              className="shrink-0 text-ink-soft transition-colors hover:text-ink"
            >
              ✕
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
          className={`shrink-0 border px-4 py-3 text-sm transition-colors duration-300 ease-gallery ${
            filterCount
              ? 'border-brass bg-brass/10 text-brass'
              : 'border-stone text-ink hover:border-brass hover:text-brass'
          }`}
        >
          Filters{filterCount ? ` · ${filterCount}` : ''}
        </button>
      </div>

      {/* Artist quick-pick — the names people actually look for */}
      <div className="mt-4">
        <p className="mb-2 text-xs uppercase tracking-label text-ink-soft">Artists</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ARTISTS.map((a) => {
            const active = state.artist === a;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={active}
                onClick={() => update({ artist: active ? null : a })}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-300 ease-gallery ${
                  active
                    ? 'border-brass bg-brass text-paper'
                    : 'border-stone text-ink hover:border-brass hover:text-brass'
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active filter pills */}
      {pills.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => removePill(p.key)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-brass bg-brass/10 py-1 pl-3 pr-2 text-sm text-brass transition-colors hover:bg-brass hover:text-paper"
              aria-label={`Remove filter ${p.label}`}
            >
              {p.label}
              <span aria-hidden className="text-xs">
                ✕
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div
          id="filter-panel"
          className="mt-5 space-y-5 border border-stone bg-ivory/60 p-5"
        >
          <ChipRow
            label="Mood"
            options={MOODS.map((m) => ({ key: m.slug, label: m.label }))}
            value={state.mood}
            onChange={(v) => update({ mood: v })}
          />

          {/* Colour — ranks results by AIC dominant-colour distance */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-label text-ink-soft">Colour</p>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => {
                const active = state.color === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={active}
                    aria-label={c.label}
                    title={c.label}
                    onClick={() => update({ color: active ? null : c.slug })}
                    className={`h-8 w-8 rounded-full border transition-transform duration-300 ease-gallery hover:scale-110 ${
                      active
                        ? 'border-brass ring-2 ring-brass ring-offset-2 ring-offset-ivory'
                        : 'border-stone'
                    }`}
                    style={{ background: c.hex }}
                  />
                );
              })}
            </div>
          </div>

          <ChipRow
            label="Artist"
            options={ARTISTS.map((a) => ({ key: a, label: a }))}
            value={state.artist}
            onChange={(v) => update({ artist: v })}
          />
          <ChipRow
            label="School / Movement"
            options={SCHOOLS.map((s) => ({ key: s, label: s }))}
            value={state.school}
            onChange={(v) => update({ school: v })}
          />
          <ChipRow
            label="Topic"
            options={TOPICS.map((t) => ({ key: t.label, label: t.label }))}
            value={state.topic}
            onChange={(v) => update({ topic: v })}
          />
          <ChipRow
            label="Culture"
            options={CULTURES.map((c) => ({ key: c, label: c }))}
            value={state.culture}
            onChange={(v) => update({ culture: v })}
          />
          <ChipRow
            label="Period"
            options={PERIODS.map((p, i) => ({ key: String(i), label: p.label }))}
            value={state.periodIndex != null ? String(state.periodIndex) : null}
            onChange={(v) => update({ periodIndex: v == null ? null : Number(v) })}
          />
          <ChipRow
            label="Medium"
            options={MEDIUMS.map((m) => ({ key: m, label: m }))}
            value={state.medium}
            onChange={(v) => update({ medium: v })}
          />

          {/* Museums to search */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-label text-ink-soft">Museums</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((src) => {
                const active = state.sources.includes(src.id);
                return (
                  <button
                    key={src.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSource(src.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-300 ease-gallery ${
                      active
                        ? 'border-brass bg-brass text-paper'
                        : 'border-stone text-ink hover:border-brass hover:text-brass'
                    }`}
                  >
                    {src.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 border-t border-stone pt-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={state.publicDomainOnly}
                  onChange={(e) => update({ publicDomainOnly: e.target.checked })}
                  className="accent-brass"
                />
                Public domain only (exportable to your Frame)
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={state.aspectFit}
                  onChange={(e) => update({ aspectFit: e.target.checked })}
                  className="accent-brass"
                />
                Fits your Frame — crops cleanly to 16:9
              </label>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              Reset filters
            </button>
          </div>
        </div>
      )}

      {/* Results — or the resting gallery when nothing is being searched */}
      {isSearching ? (
        <section className="mt-8" aria-live="polite">
          {loading ? (
            <>
              <p className="mb-5 text-sm text-ink-soft">Searching the museums…</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] animate-pulse border border-stone bg-ivory"
                  />
                ))}
              </div>
            </>
          ) : error ? (
            <p className="text-ink-soft">
              Couldn&apos;t reach the museums just now. Try again in a moment.
            </p>
          ) : items.length === 0 ? (
            <p className="text-ink-soft">
              No works match yet — try a different word, another museum, or loosen
              the filters.
            </p>
          ) : (
            <>
              <p className="mb-5 text-sm text-ink-soft">
                {state.color ? (
                  <>
                    Ranked by colour ·{' '}
                    <span className="text-ink">
                      {colorBySlug(state.color)?.label}
                    </span>{' '}
                    · {items.length.toLocaleString()} work
                    {items.length === 1 ? '' : 's'} from the Art Institute of Chicago
                  </>
                ) : (
                  <>
                    Showing {items.length.toLocaleString()} work
                    {items.length === 1 ? '' : 's'}
                    {hasMore ? ' · more available' : ''}
                  </>
                )}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((art) => (
                  <ArtworkCard key={art.id} art={art} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="border border-stone px-6 py-3 text-sm text-ink transition-colors duration-300 ease-gallery hover:border-brass hover:text-brass disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <div className="mt-8 space-y-14">
          {/* Quick-start suggestions */}
          <div className="flex flex-wrap gap-2">
            {QUICK_SCHOOLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update({ school: s })}
                className="rounded-full border border-stone px-3 py-1.5 text-sm text-ink transition-colors duration-300 ease-gallery hover:border-brass hover:text-brass"
              >
                {s}
              </button>
            ))}
            {QUICK_TOPICS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => update({ topic: t.label })}
                className="rounded-full border border-stone px-3 py-1.5 text-sm text-ink transition-colors duration-300 ease-gallery hover:border-brass hover:text-brass"
              >
                {t.label}
              </button>
            ))}
          </div>

          {hero && (
            <section aria-labelledby="hero-heading">
              <p
                id="hero-heading"
                className="mb-3 text-xs uppercase tracking-label text-brass"
              >
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
            {featured.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {featured.map((art) => (
                  <ArtworkCard key={art.id} art={art} />
                ))}
              </div>
            ) : (
              <p className="text-ink-soft">
                Couldn&apos;t reach the museum just now. Refresh to try again.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
