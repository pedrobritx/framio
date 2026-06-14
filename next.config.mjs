/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.metmuseum.org' },
    ],
  },
  // Sharp ships native binaries; keep it out of the server bundle.
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
