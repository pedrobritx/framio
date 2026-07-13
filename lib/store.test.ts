import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Artwork } from './types';

/**
 * The store keeps module-level state, so each test gets a fresh module
 * instance (and a fresh localStorage) via resetModules + dynamic import.
 */
async function freshStore() {
  vi.resetModules();
  window.localStorage.clear();
  return import('./store');
}

function fakeArt(id: string): Artwork {
  return {
    id,
    source: 'met',
    sourceId: id.split(':')[1] ?? id,
    title: `Work ${id}`,
    artist: 'Artist',
    year: '1900',
    medium: 'Oil on canvas',
    museum: 'The Met',
    isPublicDomain: true,
    imageUrl: `https://example.test/${id}.jpg`,
    thumbUrl: `https://example.test/${id}-thumb.jpg`,
  };
}

describe('store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('toggles favorites on and off', async () => {
    const store = await freshStore();
    const art = fakeArt('met:1');
    store.toggleFavorite(art);

    // Reading state goes through the hook in the app; here we assert via
    // what was persisted, which is the contract that matters offline.
    const persisted = JSON.parse(window.localStorage.getItem('framio:v1')!);
    expect(persisted.favorites).toHaveLength(1);
    expect(persisted.favorites[0].id).toBe('met:1');

    store.toggleFavorite(art);
    const after = JSON.parse(window.localStorage.getItem('framio:v1')!);
    expect(after.favorites).toHaveLength(0);
  });

  it('creates collections and de-duplicates added works', async () => {
    const store = await freshStore();
    const id = store.createCollection('Quiet mornings');
    const art = fakeArt('met:2');
    store.addToCollection(id, art);
    store.addToCollection(id, art); // duplicate — must be ignored

    const persisted = JSON.parse(window.localStorage.getItem('framio:v1')!);
    expect(persisted.collections).toHaveLength(1);
    expect(persisted.collections[0].name).toBe('Quiet mornings');
    expect(persisted.collections[0].items).toHaveLength(1);
  });

  it('removes works from a collection and deletes collections', async () => {
    const store = await freshStore();
    const id = store.createCollection('Test');
    store.addToCollection(id, fakeArt('met:3'));
    store.removeFromCollection(id, 'met:3');

    let persisted = JSON.parse(window.localStorage.getItem('framio:v1')!);
    expect(persisted.collections[0].items).toHaveLength(0);

    store.deleteCollection(id);
    persisted = JSON.parse(window.localStorage.getItem('framio:v1')!);
    expect(persisted.collections).toHaveLength(0);
  });

  it('stores and retrieves uploads', async () => {
    const store = await freshStore();
    const art = { ...fakeArt('upload:abc'), source: 'upload' as const };
    store.addUpload(art);
    expect(store.getUpload('upload:abc')?.title).toBe('Work upload:abc');
    store.removeUpload('upload:abc');
    expect(store.getUpload('upload:abc')).toBeUndefined();
  });

  it('survives corrupted persisted state', async () => {
    window.localStorage.setItem('framio:v1', '{not json');
    const store = await freshStore();
    // Mutating from a corrupt base must not throw and must re-persist cleanly.
    store.toggleFavorite(fakeArt('met:4'));
    const persisted = JSON.parse(window.localStorage.getItem('framio:v1')!);
    expect(persisted.favorites).toHaveLength(1);
  });
});
