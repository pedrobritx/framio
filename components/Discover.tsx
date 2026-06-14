'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArtworkCard from '@/components/ArtworkCard';
import { SearchIcon } from '@/components/icons';
import {
  CULTURES,
  DEPARTMENTS,
  MEDIUMS,
  PERIODS,
  SCHOOLS,
  TOPICS,
} from '@/lib/facets';
import { fetchObjects, searchIds, type SearchFilters } from '@/lib/metClient';
import type { Artwork } from '@/lib/types';

const PAGE_SIZE = 24;

type State = {
  text: string;
  school: string | null;
  topic: string | null;
  culture: string | null;
  periodIndex: number | null;
  departmentId: number | null;
  medium: string | null;
  publicDomainOnly: boolean;
};

const INITIAL: State = {
  text: '',
  school: null,
  topic: null,
  culture: null,
  periodIndex: null,
  departmentId: null,
  medium: null,
  publicDomainOnly: true,
};

/** Quick-start suggestions for the resting (no-query) state. */
const QUICK_SCHOOLS = SCHOOLS.slice(0, 6);
const QUICK_TOPICS = TOPICS.slice(0, 5);

function toFilters(s: State): SearchFilters {
  const topicQ = s.topic ? TOPICS.find((t) => t.label === s.topic)?.q : undefined;
  const q = [s.text.trim(), s.school, topicQ].filter(Boolean).join(' ');
  const period = s.periodIndex != null ? PERIODS[s.periodIndex] : undefined;
  return {
    q,
    artistOrCulture: s.culture ?? undefined,
    medium: s.medium ?? undefined,
    departmentId: s.departmentId ?? undefined,
    dateBegin: period?.begin,
    dateEnd: period?.end,
    publicDomainOnly: s.publicDomainOnly,
  };
}

/** Count of structured filters in play (text is tracked separately). */
function countFilters(s: State): number {
  return (
    (s.school ? 1 : 0) +
    (s.topic ? 1 : 0) +
    (s.culture ? 1 : 0) +
    (s.periodIndex != null ? 1 : 0) +
    (s.departmentId != null ? 1 : 0) +
    (s.medium ? 1 : 0)
  );
}

/** The selected filters, as removable summary pills. */
function activeFilters(s: State): { key: keyof State; label: string }[] {
  const out: { key: keyof State; label: string }[] = [];
  if (s.school) out.push({ key: 'school', label: s.school });
  if (s.topic) out.push({ key: 'topic', label: s.topic });
  if (s.culture) out.push({ key: 'culture', label: s.culture });
  if (s.periodIndex != null)
    out.push({ key: 'periodIndex', label: PERIODS[s.periodIndex].label });
  if (s.departmentId != null) {
    const d = DEPARTMENTS.find((x) => x.id === s.departmentId);
    if (d) out.push({ key: 'departmentId', label: d.label });
  }
  if (s.medium) out.push({ key: 'medium', label: s.medium });
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
  const [ids, setIds] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Seed from URL (?q, ?school, ?topic, ?culture) for deep links. Read on mount
  // via the browser so the resting gallery still prerenders to static HTML.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';
    const school = params.get('school');
    const topic = params.get('topic');
    const culture = params.get('culture');
    setState((s) => ({
      ...s,
      text: q,
      school: school && SCHOOLS.includes(school) ? school : null,
      topic: topic && TOPICS.some((t) => t.label === topic) ? topic : null,
      culture: culture && CULTURES.includes(culture) ? culture : null,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((patch: Partial<State>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const filterCount = countFilters(state);
  const pills = activeFilters(state);
  const isSearching = state.text.trim().length > 0 || filterCount > 0;

  const filters = useMemo(() => toFilters(state), [state]);
  const filterKey = JSON.stringify(filters);

  // Live, debounced search whenever the query or any filter changes.
  useEffect(() => {
    if (!isSearching) {
      abortRef.current?.abort();
      setItems([]);
      setIds([]);
      setCursor(0);
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
      const found = await searchIds(filters, ac.signal);
      if (!active || ac.signal.aborted) return;
      const firstPage = await fetchObjects(found.slice(0, PAGE_SIZE), ac.signal);
      if (!active || ac.signal.aborted) return;
      setIds(found);
      setItems(firstPage);
      setCursor(Math.min(PAGE_SIZE, found.length));
      setError(found.length === 0 ? false : firstPage.length === 0);
      setLoading(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filterKey, filters, isSearching]);

  async function loadMore() {
    if (loadingMore || cursor >= ids.length) return;
    setLoadingMore(true);
    const ac = new AbortController();
    const slice = ids.slice(cursor, cursor + PAGE_SIZE);
    const more = await fetchObjects(slice, ac.signal);
    setItems((prev) => [...prev, ...more]);
    setCursor((c) => Math.min(c + PAGE_SIZE, ids.length));
    setLoadingMore(false);
  }

  function clearAll() {
    setState(INITIAL);
    setShowFilters(false);
  }

  function removePill(key: keyof State) {
    update({ [key]: null } as Partial<State>);
  }

  const hasMore = cursor < ids.length;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-2">
        <p className="eyebrow">Browse</p>
        <h1 className="font-editorial text-4xl md:text-5xl">A living gallery</h1>
      </header>

      {/* Search bar + filter toggle */}
      <div className="mt-6 flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-3 border border-stone bg-paper px-4 transition-colors focus-within:border-brass">
          <SearchIcon className="shrink-0 text-lg text-ink-soft" />
          <input
            type="search"
            value={state.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Search by word, artist, school, period, or topic…"
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

      {/* Active filter pills — visible whether or not the panel is open */}
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
            label="Department"
            options={DEPARTMENTS.map((d) => ({ key: String(d.id), label: d.label }))}
            value={state.departmentId != null ? String(state.departmentId) : null}
            onChange={(v) => update({ departmentId: v == null ? null : Number(v) })}
          />
          <ChipRow
            label="Medium"
            options={MEDIUMS.map((m) => ({ key: m, label: m }))}
            value={state.medium}
            onChange={(v) => update({ medium: v })}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={state.publicDomainOnly}
                onChange={(e) => update({ publicDomainOnly: e.target.checked })}
                className="accent-brass"
              />
              Public domain only (exportable to your Frame)
            </label>
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
              <p className="mb-5 text-sm text-ink-soft">Searching The Met…</p>
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
              Couldn&apos;t reach the museum just now. Try again in a moment.
            </p>
          ) : items.length === 0 ? (
            <p className="text-ink-soft">
              No works match yet — try a different word or loosen the filters.
            </p>
          ) : (
            <>
              <p className="mb-5 text-sm text-ink-soft">
                {ids.length.toLocaleString()} work{ids.length === 1 ? '' : 's'} found
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
