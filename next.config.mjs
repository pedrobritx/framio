/** @type {import('next').NextConfig} */

// GitHub Pages serves this project site under /<repo>/ (e.g. /framio).
// The deploy workflow sets PAGES_BASE_PATH=/framio; local dev leaves it empty.
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
