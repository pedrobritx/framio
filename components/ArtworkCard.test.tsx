import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import ArtworkCard from './ArtworkCard';
import type { Artwork } from '@/lib/types';

const art: Artwork = {
  id: 'met:436535',
  source: 'met',
  sourceId: '436535',
  title: 'Wheat Field with Cypresses',
  artist: 'Vincent van Gogh',
  year: '1889',
  medium: 'Oil on canvas',
  museum: 'The Met',
  isPublicDomain: true,
  imageUrl: 'https://example.test/a.jpg',
  thumbUrl: 'https://example.test/a-thumb.jpg',
  aspect: 1.6,
  altText: 'A windblown wheat field under a turbulent sky.',
};

describe('ArtworkCard accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<ArtworkCard art={art} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('uses the curated description as the image alt text', () => {
    const { getByAltText } = render(<ArtworkCard art={art} />);
    expect(
      getByAltText('A windblown wheat field under a turbulent sky.'),
    ).toBeTruthy();
  });
});
