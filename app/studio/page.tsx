'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type StudioMode } from '@/lib/frame';
import {
  DEFAULT_PRESET_ID,
  DEVICE_PRESETS,
  presetAspect,
  presetById,
  presetResolution,
  type DevicePreset,
} from '@/lib/devices';
import { composeCanvas } from '@/lib/studio/composeCanvas';
import { triggerDownload, slugify } from '@/lib/studio/download';
import { suggestCrop } from '@/lib/studio/saliency';
import {
  embedJpegMetadata,
  metadataFor,
  uploadMetadata,
} from '@/lib/studio/metadata';
import { baseName, fileToDataUrl, UPLOAD_ACCEPT } from '@/lib/studio/upload';
import { getArtwork } from '@/lib/sources';
import { getUpload } from '@/lib/store';
import CropStage, { DEFAULT_CROP, type Crop } from '@/components/CropStage';
import type { Artwork } from '@/lib/types';

const MODES: { id: StudioMode; label: string; blurb: string }[] = [
  { id: 'museumMat', label: 'Museum Mat', blurb: 'Centered on an elegant mat.' },
  { id: 'floating', label: 'Floating Canvas', blurb: 'Generous gallery margins.' },
  { id: 'smartCrop', label: 'Smart Crop', blurb: 'Fills the screen, composition-aware.' },
  { id: 'blurExtend', label: 'Blur Extend', blurb: 'Soft blurred extension.' },
];

const MATS: { key: string; hex: string }[] = [
  { key: 'ivory', hex: '#F7F4EF' },
  { key: 'stone', hex: '#E7E2D9' },
  { key: 'charcoal', hex: '#1A1A1C' },
];

function Preview({
  src,
  mode,
  matHex,
  margin,
  aspect,
}: {
  src: string;
  mode: StudioMode;
  matHex: string;
  margin: number;
  aspect: number;
}) {
  return (
    <div
      className="relative w-full overflow-hidden border border-stone"
      style={{ background: matHex, aspectRatio: String(aspect) }}
    >
      {mode === 'blurExtend' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'blur(28px)', transform: 'scale(1.1)' }}
        />
      )}
      {mode === 'smartCrop' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
      ) : mode === 'blurExtend' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="preview" className="relative h-full w-full object-contain" />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ padding: `${Math.round(margin * 100)}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="h-full w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function StudioInner() {
  const sp = useSearchParams();
  const directSrc = sp.get('src') ?? '';
  const id = sp.get('id') ?? '';
  // The full artwork, when known — so exports can embed its credit metadata.
  const [resolvedArt, setResolvedArt] = useState<Artwork | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState('');
  const [resolvedTitle, setResolvedTitle] = useState('');
  // An image dropped straight into the studio (no Browse / Library detour).
  const [localSrc, setLocalSrc] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  // The chosen device preset drives the export resolution and aspect. Start
  // from the Frame default (matches the prerendered HTML), read saved sizes
  // on mount.
  const [preset, setPreset] = useState<DevicePreset>(presetById(DEFAULT_PRESET_ID));
  const [resolution, setResolution] = useState(() =>
    presetResolution(presetById(DEFAULT_PRESET_ID)),
  );

  useEffect(() => {
    setResolution(presetResolution(preset));
  }, [preset]);

  // A work can arrive by direct image URL (?src=…, legacy links) or by id
  // (?id=upload:… / met:… ), resolved here client-side.
  useEffect(() => {
    if (!id) return;
    if (id.startsWith('upload:')) {
      const up = getUpload(id);
      if (up) {
        setResolvedArt(up);
        setResolvedSrc(up.imageUrl);
        setResolvedTitle(up.title);
      }
      return;
    }
    let active = true;
    getArtwork(id).then((art) => {
      if (!active || !art) return;
      setResolvedArt(art);
      setResolvedSrc(art.imageUrl);
      setResolvedTitle(art.title);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const src = directSrc || resolvedSrc || localSrc;
  const title =
    sp.get('title') || resolvedTitle || localTitle || 'Untitled';

  const [mode, setMode] = useState<StudioMode>('museumMat');
  const [matKey, setMatKey] = useState('ivory');
  const [margin, setMargin] = useState(0.08);
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const [busy, setBusy] = useState(false);
  const [autoCropping, setAutoCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = presetAspect(preset);
  const matHex = MATS.find((m) => m.key === matKey)?.hex ?? '#F7F4EF';
  const showMatControls = mode === 'museumMat' || mode === 'floating';
  const isCrop = mode === 'smartCrop';

  // A crop's pan offsets are meaningless once the target aspect changes; reset.
  useEffect(() => {
    setCrop(DEFAULT_CROP);
  }, [preset.id]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);

  async function ingest(files: FileList | File[]) {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) {
      setError('Please choose an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    setReading(true);
    setError(null);
    try {
      const { url } = await fileToDataUrl(file);
      setLocalSrc(url);
      setLocalTitle(baseName(file.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    } finally {
      setReading(false);
    }
  }

  async function autoCrop() {
    if (!src) return;
    setAutoCropping(true);
    try {
      setCrop(await suggestCrop(src, aspect));
    } finally {
      setAutoCropping(false);
    }
  }

  async function exportFrame() {
    if (!src) return;
    setBusy(true);
    setError(null);
    try {
      const raw = await composeCanvas(src, {
        mode,
        matColor: matKey,
        margin,
        zoom: crop.zoom,
        offsetX: crop.x,
        offsetY: crop.y,
        width: resolution.width,
        height: resolution.height,
      });
      // Credit travels with the file. Museum works carry the full record;
      // a user's own image gets only its title (never a CC0 claim).
      const meta =
        resolvedArt && resolvedArt.source !== 'upload'
          ? metadataFor(resolvedArt)
          : uploadMetadata(title);
      const blob = await embedJpegMetadata(raw, meta);
      triggerDownload(blob, `framio-${slugify(title)}-${preset.id}.jpg`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  if (!src) {
    // A work is on the way (resolving by id) — hold rather than flash the empty state.
    if (id) {
      return (
        <div className="max-w-2xl px-6 py-10 md:px-10 md:py-16">
          <p className="eyebrow">Frame Studio</p>
          <p className="mt-5 text-ink-soft">Loading your work…</p>
        </div>
      );
    }
    return (
      <div className="max-w-2xl px-6 py-10 md:px-10 md:py-16">
        <p className="eyebrow">Frame Studio</p>
        <h1 className="mt-2 font-editorial text-4xl md:text-5xl">Frame any work</h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          Drop an image to crop it for your Frame — or open an artwork from{' '}
          <Link href="/" className="text-brass">
            Browse
          </Link>{' '}
          and choose “Open in Frame Studio”.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files);
          }}
          className={`mt-8 flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-colors ${
            dragging ? 'border-brass bg-brass/5' : 'border-stone bg-ivory/40'
          }`}
        >
          <p className="font-editorial text-2xl">Drop an image to frame it</p>
          <p className="max-w-md text-sm text-ink-soft">
            Drag a photo or artwork here — or choose a file. Crop it for your
            Frame right away.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) ingest(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={reading}
            className="mt-1 bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass disabled:opacity-50"
          >
            {reading ? 'Reading…' : 'Choose a file'}
          </button>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <header className="mb-6 space-y-1">
        <p className="eyebrow">Frame Studio</p>
        <h1 className="font-editorial text-3xl md:text-4xl">{title}</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-12">
        <div>
          <div className="bg-sand p-4 md:p-8">
            {isCrop ? (
              <CropStage src={src} crop={crop} onChange={setCrop} aspect={aspect} />
            ) : (
              <Preview
                src={src}
                mode={mode}
                matHex={matHex}
                margin={margin}
                aspect={aspect}
              />
            )}
          </div>
          <p className="mt-3 text-xs uppercase tracking-label text-ink-soft">
            {isCrop
              ? `Drag to reposition · pinch or scroll to fill. Locked to ${preset.label}.`
              : `Preview · approximate. Export renders the true ${resolution.width}×${resolution.height} file.`}
          </p>
        </div>

        <aside className="space-y-8">
          <div className="space-y-3">
            <p className="eyebrow">Device</p>
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p)}
                  aria-pressed={preset.id === p.id}
                  className={`border p-3 text-left transition-colors duration-300 ease-gallery ${
                    preset.id === p.id
                      ? 'border-brass'
                      : 'border-stone hover:border-ink-soft'
                  }`}
                >
                  <span className="block text-sm">{p.label}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{p.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="eyebrow">Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                  className={`border p-3 text-left transition-colors duration-300 ease-gallery ${
                    mode === m.id ? 'border-brass' : 'border-stone hover:border-ink-soft'
                  }`}
                >
                  <span className="block text-sm">{m.label}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{m.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          {showMatControls && (
            <>
              <div className="space-y-3">
                <p className="eyebrow">Mat</p>
                <div className="flex gap-3">
                  {MATS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMatKey(m.key)}
                      aria-label={`${m.key} mat`}
                      aria-pressed={matKey === m.key}
                      className={`h-9 w-9 rounded-full border border-stone ${
                        matKey === m.key
                          ? 'ring-2 ring-brass ring-offset-2 ring-offset-paper'
                          : ''
                      }`}
                      style={{ background: m.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Margin</p>
                  <span className="text-xs text-ink-soft">
                    {Math.round(margin * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.3}
                  step={0.01}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  aria-label="Margin"
                  className="w-full accent-brass"
                />
              </div>
            </>
          )}

          {isCrop && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Zoom</p>
                <span className="text-xs text-ink-soft">
                  {crop.zoom.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={crop.zoom}
                onChange={(e) =>
                  setCrop((c) => ({ ...c, zoom: Number(e.target.value) }))
                }
                aria-label="Zoom"
                className="w-full accent-brass"
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={autoCrop}
                  disabled={autoCropping}
                  className="text-sm text-ink underline underline-offset-2 decoration-brass transition-colors hover:text-brass disabled:opacity-50"
                >
                  {autoCropping ? 'Finding the focus…' : 'Auto-crop to the focus'}
                </button>
                <button
                  type="button"
                  onClick={() => setCrop(DEFAULT_CROP)}
                  className="text-sm text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
                >
                  Reset crop
                </button>
              </div>
              <p className="text-xs text-ink-soft">
                Auto-crop centres the artwork&apos;s most visually active
                region for {preset.label}. Drag to adjust.
              </p>
            </div>
          )}

          <div className="space-y-3 border-t border-stone pt-6">
            <button
              type="button"
              onClick={exportFrame}
              disabled={busy}
              className="w-full bg-ink px-5 py-3 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass disabled:opacity-50"
            >
              {busy ? 'Composing…' : `Export for ${preset.label}`}
            </button>
            <p className="text-xs text-ink-soft">
              {resolution.width}×{resolution.height} · sRGB JPEG · sized for{' '}
              {preset.label}.{' '}
              {resolvedArt && resolvedArt.source !== 'upload'
                ? 'Artist, museum, and license are embedded in the file.'
                : ''}{' '}
              See docs/EXPORTS.md.
            </p>
            {error && (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioInner />
    </Suspense>
  );
}
