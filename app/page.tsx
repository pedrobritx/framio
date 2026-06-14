import Discover from '@/components/Discover';
import { getGallery, getHero } from '@/lib/gallery';

export default async function BrowsePage() {
  const [hero, gallery] = await Promise.all([getHero(), getGallery()]);
  const featured = hero
    ? gallery.filter((art) => art.sourceId !== hero.sourceId)
    : gallery;

  return <Discover hero={hero} featured={featured} />;
}
