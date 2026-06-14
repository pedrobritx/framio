import sharp from 'sharp';
import { TARGET, resolveMatColor, type StudioOptions } from '../frame';

/**
 * Frame Studio engine. Composes any source image onto the Frame's native
 * 3840×2160 sRGB canvas, returning a JPEG buffer. See docs/ARCHITECTURE.md.
 */

const JPEG = { quality: 92, chromaSubsampling: '4:4:4' as const };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export async function compose(
  input: Buffer,
  opts: StudioOptions,
): Promise<Buffer> {
  const { width: W, height: H } = TARGET;
  const mat = resolveMatColor(opts.matColor);

  switch (opts.mode) {
    case 'smartCrop':
      return sharp(input)
        .resize(W, H, {
          fit: 'cover',
          position:
            opts.position === 'centre'
              ? 'centre'
              : sharp.strategy.attention,
        })
        .flatten({ background: mat })
        .toColourspace('srgb')
        .jpeg(JPEG)
        .toBuffer();

    case 'blurExtend': {
      const background = await sharp(input)
        .resize(W, H, { fit: 'cover' })
        .blur(40)
        .toBuffer();
      const foreground = await sharp(input)
        .resize(W, H, { fit: 'inside' })
        .toBuffer();
      return sharp(background)
        .composite([{ input: foreground, gravity: 'centre' }])
        .flatten({ background: mat })
        .toColourspace('srgb')
        .jpeg(JPEG)
        .toBuffer();
    }

    case 'museumMat':
    case 'floating':
    default: {
      const margin = clamp(
        opts.margin ?? (opts.mode === 'floating' ? 0.16 : 0.08),
        0,
        0.3,
      );
      const innerW = Math.max(1, Math.round(W * (1 - 2 * margin)));
      const innerH = Math.max(1, Math.round(H * (1 - 2 * margin)));
      const art = await sharp(input)
        .resize(innerW, innerH, { fit: 'inside' })
        .toBuffer();
      return sharp({
        create: { width: W, height: H, channels: 3, background: mat },
      })
        .composite([{ input: art, gravity: 'centre' }])
        .toColourspace('srgb')
        .jpeg(JPEG)
        .toBuffer();
    }
  }
}
