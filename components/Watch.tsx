'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ArtImage from './ArtImage';
import {
  CloseIcon,
  InfoIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
} from './icons';
import { useStore } from '@/lib/store';
import { searchArtworks } from '@/lib/sources';
import { MOODS } from '@/lib/curation';
import { artAlt } from '@/lib/a11y';
import { announce } from '@/lib/announce';
import { loadImage } from '@/lib/studio/loadImage';
import { trapFocus } from '@/lib/focus-trap';
import {
  DEFAULT_WATCH,
  daySeed,
  getWatchPrefs,
  shuffled,
  type WatchPrefs,
} from '@/lib/watch';
import type { Artwork } from '@/lib/types';

/** TV remote "Back" keycodes: Tizen (Samsung) and webOS (LG). */
const BACK_KEYCODES = new Set([10009, 461]);

function InfoPanel({ art, onClose }: { art: Artwork; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) return trapFocus(ref.current);
  }, []);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`About ${art.title}`}
      className="tv-safe absolute inset-0 z-20 flex flex-col justify-end bg-black/70 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        tabIndex={-1}
      />
      <div className="relative max-w-3xl">
        <p className="text-[clamp(1rem,2vw,1.5rem)] text-white/70">
          {[art.artist, art.year].filter(Boolean).join(' · ')}
        </p>
        <h2 className="font-editorial text-[clamp(1.75rem,4vw,3.5rem)] leading-tight text-white">
          {art.title}
        </h2>
        {art.description && (
          <p className="mt-4 max-h-[40vh] overflow-auto text-[clamp(1rem,1.8vw,1.4rem)] leading-relaxed text-white/85">
            {art.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-6 py-2 text-base text-black"
          >
            Close
          </button>
          {art.objectUrl && (
            <a
              href={art.objectUrl}
              target="_blank"
              rel="noreferrer"
              className="text-base text-white/80 underline underline-offset-4"
            >
              View at {art.museum}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function WatchInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const store = useStore();
  const collectionId = sp.get('collection');
  const favoritesOnly = sp.get('favorites') === '1';

  const [items, setItems] = useState<Artwork[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [prefs] = useState<WatchPrefs>(DEFAULT_WATCH);

  // Resolve the playlist: a saved collection, favorites, or the daily set.
  useEffect(() => {
    let active = true;
    const saved = getWatchPrefs();
    const applyOrder = (list: Artwork[]) =>
      saved.shuffle ? shuffled(list, daySeed()) : list;

    if (collectionId) {
      const c = store.collections.find((c) => c.id === collectionId);
      const list = applyOrder(c?.items ?? []);
      setItems(list);
      setStatus(list.length ? 'ready' : 'empty');
      return;
    }
    if (favoritesOnly) {
      const list = applyOrder(store.favorites);
      setItems(list);
      setStatus(list.length ? 'ready' : 'empty');
      return;
    }
    // Default: today's mood, fetched live.
    setStatus('loading');
    const mood = MOODS[daySeed() % MOODS.length];
    searchArtworks({ q: mood.q, publicDomainOnly: true })
      .then((res) => {
        if (!active) return;
        const list = applyOrder(res.artworks);
        setItems(list);
        setStatus(list.length ? 'ready' : 'empty');
      })
      .catch(() => active && setStatus('empty'));
    return () => {
      active = false;
    };
    // Playlists are resolved once on entry; store changes shouldn't reshuffle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, favoritesOnly]);

  const count = items.length;
  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (count ? (i + delta + count) % count : 0));
    },
    [count],
  );

  const exit = useCallback(() => router.push('/'), [router]);

  // Advance on an interval unless paused or reading the info panel.
  useEffect(() => {
    if (status !== 'ready' || paused || showInfo || count < 2) return;
    const id = window.setInterval(() => go(1), prefs.intervalSec * 1000);
    return () => window.clearInterval(id);
  }, [status, paused, showInfo, count, go, prefs.intervalSec]);

  // Preload the next image so the cross-fade is seamless.
  useEffect(() => {
    if (count < 2) return;
    const next = items[(index + 1) % count];
    if (next?.imageUrl) loadImage(next.imageUrl).catch(() => {});
  }, [index, items, count]);

  // Keep the screen awake while watching (best-effort).
  useEffect(() => {
    let lock: { release: () => void } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: 'screen') => Promise<{ release: () => void }> };
    };
    nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    return () => lock?.release?.();
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      announce(p ? 'Playing' : 'Paused');
      return !p;
    });
  }, []);

  // Keyboard + TV remote.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (BACK_KEYCODES.has(e.keyCode) || e.key === 'Escape') {
        if (showInfo) setShowInfo(false);
        else exit();
        return;
      }
      if (showInfo) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          go(1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          go(-1);
          break;
        case ' ':
          e.preventDefault();
          togglePause();
          break;
        case 'Enter':
        case 'i':
          e.preventDefault();
          setShowInfo(true);
          break;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [go, togglePause, exit, showInfo]);

  // Auto-hide the controls after idle; wake them on any activity.
  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setControlsVisible(false), 4000);
    };
    wake();
    window.addEventListener('pointermove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  // Swipe navigation for touch screens.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    touch.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - t.y)) {
      go(dx < 0 ? 1 : -1);
    }
  };

  if (status === 'empty') {
    return (
      <div className="tv-safe fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-midnight text-center text-white">
        <p className="font-editorial text-[clamp(1.5rem,4vw,3rem)]">
          Nothing to watch yet
        </p>
        <p className="max-w-md text-white/70">
          {collectionId
            ? 'This collection has no works to show.'
            : favoritesOnly
              ? 'Favorite some works and they’ll play here.'
              : 'Couldn’t reach the museums just now.'}
        </p>
        <Link href="/" className="rounded-full bg-white px-6 py-2.5 text-black">
          Back to Framio
        </Link>
      </div>
    );
  }

  const art = items[index];

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden bg-midnight"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Cross-fading layers — each work fades in over the last. */}
      {status === 'ready' &&
        items.map((a, i) => (
          <div
            key={a.id}
            aria-hidden={i !== index}
            className="watch-layer absolute inset-0 flex items-center justify-center"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            {Math.abs(i - index) <= 1 || i === 0 ? (
              <ArtImage
                src={a.imageUrl}
                alt={artAlt(a)}
                label={a.title}
                loading={i === index ? 'eager' : 'lazy'}
                className="max-h-full max-w-full object-contain"
              />
            ) : null}
          </div>
        ))}

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          Curating today’s gallery…
        </div>
      )}

      {/* Always-on credit, overscan-safe. */}
      {art && (
        <div className="tv-safe pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 to-transparent pt-24">
          <p className="font-editorial text-[clamp(1.5rem,4vw,3.5rem)] leading-tight text-white drop-shadow">
            {art.title}
          </p>
          <p className="mt-1 text-[clamp(1rem,2vw,1.75rem)] text-white/85 drop-shadow">
            {[art.artist, art.year, art.museum].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {/* Controls — real buttons, auto-hiding. */}
      <div
        className="tv-safe absolute inset-x-0 top-0 z-10 flex items-center justify-between transition-opacity duration-500"
        style={{ opacity: controlsVisible ? 1 : 0 }}
      >
        <p className="text-sm uppercase tracking-label text-white/70">
          Framio · Watch{count ? ` · ${index + 1}/${count}` : ''}
        </p>
        <div className="flex items-center gap-2 text-white">
          <WatchButton label="Previous" onClick={() => go(-1)}>
            <PrevIcon />
          </WatchButton>
          <WatchButton
            label={paused ? 'Play' : 'Pause'}
            pressed={paused}
            onClick={togglePause}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </WatchButton>
          <WatchButton label="Next" onClick={() => go(1)}>
            <NextIcon />
          </WatchButton>
          <WatchButton label="About this work" onClick={() => setShowInfo(true)}>
            <InfoIcon />
          </WatchButton>
          <WatchButton label="Exit Watch" onClick={exit}>
            <CloseIcon />
          </WatchButton>
        </div>
      </div>

      {showInfo && art && (
        <InfoPanel art={art} onClose={() => setShowInfo(false)} />
      )}
    </div>
  );
}

function WatchButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/25 focus-visible:bg-white/25"
    >
      {children}
    </button>
  );
}

export default function Watch() {
  return (
    <Suspense fallback={null}>
      <WatchInner />
    </Suspense>
  );
}
