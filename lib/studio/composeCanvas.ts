import { TARGET, resolveMatColor, type StudioOptions } from '../frame';
import { loadImage } from './loadImage';
import { coverPlacement } from './geometry';

/**
 * Browser Frame Studio engine.
 *
 * The static build has no server, so the export that once ran through Sharp
 * (see compose.ts, kept as the reference / Frame Bridge pipeline) is mirrored
 * here on a <canvas>. It composes any source image onto an output canvas
 * (the Frame's native 3840×2160 by default) and resolves to a JPEG Blob,
 * ready to download.
 */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Draw `img` contained within the box at (x, y, w, h), centered. */
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Draw `img` covering the box at (x, y, w, h), centered (crops overflow). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export async function composeCanvas(
  src: string,
  opts: StudioOptions,
): Promise<Blob> {
  const img = await loadImage(src);

  const W = opts.width ?? TARGET.width;
  const H = opts.height ?? TARGET.height;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');

  const mat = resolveMatColor(opts.matColor);
  ctx.fillStyle = mat;
  ctx.fillRect(0, 0, W, H);

  switch (opts.mode) {
    case 'smartCrop': {
      // Cover the canvas, then apply the editor's zoom and pan. With the
      // defaults (zoom 1, no offset) this is a plain centered cover crop; the
      // shared geometry mirrors CropStage so the export matches the preview
      // exactly.
      const { dw, dh, dx, dy } = coverPlacement(img.width, img.height, W, H, {
        zoom: opts.zoom ?? 1,
        x: opts.offsetX ?? 0,
        y: opts.offsetY ?? 0,
      });
      ctx.drawImage(img, dx, dy, dw, dh);
      break;
    }

    case 'blurExtend': {
      ctx.save();
      ctx.filter = 'blur(40px)';
      drawCover(ctx, img, -40, -40, W + 80, H + 80);
      ctx.restore();
      drawContain(ctx, img, 0, 0, W, H);
      break;
    }

    case 'museumMat':
    case 'floating':
    default: {
      const margin = clamp(
        opts.margin ?? (opts.mode === 'floating' ? 0.16 : 0.08),
        0,
        0.3,
      );
      const inset = Math.round(W * margin);
      const insetY = Math.round(H * margin);
      drawContain(ctx, img, inset, insetY, W - 2 * inset, H - 2 * insetY);
      break;
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Export failed to render.')),
      'image/jpeg',
      0.92,
    );
  });
}
