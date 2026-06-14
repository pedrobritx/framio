/**
 * Browse facets for Search — the vocabulary people actually look art up by.
 *
 * Movements/topics are best expressed as Met keyword terms (`q`); culture maps to
 * the API's `artistOrCulture`; periods to `dateBegin`/`dateEnd`; departments to
 * `departmentId`. See lib/metClient.ts for how these are applied.
 */

/** Schools / movements — appended to the keyword query. */
export const SCHOOLS: string[] = [
  'Impressionism',
  'Post-Impressionism',
  'Pointillism',
  'Abstract',
  'Modernism',
  'Cubism',
  'Surrealism',
  'Expressionism',
  'Romanticism',
  'Realism',
  'Baroque',
  'Rococo',
  'Renaissance',
  'Art Nouveau',
  'Ukiyo-e',
];

/** Topics — a friendly label plus the query term it stands for. */
export const TOPICS: { label: string; q: string }[] = [
  { label: 'Nature', q: 'nature' },
  { label: 'Landscape', q: 'landscape' },
  { label: 'Portrait', q: 'portrait' },
  { label: 'Still Life', q: 'still life' },
  { label: 'Flowers', q: 'flowers' },
  { label: 'Seascape', q: 'seascape' },
  { label: 'Animals', q: 'animals' },
  { label: 'Mythology', q: 'mythology' },
  { label: 'Architecture', q: 'architecture' },
  { label: 'Cityscape', q: 'cityscape' },
];

/** Cultures — applied to the Met `artistOrCulture` parameter. */
export const CULTURES: string[] = [
  'Japanese',
  'Chinese',
  'French',
  'Italian',
  'Dutch',
  'Spanish',
  'American',
  'British',
  'German',
  'Egyptian',
  'Greek',
  'Roman',
  'Indian',
  'Persian',
];

/** Time periods — mapped to the Met date range filter. */
export const PERIODS: { label: string; begin: number; end: number }[] = [
  { label: 'Antiquity', begin: -3000, end: 500 },
  { label: 'Medieval', begin: 500, end: 1400 },
  { label: '15th c.', begin: 1400, end: 1500 },
  { label: '16th c.', begin: 1500, end: 1600 },
  { label: '17th c.', begin: 1600, end: 1700 },
  { label: '18th c.', begin: 1700, end: 1800 },
  { label: '19th c.', begin: 1800, end: 1900 },
  { label: '1900–1950', begin: 1900, end: 1950 },
  { label: '1950–today', begin: 1950, end: 2100 },
];

/** A small, stable subset of Met department ids. */
export const DEPARTMENTS: { id: number; label: string }[] = [
  { id: 11, label: 'European Paintings' },
  { id: 21, label: 'Modern Art' },
  { id: 9, label: 'Drawings & Prints' },
  { id: 6, label: 'Asian Art' },
  { id: 19, label: 'Photographs' },
  { id: 10, label: 'Egyptian Art' },
  { id: 13, label: 'Greek & Roman Art' },
  { id: 14, label: 'Islamic Art' },
  { id: 17, label: 'Medieval Art' },
  { id: 5, label: 'Africa, Oceania & Americas' },
];

/** Mediums — applied to the Met `medium` parameter. */
export const MEDIUMS: string[] = [
  'Paintings',
  'Prints',
  'Drawings',
  'Sculpture',
  'Photographs',
  'Ceramics',
  'Textiles',
];

/**
 * Museums. The MVP sources The Met's Open Access collection; the field is here so
 * Browse-by-museum is ready as more institutions come online (Phase 2).
 */
export const MUSEUMS: { id: string; label: string; available: boolean }[] = [
  { id: 'met', label: 'The Met', available: true },
  { id: 'aic', label: 'Art Institute of Chicago', available: false },
  { id: 'cma', label: 'Cleveland Museum of Art', available: false },
  { id: 'rijks', label: 'Rijksmuseum', available: false },
];
