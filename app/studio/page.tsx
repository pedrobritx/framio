'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TARGET, type StudioMode } from '@/lib/frame';

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
}: {
  src: string;
  mode: StudioMode;
  matHex: string;
  margin: number;
}) {
  return (
    <div
      className="relative aspect-video w-full overflow-hidden border border-stone"
      style={{ background: matHex }}
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
  const src = sp.get('src') ?? '';
  const title = sp.get('title') ?? 'Untitled';

  const [mode, setMode] = useState<StudioMode>('museumMat');
  const [matKey, setMatKey] = useState('ivory');
  const [margin, setMargin] = useState(0.08);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matHex = MATS.find((m) => m.key === matKey)?.hex ?? '#F7F4EF';
  const showMatControls = mode === 'museumMat' || mode === 'floating';

  async function exportFrame() {
    if (!src) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src, mode, matColor: matKey, margin }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'framio-3840x2160.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  if (!src) {
    return (
      <div className="max-w-2xl px-6 py-10 md:px-10 md:py-16">
        <p className="eyebrow">Frame Studio</p>
        <h1 className="mt-2 font-editorial text-4xl md:text-5xl">Frame any work</h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          Open an artwork from{' '}
          <Link href="/" className="text-brass">
            Browse
          </Link>{' '}
          and choose “Open in Frame Studio” to compose it for your Frame.
        </p>
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
            <Preview src={src} mode={mode} matHex={matHex} margin={margin} />
          </div>
          <p className="mt-3 text-xs uppercase tracking-label text-ink-soft">
            Preview · approximate. Export renders the true {TARGET.width}×{TARGET.height} file.
          </p>
        </div>

        <aside className="space-y-8">
          <div className="space-y-3">
            <p className="eyebrow">Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
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
                      onClick={() => setMatKey(m.key)}
                      aria-label={m.key}
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
                  className="w-full accent-brass"
                />
              </div>
            </>
          )}

          <div className="space-y-3 border-t border-stone pt-6">
            <button
              onClick={exportFrame}
              disabled={busy}
              className="w-full bg-ink px-5 py-3 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass disabled:opacity-50"
            >
              {busy ? 'Composing…' : 'Export for Frame'}
            </button>
            <p className="text-xs text-ink-soft">
              {TARGET.width}×{TARGET.height} · sRGB JPEG · sized for a 55″ Frame. Load it
              via SmartThings or USB (see docs/FRAME-TV.md).
            </p>
            {error && <p className="text-xs text-red-700">{error}</p>}
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
