// Render the app icons from SVG to PNG at build time, using the sharp
// dependency already present for the Studio reference pipeline. Generated
// PNGs are gitignored — this script is the source of truth.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const out = join(pub, 'icons');

const JOBS = [
  { svg: 'icon.svg', name: 'icon-192.png', size: 192 },
  { svg: 'icon.svg', name: 'icon-512.png', size: 512 },
  { svg: 'icon.svg', name: 'apple-touch-icon.png', size: 180 },
  { svg: 'icon-maskable.svg', name: 'maskable-512.png', size: 512 },
];

await mkdir(out, { recursive: true });
await Promise.all(
  JOBS.map(({ svg, name, size }) =>
    sharp(join(pub, svg))
      .resize(size, size)
      .png()
      .toFile(join(out, name)),
  ),
);
console.log(`icons: wrote ${JOBS.length} PNGs to public/icons`);
