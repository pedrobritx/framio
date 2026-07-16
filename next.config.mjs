/** @type {import('next').NextConfig} */

// Framio deploys to its own GitHub Pages subdomain (framio.britx.me), so it
// is served from the domain root and needs no base path. PAGES_BASE_PATH
// only needs a value for a sub-path deployment (a GitHub Pages *project*
// page, a fork, or a preview nested under another host) — see
// lib/basePath.ts. The deploy workflow derives it automatically from the
// repo's Pages configuration, so this stays empty for the subdomain setup.
const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig = {
  // Emit a fully static site to ./out so GitHub Pages can host it directly.
  output: 'export',
  // Project pages live at a sub-path; prefix routes and assets accordingly.
  basePath,
  assetPrefix: basePath || undefined,
  // Static export can't run the Image Optimization server — load images as-is.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.metmuseum.org' },
    ],
  },
  // Emit /artwork/<id>/index.html so deep links resolve on static hosting.
  trailingSlash: true,
};

export default nextConfig;
