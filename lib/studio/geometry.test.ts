import { describe, expect, it } from 'vitest';
import { coverPlacement, DEFAULT_CROP } from './geometry';

/**
 * The compositor and CropStage must agree pixel-for-pixel, so these lock the
 * cover maths that used to live (duplicated) in both. Reference numbers are
 * computed the old, explicit way.
 */
describe('coverPlacement', () => {
  it('centers a wide image over a 16:9 box at zoom 1', () => {
    // 2000×1000 into 1600×900: cover scale = max(0.8, 0.9) = 0.9.
    const p = coverPlacement(2000, 1000, 1600, 900, DEFAULT_CROP);
    expect(p.dw).toBeCloseTo(1800);
    expect(p.dh).toBeCloseTo(900);
    expect(p.ox).toBeCloseTo(200);
    expect(p.oy).toBeCloseTo(0);
    // Centered: dx = (1600 - 1800)/2 = -100; no vertical overflow.
    expect(p.dx).toBeCloseTo(-100);
    expect(p.dy).toBeCloseTo(0);
  });

  it('pans to the overflow extremes without leaving the box', () => {
    const box = { w: 1600, h: 900 };
    const full = coverPlacement(2000, 1000, box.w, box.h, {
      zoom: 1,
      x: 1,
      y: 0,
    });
    // x = +1 pulls the image fully left: dx = center - 1*(ox/2) = -100 - 100.
    expect(full.dx).toBeCloseTo(-200);
    // The right edge of the image sits exactly on the box's right edge.
    expect(full.dx + full.dw).toBeCloseTo(box.w);

    const neg = coverPlacement(2000, 1000, box.w, box.h, { zoom: 1, x: -1, y: 0 });
    expect(neg.dx).toBeCloseTo(0);
  });

  it('zooms about the center', () => {
    const p = coverPlacement(1000, 1000, 1000, 1000, { zoom: 2, x: 0, y: 0 });
    expect(p.dw).toBeCloseTo(2000);
    expect(p.dh).toBeCloseTo(2000);
    expect(p.dx).toBeCloseTo(-500);
    expect(p.dy).toBeCloseTo(-500);
  });

  it('handles a tall image into a portrait box (phone wallpaper)', () => {
    // 1000×2000 into 1320×2868: cover = max(1.32, 1.434) = 1.434.
    const p = coverPlacement(1000, 2000, 1320, 2868, DEFAULT_CROP);
    expect(p.dh).toBeCloseTo(2868);
    expect(p.dw).toBeCloseTo(1434);
    expect(p.oy).toBeCloseTo(0);
    expect(p.ox).toBeCloseTo(114);
  });

  it('clamps zoom and pan to their valid ranges', () => {
    const p = coverPlacement(1000, 1000, 1000, 1000, { zoom: 99, x: 5, y: -5 });
    expect(p.dw).toBeCloseTo(4000); // zoom clamped to 4
    // x clamped to +1, y clamped to -1: pans to the extremes, still covering.
    expect(p.dx + p.dw).toBeCloseTo(1000);
    expect(p.dy).toBeCloseTo(0);
  });
});
