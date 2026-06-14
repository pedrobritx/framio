'use client';

import { useSyncExternalStore } from 'react';
import type { Artwork } from './types';

/**
 * Framio's personal store — favorites and collections.
 *
 * The MVP is single-user and ships as a static site, so selections live in the
 * browser's localStorage. The full Artwork is stored (not just an id) so the
 * Library, Collections, and Frame Studio can render and export without re-fetching
 * — and keep working offline. A Supabase project can later mirror this shape
 * (see supabase/migrations) for cross-device sync.
 */

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  items: Artwork[];
}

export interface StoreState {
  favorites: Artwork[];
  collections: Collection[];
}

const KEY = 'framio:v1';
const EMPTY: StoreState = { favorites: [], collections: [] };

let state: StoreState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): StoreState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      collections: Array.isArray(parsed.collections) ? parsed.collections : [],
    };
  } catch {
    return EMPTY;
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or privacy mode — selections simply won't persist */
  }
}

function emit() {
  for (const l of listeners) l();
}

function setState(next: StoreState) {
  state = next;
  persist();
  emit();
}

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  state = load();
  // Keep tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  ensureHydrated();
  listeners.add(cb);
  // Nudge the subscriber so the first client paint after hydration shows real data.
  cb();
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): StoreState {
  return state;
}

function getServerSnapshot(): StoreState {
  return EMPTY;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------------------------------------------------------- mutations */

export function toggleFavorite(art: Artwork) {
  const exists = state.favorites.some((a) => a.id === art.id);
  const favorites = exists
    ? state.favorites.filter((a) => a.id !== art.id)
    : [art, ...state.favorites];
  setState({ ...state, favorites });
}

export function createCollection(name: string): string {
  const id = newId();
  const collection: Collection = {
    id,
    name: name.trim() || 'Untitled collection',
    createdAt: Date.now(),
    items: [],
  };
  setState({ ...state, collections: [...state.collections, collection] });
  return id;
}

export function renameCollection(id: string, name: string) {
  setState({
    ...state,
    collections: state.collections.map((c) =>
      c.id === id ? { ...c, name: name.trim() || c.name } : c,
    ),
  });
}

export function deleteCollection(id: string) {
  setState({
    ...state,
    collections: state.collections.filter((c) => c.id !== id),
  });
}

export function addToCollection(id: string, art: Artwork) {
  setState({
    ...state,
    collections: state.collections.map((c) =>
      c.id === id && !c.items.some((a) => a.id === art.id)
        ? { ...c, items: [...c.items, art] }
        : c,
    ),
  });
}

export function removeFromCollection(id: string, artworkId: string) {
  setState({
    ...state,
    collections: state.collections.map((c) =>
      c.id === id
        ? { ...c, items: c.items.filter((a) => a.id !== artworkId) }
        : c,
    ),
  });
}

/* -------------------------------------------------------------------- hooks */

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsFavorite(artworkId: string): boolean {
  return useStore().favorites.some((a) => a.id === artworkId);
}

/** Ids of every collection that already contains `artworkId`. */
export function useCollectionsContaining(artworkId: string): Set<string> {
  const { collections } = useStore();
  return new Set(
    collections.filter((c) => c.items.some((a) => a.id === artworkId)).map((c) => c.id),
  );
}
