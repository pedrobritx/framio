/**
 * The open-access collections Framio draws from. One shared list so the
 * Settings and About screens stay in sync, each name linking to the museum's
 * own site. API adapters for these live in lib/sources.ts.
 */

export interface Museum {
  short: string;
  full: string;
  url: string;
}

export const MUSEUMS: Museum[] = [
  {
    short: 'Met',
    full: 'The Metropolitan Museum of Art',
    url: 'https://www.metmuseum.org/',
  },
  {
    short: 'Chicago',
    full: 'Art Institute of Chicago',
    url: 'https://www.artic.edu/',
  },
  {
    short: 'Cleveland',
    full: 'Cleveland Museum of Art',
    url: 'https://www.clevelandart.org/',
  },
  {
    short: 'SMK',
    full: 'Statens Museum for Kunst (SMK)',
    url: 'https://www.smk.dk/',
  },
  {
    short: 'Wikimedia',
    full: 'Wikimedia Commons',
    url: 'https://commons.wikimedia.org/',
  },
];
