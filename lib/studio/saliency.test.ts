import { describe, expect, it } from 'vitest';
import { bestWindow, energyMap } from './saliency';

/** Build ImageData by filling a rectangle with a colour on a black field. */
function scene(
  w: number,
  h: number,
  rect: { x: number; y: number; w: number; h: number; r: number; g: number; b: number } | null,
): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 3; i < data.length; i += 4) data[i] = 255; // opaque
  if (rect) {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        const p = (y * w + x) * 4;
        data[p] = rect.r;
        data[p + 1] = rect.g;
        data[p + 2] = rect.b;
      }
    }
  }
  return new ImageData(data, w, h);
}

describe('energyMap', () => {
  it('finds energy at the edges of a shape, not in flat fields', () => {
    const img = scene(40, 40, { x: 14, y: 14, w: 12, h: 12, r: 255, g: 220, b: 180 });
    const e = energyMap(img);
    const at = (x: number, y: number) => e[y * 40 + x];
    // A corner of the rectangle (high edge energy) beats the empty top-left.
    expect(at(14, 14)).toBeGreaterThan(at(2, 2));
  });

  it('is essentially flat for a uniform image', () => {
    const e = energyMap(scene(30, 30, null));
    const max = e.reduce((m, v) => Math.max(m, v), 0);
    expect(max).toBeLessThan(0.01);
  });
});

describe('bestWindow', () => {
  it('locks onto an off-center high-energy region', () => {
    // Bright, saturated block on the right half.
    const img = scene(60, 40, { x: 40, y: 12, w: 14, h: 14, r: 255, g: 210, b: 170 });
    const e = energyMap(img);
    const win = bestWindow(e, 60, 40, 24, 24);
    const centerX = win.left + 12;
    // The window centre should sit right of the image centre (x = 30).
    expect(centerX).toBeGreaterThan(30);
  });

  it('returns a low, centered score for a uniform field', () => {
    const e = energyMap(scene(60, 40, null));
    const win = bestWindow(e, 60, 40, 24, 24);
    expect(win.score).toBeLessThan(0.01);
  });
});
