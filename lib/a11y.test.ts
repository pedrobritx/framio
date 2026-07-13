import { describe, expect, it } from 'vitest';
import { artAlt } from './a11y';
import type { Artwork } from './types';

function art(overrides: Partial<Artwork>): Artwork {
  return {
    id: 'met:1',
    source: 'met',
    sourceId: '1',
    title: 'Untitled',
    artist: 'Unknown artist',
    year: '',
    medium: '',
    museum: '',
    isPublicDomain: true,
    imageUrl: 'x',
    thumbUrl: 'x',
    ...overrides,
  };
}

describe('artAlt', () => {
  it('prefers curated alt text over everything', () => {
    expect(
      artAlt(
        art({
          altText: 'A windblown wheat field under a turbulent sky.',
          title: 'Wheat Field with Cypresses',
        }),
      ),
    ).toBe('A windblown wheat field under a turbulent sky.');
  });

  it('composes title, artist, year, and museum', () => {
    expect(
      artAlt(
        art({
          title: 'The Harvesters',
          artist: 'Pieter Bruegel the Elder',
          year: '1565',
          museum: 'The Met',
        }),
      ),
    ).toBe('The Harvesters — Pieter Bruegel the Elder, 1565. The Met.');
  });

  it('never ships "Untitled by Unknown artist"', () => {
    const result = artAlt(art({ museum: 'Statens Museum for Kunst' }));
    expect(result).toBe('Artwork from Statens Museum for Kunst');
    expect(result).not.toContain('Untitled');
    expect(result).not.toContain('Unknown artist');
  });

  it('degrades to an honest generic label with no metadata at all', () => {
    expect(artAlt(art({}))).toBe('Artwork');
  });

  it('drops the year when unknown', () => {
    expect(artAlt(art({ title: 'Boating', artist: 'Edouard Manet' }))).toBe(
      'Boating — Edouard Manet',
    );
  });
});
