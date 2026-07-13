import { describe, expect, it } from 'vitest';
import { mapMetObject } from './met';
import metFixture from '@/test/fixtures/met-object.json';

type MetObject = Parameters<typeof mapMetObject>[0];

describe('mapMetObject', () => {
  const art = mapMetObject(metFixture as MetObject);

  it('normalises a real Met object response', () => {
    expect(art.id).toBe('met:436535');
    expect(art.source).toBe('met');
    expect(art.title).toBe('Wheat Field with Cypresses');
    expect(art.artist).toBe('Vincent van Gogh');
    expect(art.year).toBe('1889');
    expect(art.medium).toBe('Oil on canvas');
    expect(art.isPublicDomain).toBe(true);
    expect(art.rights).toBe('Public Domain · CC0');
    expect(art.imageUrl).toContain('images.metmuseum.org');
    expect(art.objectUrl).toContain('metmuseum.org/art/collection');
  });

  it('falls back to safe defaults when fields are missing', () => {
    const bare = mapMetObject({ objectID: 1 } as MetObject);
    expect(bare.title).toBe('Untitled');
    expect(bare.artist).toBe('Unknown artist');
    expect(bare.isPublicDomain).toBe(false);
    expect(bare.rights).toBeUndefined();
    expect(bare.imageUrl).toBe('');
  });
});
