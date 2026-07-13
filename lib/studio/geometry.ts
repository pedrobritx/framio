/**
 * Shared crop geometry — the single source of truth for "cover this box with
 * that image, zoomed and panned". CropStage (the interactive preview), the
 * canvas compositor, and the saliency auto-crop all call the same maths, so
 * what you see is exactly what exports.
 */

export interface Crop {
  /** 1..4 — fill multiplier over the cover scale. */
  zoom: number;
  /** -1..1 — horizontal pan within the overflow. */
  x: number;
  /** -1..1 — vertical pan within the overflow. */
  y: number;
}

export const DEFAULT_CROP: Crop = { zoom: 1, x: 0, y: 0 };

export interface CoverPlacement {
  /** Drawn image size. */
  dw: number;
  dh: number;
  /** Drawn image origin (top-left), relative to the box. */
  dx: number;
  dy: number;
  /** Overflow beyond the box on each axis (≥ 0). */
  ox: number;
  oy: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Place an image of natural size (natW × natH) so it covers a box
 * (boxW × boxH) at the crop's zoom, panned by the crop's offsets.
 */
export function coverPlacement(
  natW: number,
  natH: number,
  boxW: number,
  boxH: number,
  crop: Crop,
): CoverPlacement {
  const zoom = clamp(crop.zoom, 1, 4);
  const scale = Math.max(boxW / natW, boxH / natH) * zoom;
  const dw = natW * scale;
  const dh = natH * scale;
  const ox = dw - boxW;
  const oy = dh - boxH;
  const dx = (boxW - dw) / 2 - clamp(crop.x, -1, 1) * (ox / 2);
  const dy = (boxH - dh) / 2 - clamp(crop.y, -1, 1) * (oy / 2);
  return { dw, dh, dx, dy, ox, oy };
}
