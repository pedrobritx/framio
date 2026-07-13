import { describe, expect, it } from 'vitest';
import { mapAic, mapCma, mapSmk, mapWiki } from './sources';
import aicFixture from '@/test/fixtures/aic-artwork.json';
import cmaFixture from '@/test/fixtures/cma-artwork.json';
import cmaCopyrighted from '@/test/fixtures/cma-artwork-copyrighted.json';
import smkFixture from '@/test/fixtures/smk-item.json';
import wikiFixture from '@/test/fixtures/wiki-page.json';

type AicItem = Parameters<typeof mapAic>[0];
type CmaItem = Parameters<typeof mapCma>[0];
type SmkItem = Parameters<typeof mapSmk>[0];
type WikiPage = Parameters<typeof mapWiki>[0];

describe('mapAic', () => {
  const art = mapAic(aicFixture.data as AicItem)!;

  it('normalises a real Art Institute response', () => {
    expect(art).not.toBeNull();
    expect(art.id).toBe('aic:28560');
    expect(art.source).toBe('aic');
    expect(art.title).toBe('The Bedroom');
    expect(art.artist).toBe('Vincent van Gogh');
    expect(art.year).toBe('1889');
    expect(art.museum).toBe('Art Institute of Chicago');
    expect(art.isPublicDomain).toBe(true);
    expect(art.rights).toBe('Public Domain · CC0');
    expect(art.objectUrl).toBe('https://www.artic.edu/artworks/28560');
  });

  it('builds IIIF image URLs at full and thumb sizes', () => {
    expect(art.imageUrl).toContain('/iiif/2/');
    expect(art.imageUrl).toContain('/full/1686,/0/default.jpg');
    expect(art.thumbUrl).toContain('/full/400,/0/default.jpg');
  });

  it('carries dimensions, aspect, and dominant colour', () => {
    expect(art.width).toBe(12614);
    expect(art.height).toBe(9875);
    expect(art.aspect).toBeCloseTo(12614 / 9875);
    expect(art.color).toEqual({ h: 40, s: 65, l: 34 });
  });

  it('returns null without an image id', () => {
    expect(mapAic({ ...(aicFixture.data as AicItem), image_id: null })).toBeNull();
  });
});

describe('mapCma', () => {
  const art = mapCma(cmaFixture.data as CmaItem)!;

  it('normalises a real CC0 Cleveland response', () => {
    expect(art).not.toBeNull();
    expect(art.id).toBe('cma:135382');
    expect(art.title).toBe('The Red Kerchief');
    expect(art.year).toBe('c. 1868–73');
    expect(art.museum).toBe('Cleveland Museum of Art');
    expect(art.isPublicDomain).toBe(true);
    expect(art.rights).toBe('Public Domain · CC0');
  });

  it('strips the parenthetical from the creator description', () => {
    // "Claude Monet (French, 1840–1926)" → "Claude Monet"
    expect(art.artist).toBe('Claude Monet');
  });

  it('uses the print JPEG (never the huge full TIFF) as the export image', () => {
    expect(art.imageUrl).toContain('_print.jpg');
    expect(art.thumbUrl).toContain('_web.jpg');
  });

  it('returns null for works without web images (discovery-only records)', () => {
    expect(mapCma(cmaCopyrighted.data as CmaItem)).toBeNull();
  });
});

describe('mapSmk', () => {
  const art = mapSmk(smkFixture.items[0] as SmkItem)!;

  it('normalises a real SMK search item', () => {
    expect(art).not.toBeNull();
    expect(art.id).toBe('smk:KKS2004-95');
    expect(art.title).toBe('Valley Landscape');
    expect(art.artist).toBe('John Marin');
    expect(art.year).toBe('1918');
    expect(art.museum).toBe('Statens Museum for Kunst');
    expect(art.isPublicDomain).toBe(true);
  });

  it('re-sizes the IIIF thumbnail for full and thumb renditions', () => {
    expect(art.imageUrl).toContain('/full/!1686,/');
    expect(art.thumbUrl).toContain('/full/!400,/');
  });

  it('carries dimensions and aspect', () => {
    expect(art.width).toBe(5760);
    expect(art.height).toBe(3840);
    expect(art.aspect).toBeCloseTo(1.5);
  });
});

describe('mapWiki', () => {
  const pages = (wikiFixture as { query: { pages: Record<string, unknown> } })
    .query.pages;
  const page = Object.values(pages)[0] as WikiPage;
  const art = mapWiki(page)!;

  it('normalises a real Commons imageinfo page', () => {
    expect(art).not.toBeNull();
    expect(art.id).toBe('wiki:File:Meisje met de parel.jpg');
    expect(art.source).toBe('wiki');
    expect(art.isPublicDomain).toBe(true);
    expect(art.rights).toBe('Public domain');
  });

  it('strips HTML from extmetadata fields', () => {
    expect(art.artist).toContain('Johannes Vermeer');
    expect(art.artist).not.toContain('<');
    expect(art.title).not.toContain('<');
  });

  it('serves the image through Special:FilePath (thumb from the API)', () => {
    expect(art.imageUrl).toContain('Special:FilePath');
    expect(art.thumbUrl).toContain('upload.wikimedia.org');
  });
});
