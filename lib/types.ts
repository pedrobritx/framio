export type ArtSource = 'met' | 'aic' | 'cma' | 'smk' | 'wiki' | 'upload';

/** A dominant colour, in HSL (h 0–360, s/l 0–100), for colour-distance search. */
export interface ArtColor {
  h: number;
  s: number;
  l: number;
}

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
  /** width / height, when known — used to match the Frame's 16:9. */
  aspect?: number;
  /** Dominant colour (currently from the Art Institute of Chicago's data). */
  color?: ArtColor;
}
