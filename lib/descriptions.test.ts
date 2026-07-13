import { describe, expect, it } from 'vitest';
import { applyCommunityText, communityText } from './descriptions';
import type { Artwork } from './types';

const base: Artwork = {
  id: 'met:436535',
  source: 'met',
  sourceId: '436535',
  title: 'Wheat Field with Cypresses',
  artist: 'Vincent van Gogh',
  year: '1889',
  medium: 'Oil on canvas',
  museum: 'The Met',
  isPublicDomain: true,
  imageUrl: 'x',
  thumbUrl: 'x',
};

describe('communityText', () => {
  it('returns the seeded entry for a described work', () => {
    const entry = communityText('met:436535');
    expect(entry).toBeDefined();
    expect(entry!.altText).toBeTruthy();
    expect(entry!.contributor).toBeTruthy();
  });

  it('skips dataset metadata keys and unknown ids', () => {
    expect(communityText('$comment')).toBeUndefined();
    expect(communityText('met:0')).toBeUndefined();
  });
});

describe('applyCommunityText', () => {
  it('layers community alt text and description onto the artwork', () => {
    const decorated = applyCommunityText(base);
    expect(decorated.altText).toContain('wheat field');
    expect(decorated.description).toBeTruthy();
    expect(decorated.descriptionSource).toBe('community');
  });

  it('community text wins over museum text (written for access)', () => {
    const decorated = applyCommunityText({
      ...base,
      description: 'Museum wall text.',
      descriptionSource: 'museum',
    });
    expect(decorated.descriptionSource).toBe('community');
    expect(decorated.description).not.toBe('Museum wall text.');
  });

  it('leaves undescribed works untouched', () => {
    const other = { ...base, id: 'met:999999' };
    expect(applyCommunityText(other)).toEqual(other);
  });
});
