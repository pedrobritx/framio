import { describe, expect, it } from 'vitest';
import { FRAME_ASPECT, fitsAspect, fitsFrame } from './curation';

describe('fitsFrame', () => {
  it('keeps the original lenient band (1.4–2.1) exactly', () => {
    expect(fitsFrame(1.4)).toBe(true);
    expect(fitsFrame(2.1)).toBe(true);
    expect(fitsFrame(1.778)).toBe(true); // ~16:9 itself
    expect(fitsFrame(1.39)).toBe(false);
    expect(fitsFrame(2.11)).toBe(false);
  });

  it('rejects unknown aspect', () => {
    expect(fitsFrame(undefined)).toBe(false);
  });
});

describe('fitsAspect', () => {
  it('is device-agnostic — works for any target aspect, not just the Frame', () => {
    const phoneAspect = 1179 / 2556; // portrait phone
    expect(fitsAspect(phoneAspect, phoneAspect)).toBe(true);
    expect(fitsAspect(FRAME_ASPECT, phoneAspect)).toBe(false);
  });

  it('supports a single symmetric tolerance', () => {
    expect(fitsAspect(1.5, 1.6, 0.2)).toBe(true);
    expect(fitsAspect(1.3, 1.6, 0.2)).toBe(false);
  });

  it('supports an asymmetric tolerance', () => {
    expect(fitsAspect(1.5, 1.7, { lower: 0.3, upper: 0.1 })).toBe(true);
    expect(fitsAspect(1.85, 1.7, { lower: 0.3, upper: 0.1 })).toBe(false);
  });

  it('rejects unknown aspect regardless of tolerance shape', () => {
    expect(fitsAspect(undefined, FRAME_ASPECT)).toBe(false);
  });
});
