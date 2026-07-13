import { loadImage } from './loadImage';
import { DEFAULT_CROP, type Crop } from './geometry';

/**
 * In-browser "most interesting region" cropping.
 *
 * Approximates Sharp's `attention` strategy (edges + saturation + skin tones)
 * on a tiny downsample, then slides candidate crop windows across the energy
 * map to find the strongest composition for the target aspect. The winner is
 * returned in the same `Crop {zoom, x, y}` space the interactive CropStage
 * uses — so an auto-crop simply pre-seeds the editor and the reader can still
 * drag it anywhere. On any failure (CORS, canvas, decode) it falls back to a
 * centered crop: suggestion must never block an export.
 */

/** Long edge of the analysis downsample. Tiny is plenty — and fast. */
const SAMPLE = 96;

/** Candidate fill levels. Modest zooms only — never gut the composition. */
const ZOOMS = [1, 1.15, 1.3, 1.4];

/** Mild pull toward the centre so edge slivers don't win ties. */
const CENTER_PRIOR = 0.15;

/** Exponent of the zoom coverage penalty (higher = keep more of the work). */
const COVERAGE_EXP = 0.7;

/**
 * Per-pixel visual energy: Sobel edge magnitude, plus a little saturation,
 * plus a bump for skin tones (faces are usually the subject).
 */
export function energyMap(img: ImageData): Float32Array {
  const { width: w, height: h, data } = img;
  const gray = new Float32Array(w * h);
  const base = new Float32Array(w * h);

  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const skin = r > 95 && r > g && g > b && r - g > 15 ? 1 : 0;
    base[i] = (0.25 * sat) / 255 + 0.4 * skin;
  }

  const energy = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1] +
        gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
      const gy =
        -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] +
        gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      energy[i] = Math.hypot(gx, gy) / 1020 + base[i];
    }
  }
  return energy;
}

/** Summed-area table so window sums are O(1). */
function summedAreaTable(e: Float32Array, w: number, h: number): Float64Array {
  const sat = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += e[y * w + x];
      sat[(y + 1) * (w + 1) + (x + 1)] = sat[y * (w + 1) + (x + 1)] + row;
    }
  }
  return sat;
}

function boxSum(
  sat: Float64Array,
  w: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const W = w + 1;
  return (
    sat[y1 * W + x1] - sat[y0 * W + x1] - sat[y1 * W + x0] + sat[y0 * W + x0]
  );
}

export interface WindowChoice {
  /** Window top-left in map pixels. */
  left: number;
  top: number;
  /** Mean energy of the window, weighted by the centre prior. */
  score: number;
}

/**
 * Slide a winW×winH window across a w×h energy map; return the placement with
 * the highest centre-weighted mean energy.
 */
export function bestWindow(
  e: Float32Array,
  w: number,
  h: number,
  winW: number,
  winH: number,
): WindowChoice {
  const sat = summedAreaTable(e, w, h);
  const area = winW * winH;
  const step = Math.max(1, Math.floor(Math.min(w, h) / 24));
  let best: WindowChoice = { left: 0, top: 0, score: -1 };

  const maxX = w - winW;
  const maxY = h - winH;
  for (let top = 0; ; top += step) {
    const y = Math.min(top, maxY);
    for (let left = 0; ; left += step) {
      const x = Math.min(left, maxX);
      const mean = boxSum(sat, w, x, y, x + winW, y + winH) / area;
      // Distance of the window centre from the map centre, normalised 0..1.
      const cx = maxX > 0 ? Math.abs((2 * x - maxX) / maxX) : 0;
      const cy = maxY > 0 ? Math.abs((2 * y - maxY) / maxY) : 0;
      const prior = 1 - CENTER_PRIOR * Math.max(cx, cy);
      const score = mean * prior;
      if (score > best.score) best = { left: x, top: y, score };
      if (left >= maxX) break;
    }
    if (top >= maxY) break;
  }
  return best;
}

/** Window offset (map px) → pan offset (-1..1) in Crop space. */
function toPan(left: number, overflow: number): number {
  if (overflow <= 0) return 0;
  return Math.max(-1, Math.min(1, (2 * left - overflow) / overflow));
}

/**
 * Suggest the most interesting crop of `src` for a target aspect ratio.
 * Resolves to a centered crop when the image can't be sampled.
 */
export async function suggestCrop(
  src: string,
  targetAspect: number,
  opts?: { maxZoom?: number },
): Promise<Crop> {
  try {
    const img = await loadImage(src);
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;
    if (!natW || !natH) return DEFAULT_CROP;

    const scale = SAMPLE / Math.max(natW, natH);
    const w = Math.max(8, Math.round(natW * scale));
    const h = Math.max(8, Math.round(natH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return DEFAULT_CROP;
    ctx.drawImage(img, 0, 0, w, h);
    const energy = energyMap(ctx.getImageData(0, 0, w, h));

    const maxZoom = opts?.maxZoom ?? 1.4;
    // Cover scale for a box of the target aspect (box size cancels out —
    // only the visible source fraction matters).
    const coverFrac = (zoom: number) => {
      const cover = Math.max(targetAspect / natW, 1 / natH);
      return {
        fw: Math.min(1, targetAspect / (cover * natW * zoom)),
        fh: Math.min(1, 1 / (cover * natH * zoom)),
      };
    };

    let best: { crop: Crop; score: number } = {
      crop: DEFAULT_CROP,
      score: -1,
    };
    for (const zoom of ZOOMS) {
      if (zoom > maxZoom) break;
      const { fw, fh } = coverFrac(zoom);
      const winW = Math.max(4, Math.min(w, Math.round(fw * w)));
      const winH = Math.max(4, Math.min(h, Math.round(fh * h)));
      const win = bestWindow(energy, w, h, winW, winH);
      // Zooming in must earn its keep: penalise lost coverage.
      const score = win.score * Math.pow(zoom, -COVERAGE_EXP);
      if (score > best.score) {
        best = {
          crop: {
            zoom,
            x: toPan(win.left, w - winW),
            y: toPan(win.top, h - winH),
          },
          score,
        };
      }
    }
    return best.crop;
  } catch {
    return DEFAULT_CROP;
  }
}
