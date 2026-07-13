import { describe, expect, it } from 'vitest';
import data from './descriptions.json';

/**
 * Schema guard for the open descriptions dataset — keeps community PRs honest
 * without any extra tooling. See docs/DESCRIPTIONS.md.
 */

const KEY_PATTERN = /^(met|aic|cma|smk|wiki):.+$/;
const LANG_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const MAX_DESCRIPTION = 1200;

const entries = Object.entries(data).filter(
  ([key]) => !key.startsWith('$'),
) as [string, Record<string, unknown>][];

describe('data/descriptions.json', () => {
  it('has at least the seed entries', () => {
    expect(entries.length).toBeGreaterThanOrEqual(10);
  });

  it.each(entries)('%s is a valid entry', (key, entry) => {
    expect(key).toMatch(KEY_PATTERN);
    expect(typeof entry).toBe('object');

    const { altText, description, contributor, lang } = entry as {
      altText?: string;
      description?: string;
      contributor?: string;
      lang?: string;
    };

    // An entry must contribute something.
    expect(Boolean(altText || description)).toBe(true);

    if (altText !== undefined) {
      expect(typeof altText).toBe('string');
      expect(altText.trim().length).toBeGreaterThan(0);
      expect(altText.length).toBeLessThanOrEqual(300);
    }
    if (description !== undefined) {
      expect(typeof description).toBe('string');
      expect(description.trim().length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }

    expect(typeof contributor).toBe('string');
    expect((contributor as string).trim().length).toBeGreaterThan(0);
    expect(lang).toMatch(LANG_PATTERN);
  });
});
