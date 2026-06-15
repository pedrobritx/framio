'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Crop {
  zoom: number; // 1..4 — fill multiplier over the 16:9 cover
  x: number; // -1..1 — horizontal pan within the overflow
  y: number; // -1..1 — vertical pan within the overflow
}

export const DEFAULT_CROP: Crop = { zoom: 1, x: 0, y: 0 };

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Interactive crop locked to the Frame TV's 16:9. The reader drags to
 * reposition and zooms to fill; the cover-scale maths here mirrors the canvas
 * export exactly, so the preview is precisely what ships to the wall.
 */
export default function CropStage({
  src,
  crop,
  onChange,
}: {
  src: string;
  crop: Crop;
  onChange: (c: Crop) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );
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
          const Wp = box.clientWidth;
          const Hp = box.clientHeight;
          const s = Math.max(Wp / nat.w, Hp / nat.h) * crop.zoom;
          const dw = nat.w * s;
          const dh = nat.h * s;
          const ox = dw - Wp;
          const oy = dh - Hp;
          const left = (Wp - dw) / 2 - crop.x * (ox / 2);
          const top = (Hp - dh) / 2 - crop.y * (oy / 2);
          return { dw, dh, left, top, ox, oy };
        })()
      : null;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      drag.current = { px: e.clientX, py: e.clientY, ox: crop.x, oy: crop.y };
    },
    [crop.x, crop.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
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
    drag.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  const grabbable = geom != null && (geom.ox > 1 || geom.oy > 1);

  return (
    <div
      ref={boxRef}
      className="relative aspect-video w-full touch-none select-none overflow-hidden border border-stone bg-ink"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: grabbable ? 'grab' : 'default' }}
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
