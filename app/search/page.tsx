import Discover from '@/components/Discover';
import { getGallery, getHero } from '@/lib/gallery';

/**
 * Search merged into the unified Discover surface (also the home page). This
 * route is kept as an alias so existing deep links — /search?school=…&topic=… —
 * still resolve, seeding the same browse-and-search experience.
 */
export default async function SearchPage() {
  const [hero, gallery] = await Promise.all([getHero(), getGallery()]);
  const featured = hero
    ? gallery.filter((art) => art.sourceId !== hero.sourceId)
    : gallery;

  return <Discover hero={hero} featured={featured} />;
}
