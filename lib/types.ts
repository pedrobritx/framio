export type ArtSource = 'met' | 'aic' | 'cma' | 'upload';

/** Canonical artwork shape used across the app (museum works and user uploads). */
export interface Artwork {
  id: string; // `${source}:${sourceId}`
  source: ArtSource;
  sourceId: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  museum: string;
  department?: string;
  rights?: string;
  isPublicDomain: boolean;
  imageUrl: string; // full resolution
  thumbUrl: string; // small / preview
  objectUrl?: string; // link back to the museum page
  width?: number;
  height?: number;
}
