import type { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/basePath';

/**
 * PWA manifest. Framio deploys to the domain root by default, but the icon
 * `src` paths are still prefixed with BASE_PATH by hand — Next prefixes the
 * manifest's own <link> tag, but not the URLs we author inside the manifest
 * body, so a sub-path deployment (see lib/basePath.ts) needs it applied here
 * explicitly.
 */
const base = BASE_PATH;

// The manifest is a build-time constant; required for `output: export`.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Framio — Your personal museum',
    short_name: 'Framio',
    description:
      "Open-access art from the world's museums, framed for any screen.",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#fbfaf7',
    theme_color: '#fbfaf7',
    icons: [
      {
        src: `${base}/icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}/icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}/icons/maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
