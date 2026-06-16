'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_FRAME_ID,
  FRAME_SIZES,
  frameById,
  getFrameSize,
  setFrameSize,
} from '@/lib/frame';

/**
 * TV-size picker for Settings. Every Frame is 16:9, so this only changes the
 * export resolution — 55" (4K) by default. Persists like the theme choice.
 */
export default function FrameSetting({
  onChange,
}: {
  onChange?: (id: string) => void;
}) {
  const [id, setId] = useState<string>(DEFAULT_FRAME_ID);

  useEffect(() => {
    setId(getFrameSize().id);
  }, []);

  const selected = frameById(id);

  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-stone py-4">
      <div>
        <p className="text-sm">Your TV</p>
        <p className="mt-1 text-xs text-ink-soft">
          {selected.width}×{selected.height} · sRGB. Every Frame is 16:9 — size
          only changes the export resolution.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {FRAME_SIZES.map((s) => {
          const active = s.id === id;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setId(s.id);
                setFrameSize(s.id);
                onChange?.(s.id);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-label transition-colors ${
                active
                  ? 'border-brass bg-brass text-paper'
                  : 'border-stone text-ink-soft hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
