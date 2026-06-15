import Explore from '@/components/Explore';
import { getGallery, getHero } from '@/lib/gallery';

export default async function HomePage() {
  const [hero, gallery] = await Promise.all([getHero(), getGallery()]);
  const featured = hero
    ? gallery.filter((art) => art.sourceId !== hero.sourceId)
    : gallery;

  return <Explore hero={hero} featured={featured} />;
}
