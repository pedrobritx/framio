'use client';

import { useEffect, useState } from 'react';

/** Route a failed CDN image through a CORS-friendly proxy as a second attempt. */
function proxied(src: string): string {
  const noProto = src.replace(/^https?:\/\//, '');
  const scheme = src.startsWith('https') ? 'ssl:' : '';
  return `https://images.weserv.nl/?url=${encodeURIComponent(scheme + noProto)}`;
}

type Stage = 'primary' | 'proxy' | 'failed';

/**
 * A resilient artwork image. Museum CDNs occasionally drop a request or a URL
 * 404s — rather than leave the browser's broken-image glyph (the stray "?" seen
 * on cards), we retry once through an image proxy, then fall back to a tasteful
 * placeholder that still names the work.
 */
export default function ArtImage({
  src,
  alt,
  label,
  className = '',
  loading = 'lazy',
}: {
  src?: string;
  alt: string;
  /** Text shown on the fallback placeholder (usually the title). */
  label?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  // Data URLs (uploads) are local — never proxy them.
  const canProxy = Boolean(src) && !src!.startsWith('data:');
  const [stage, setStage] = useState<Stage>(src ? 'primary' : 'failed');

  // Reset when the source changes (lists re-use img nodes across items).
  useEffect(() => {
    setStage(src ? 'primary' : 'failed');
  }, [src]);

  if (stage === 'failed' || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex items-center justify-center bg-ivory px-3 text-center`}
      >
        <span className="line-clamp-3 font-editorial text-sm leading-snug text-ink-soft">
          {label || alt || 'Image unavailable'}
        </span>
      </div>
    );
  }

  const url = stage === 'proxy' && canProxy ? proxied(src) : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading={loading}
      className={className}
      onError={() =>
        setStage((s) => (s === 'primary' && canProxy ? 'proxy' : 'failed'))
      }
    />
  );
}
