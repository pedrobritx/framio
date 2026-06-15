'use client';

import { useState } from 'react';
import type { Artwork } from '@/lib/types';
import { TARGET, type StudioMode } from '@/lib/frame';
import { composeCanvas } from '@/lib/studio/composeCanvas';
import { slugify, triggerDownload } from '@/lib/studio/download';

const MODES: { id: StudioMode; label: string }[] = [
  { id: 'smartCrop', label: 'Smart Crop · fill 16:9' },
  { id: 'museumMat', label: 'Museum Mat' },
  { id: 'floating', label: 'Floating Canvas' },
  { id: 'blurExtend', label: 'Blur Extend' },
];

/**
 * Bundle crop — frame an entire user-made collection in one pass. Each
 * public-domain work is composed onto the Frame's 3840×2160 / 16:9 canvas in the
 * chosen style and downloaded in sequence, ready to load onto the TV.
 */
export default function BundleExport({ items }: { items: Artwork[] }) {
  const exportable = items.filter((a) => a.isPublicDomain);
  const [mode, setMode] = useState<StudioMode>('smartCrop');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (exportable.length === 0) return null;

  async function run() {
    setBusy(true);
    setError(null);
    setDone(0);
    let ok = 0;
    for (let i = 0; i < exportable.length; i++) {
      const art = exportable[i];
      try {
        const blob = await composeCanvas(art.imageUrl, { mode });
        triggerDownload(
          blob,
          `framio-${String(i + 1).padStart(2, '0')}-${slugify(art.title)}.jpg`,
        );
        ok += 1;
        setDone(ok);
        // Breathe between saves so the browser doesn't drop rapid downloads.
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        /* skip a work that won't load; keep framing the rest */
      }
    }
    if (ok === 0) {
      setError('None of these works could be framed just now. Try again in a moment.');
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border border-stone bg-ivory/50 p-4">
      <div className="mr-auto">
        <p className="text-sm text-ink">Bundle crop · frame the whole collection</p>
        <p className="text-xs text-ink-soft">
          {exportable.length} public-domain work{exportable.length === 1 ? '' : 's'} → a{' '}
          {TARGET.width}×{TARGET.height} file each, cropped to your Frame&apos;s 16:9.
        </p>
      </div>

      <label htmlFor="bundle-mode" className="sr-only">
        Frame style
      </label>
      <select
        id="bundle-mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as StudioMode)}
        disabled={busy}
        className="border border-stone bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass disabled:opacity-50"
      >
        {MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass disabled:opacity-50"
      >
        {busy ? `Framing ${done}/${exportable.length}…` : `Frame all (${exportable.length})`}
      </button>

      {error && (
        <p role="alert" className="w-full text-xs text-red-700">
          {error}
        </p>
      )}
      {!busy && done > 0 && !error && (
        <p className="w-full text-xs text-ink-soft">
          Framed {done} file{done === 1 ? '' : 's'}. Your browser may ask to allow multiple
          downloads.
        </p>
      )}
    </div>
  );
}
