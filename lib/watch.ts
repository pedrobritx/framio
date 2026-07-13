/**
 * Watch-mode preferences (the ambient full-screen gallery). Kept in
 * localStorage, separate from the personal store — playback settings aren't
 * collection data.
 */

export interface WatchPrefs {
  /** Seconds each work is held before the next cross-fade. */
  intervalSec: number;
  /** Shuffle the order instead of playing it as curated. */
  shuffle: boolean;
}

export const DEFAULT_WATCH: WatchPrefs = { intervalSec: 30, shuffle: false };

const KEY = 'framio:watch';
const MIN_INTERVAL = 8;
const MAX_INTERVAL = 300;

function clampInterval(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_WATCH.intervalSec;
  return Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, Math.round(n)));
}

export function getWatchPrefs(): WatchPrefs {
  if (typeof window === 'undefined') return DEFAULT_WATCH;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_WATCH;
    const p = JSON.parse(raw) as Partial<WatchPrefs>;
    return {
      intervalSec: clampInterval(p.intervalSec ?? DEFAULT_WATCH.intervalSec),
      shuffle: Boolean(p.shuffle),
    };
  } catch {
    return DEFAULT_WATCH;
  }
}

export function setWatchPrefs(prefs: WatchPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({
      intervalSec: clampInterval(prefs.intervalSec),
      shuffle: prefs.shuffle,
    }));
  } catch {
    /* private mode — playback prefs just won't persist */
  }
}

/** Deterministic daily seed, shared with the home hero. */
export function daySeed(): number {
  return Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
}

/** A seeded shuffle so a shuffled run is stable within a session. */
export function shuffled<T>(list: T[], seed: number): T[] {
  const out = [...list];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Href to open Watch for a saved collection / favorites / the daily set. */
export function watchHref(opts?: { collection?: string; favorites?: boolean }): string {
  if (opts?.collection) return `/watch/?collection=${encodeURIComponent(opts.collection)}`;
  if (opts?.favorites) return '/watch/?favorites=1';
  return '/watch/';
}
