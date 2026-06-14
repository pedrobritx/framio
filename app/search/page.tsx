'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArtworkCard from '@/components/ArtworkCard';
import { SearchIcon } from '@/components/icons';
import {
  CULTURES,
  DEPARTMENTS,
  MEDIUMS,
  MUSEUMS,
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
  artistOrCulture: string;
  periodIndex: number | null;
  departmentId: number | null;
  medium: string | null;
  publicDomainOnly: boolean;
};

const INITIAL: State = {
  text: '',
  school: null,
  topic: null,
  artistOrCulture: '',
  periodIndex: null,
  departmentId: null,
  medium: null,
  publicDomainOnly: true,
};

function toFilters(s: State): SearchFilters {
  const topicQ = s.topic ? TOPICS.find((t) => t.label === s.topic)?.q : undefined;
  const q = [s.text.trim(), s.school, topicQ].filter(Boolean).join(' ');
  const period = s.periodIndex != null ? PERIODS[s.periodIndex] : undefined;
  return {
    q,
    artistOrCulture: s.artistOrCulture.trim() || undefined,
    medium: s.medium ?? undefined,
    departmentId: s.departmentId ?? undefined,
    dateBegin: period?.begin,
    dateEnd: period?.end,
    publicDomainOnly: s.publicDomainOnly,
  };
}

/** A row of selectable chips; `null` clears the selection. */
function Chips({
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
              className={`rounded-full border px-3 py-1 text-sm transition-colors duration-300 ease-gallery ${
                active
                  ? 'border-brass bg-brass/10 text-brass'
                  : 'border-stone text-ink-soft hover:border-ink-soft hover:text-ink'
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

function SearchInner() {
  const params = useSearchParams();
  const [state, setState] = useState<State>(INITIAL);
  const [text, setText] = useState(''); // the live input; committed to state on submit
  const [items, setItems] = useState<Artwork[]>([]);
  const [ids, setIds] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Seed from URL (?q, ?school, ?topic, ?culture) for deep links from Browse.
  useEffect(() => {
    const q = params.get('q') ?? '';
    const school = params.get('school');
    const topic = params.get('topic');
    const culture = params.get('culture');
    setText(q);
    setState((s) => ({
      ...s,
      text: q,
      school: school && SCHOOLS.includes(school) ? school : null,
      topic: topic && TOPICS.some((t) => t.label === topic) ? topic : null,
      artistOrCulture: culture && CULTURES.includes(culture) ? culture : s.artistOrCulture,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((patch: Partial<State>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const filters = useMemo(() => toFilters(state), [state]);
  const filterKey = JSON.stringify(filters);

  // Run a fresh search whenever the committed filters change (debounced).
  useEffect(() => {
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
  }, [filterKey, filters]);

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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ text });
  }

  const hasMore = cursor < ids.length;
  const activeCount =
    (state.school ? 1 : 0) +
    (state.topic ? 1 : 0) +
    (state.artistOrCulture ? 1 : 0) +
    (state.periodIndex != null ? 1 : 0) +
    (state.departmentId != null ? 1 : 0) +
    (state.medium ? 1 : 0);

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <header className="space-y-2">
        <p className="eyebrow">Search</p>
        <h1 className="font-editorial text-4xl md:text-5xl">Find your art</h1>
        <p className="max-w-xl text-ink-soft">
          Search by word, or browse by school, artist, culture, period, museum, and
          topic. Results come live from The Met&apos;s Open Access collection.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 border border-stone bg-paper px-3 focus-within:border-brass">
          <SearchIcon className="text-lg text-ink-soft" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sunflowers, Hokusai, a feeling…"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            aria-label="Search artworks"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 bg-ink px-5 py-3 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={`shrink-0 border px-4 py-3 text-sm transition-colors duration-300 ease-gallery ${
            activeCount ? 'border-brass text-brass' : 'border-stone hover:border-ink-soft'
          }`}
        >
          Filters{activeCount ? ` · ${activeCount}` : ''}
        </button>
      </form>

      {showFilters && (
        <div className="mt-5 space-y-5 border border-stone bg-ivory/40 p-5">
          <Chips
            label="School / Movement"
            options={SCHOOLS.map((s) => ({ key: s, label: s }))}
            value={state.school}
            onChange={(v) => update({ school: v })}
          />
          <Chips
            label="Topic"
            options={TOPICS.map((t) => ({ key: t.label, label: t.label }))}
            value={state.topic}
            onChange={(v) => update({ topic: v })}
          />
          <Chips
            label="Culture"
            options={CULTURES.map((c) => ({ key: c, label: c }))}
            value={CULTURES.includes(state.artistOrCulture) ? state.artistOrCulture : null}
            onChange={(v) => update({ artistOrCulture: v ?? '' })}
          />
          <Chips
            label="Period"
            options={PERIODS.map((p, i) => ({ key: String(i), label: p.label }))}
            value={state.periodIndex != null ? String(state.periodIndex) : null}
            onChange={(v) => update({ periodIndex: v == null ? null : Number(v) })}
          />
          <Chips
            label="Department"
            options={DEPARTMENTS.map((d) => ({ key: String(d.id), label: d.label }))}
            value={state.departmentId != null ? String(state.departmentId) : null}
            onChange={(v) => update({ departmentId: v == null ? null : Number(v) })}
          />
          <Chips
            label="Medium"
            options={MEDIUMS.map((m) => ({ key: m, label: m }))}
            value={state.medium}
            onChange={(v) => update({ medium: v })}
          />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-label text-ink-soft">Artist or culture</p>
            <input
              type="text"
              value={state.artistOrCulture}
              onChange={(e) => update({ artistOrCulture: e.target.value })}
              placeholder="e.g. Monet, Japanese…"
              className="w-full max-w-xs border border-stone bg-paper px-3 py-2 text-sm outline-none focus:border-brass"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone pt-4">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={state.publicDomainOnly}
                onChange={(e) => update({ publicDomainOnly: e.target.checked })}
                className="accent-brass"
              />
              Public domain only (exportable)
            </label>
            <button
              type="button"
              onClick={() => {
                setText('');
                setState(INITIAL);
              }}
              className="text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
            >
              Clear all
            </button>
          </div>

          <p className="text-xs text-ink-soft">
            Browsing{' '}
            {MUSEUMS.filter((m) => m.available).map((m) => m.label).join(', ')}.
            More museums arrive in Phase 2.
          </p>
        </div>
      )}

      <section className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse border border-stone bg-ivory" />
            ))}
          </div>
        ) : error ? (
          <p className="text-ink-soft">Couldn&apos;t reach the museum just now. Try again.</p>
        ) : items.length === 0 ? (
          <p className="text-ink-soft">
            No works match yet — try a different word or loosen the filters.
          </p>
        ) : (
          <>
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
                  className="border border-stone px-6 py-3 text-sm transition-colors duration-300 ease-gallery hover:border-brass disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
