/**
 * CORS-safe image loading, shared by the Studio compositor, the saliency
 * sampler, and Watch-mode preloading.
 */

/**
 * Route a cross-origin image through a public CORS proxy so the canvas stays
 * untainted and exportable. Some museum CDNs (Cleveland, occasionally AIC) don't
 * send `Access-Control-Allow-Origin`; the Met does, and data URLs never need it.
 */
export function proxied(src: string): string {
  const noProto = src.replace(/^https?:\/\//, '');
  const scheme = src.startsWith('https') ? 'ssl:' : '';
  return `https://images.weserv.nl/?url=${encodeURIComponent(scheme + noProto)}`;
}

/** Attempt a cross-origin-readable load; fall back to the proxy on failure. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const attempt = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('load-failed'));
      img.src = url;
    });

  // Data URLs (uploads) are same-origin — load directly, never proxy.
  if (src.startsWith('data:')) return attempt(src);

  return attempt(src).catch(() =>
    attempt(proxied(src)).catch(() => {
      throw new Error('Could not load the source image.');
    }),
  );
}
