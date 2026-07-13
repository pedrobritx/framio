'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  coverPlacement,
  DEFAULT_CROP,
  type Crop,
} from '@/lib/studio/geometry';

export { DEFAULT_CROP, type Crop };

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Interactive crop locked to the export's aspect ratio. Drag (or arrow-key)
 * to reposition, pinch / scroll / slider to fill; the shared cover-placement
 * maths mirrors the canvas export exactly, so the preview is precisely what
 * ships to the wall.
 */
export default function CropStage({
  src,
  crop,
  onChange,
  aspect = 16 / 9,
}: {
  src: string;
  crop: Crop;
  onChange: (c: Crop) => void;
  /** width / height of the export target (16:9 TV, 9:19.5 phone, …). */
  aspect?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );
  /** Live pointers, for two-finger pinch zoom on touch screens. */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const [, force] = useState(0);

  // Re-measure when the stage resizes so the crop stays true to the frame.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => force((n) => n + 1));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const box = boxRef.current;
  const geom =
    box && nat
      ? (() => {
          const { dw, dh, dx, dy, ox, oy } = coverPlacement(
            nat.w,
            nat.h,
            box.clientWidth,
            box.clientHeight,
            crop,
          );
          return { dw, dh, left: dx, top: dy, ox, oy };
        })()
      : null;

  const pinchDistance = () => {
    const pts = Array.from(pointers.current.values());
    return pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 2) {
        // Second finger down — switch from pan to pinch.
        drag.current = null;
        pinch.current = { dist: pinchDistance(), zoom: crop.zoom };
      } else {
        drag.current = { px: e.clientX, py: e.clientY, ox: crop.x, oy: crop.y };
      }
    },
    [crop.x, crop.y, crop.zoom],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (pointers.current.has(e.pointerId)) {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      const pz = pinch.current;
      if (pz && pointers.current.size >= 2 && pz.dist > 0) {
        const zoom = clamp((pinchDistance() / pz.dist) * pz.zoom, MIN_ZOOM, MAX_ZOOM);
        onChange({ ...crop, zoom });
        return;
      }
      const d = drag.current;
      if (!d || !geom) return;
      const dx = e.clientX - d.px;
      const dy = e.clientY - d.py;
      const nx = geom.ox > 0 ? clamp(d.ox - (2 * dx) / geom.ox, -1, 1) : 0;
      const ny = geom.oy > 0 ? clamp(d.oy - (2 * dy) / geom.oy, -1, 1) : 0;
      onChange({ ...crop, x: nx, y: ny });
    },
    [crop, geom, onChange],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  // Trackpad / mouse-wheel zoom, anchored on the current crop.
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoom = clamp(crop.zoom * (e.deltaY < 0 ? 1.05 : 0.95), MIN_ZOOM, MAX_ZOOM);
      onChange({ ...crop, zoom });
    },
    [crop, onChange],
  );

  const grabbable = geom != null && (geom.ox > 1 || geom.oy > 1);

  return (
    <div
      ref={boxRef}
      // Spatial nav must not steal the arrows while the reader is cropping.
      data-no-spatial
      className="relative w-full touch-none select-none overflow-hidden border border-stone bg-ink"
      style={{ aspectRatio: String(aspect), cursor: grabbable ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Crop preview"
        draggable={false}
        onLoad={(e) =>
          setNat({
            w: e.currentTarget.naturalWidth,
            h: e.currentTarget.naturalHeight,
          })
        }
        className="pointer-events-none absolute max-w-none"
        style={
          geom
            ? { width: geom.dw, height: geom.dh, left: geom.left, top: geom.top }
            : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
        }
      />
    </div>
  );
}
