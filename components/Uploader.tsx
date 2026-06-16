'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  addUpload,
  createCollectionWithItems,
  removeUpload,
  useStore,
} from '@/lib/store';
import ArtImage from '@/components/ArtImage';
import { studioHref, artworkHref } from '@/lib/links';
import { TARGET } from '@/lib/frame';
import { baseName, fileToDataUrl, UPLOAD_ACCEPT } from '@/lib/studio/upload';
import type { Artwork } from '@/lib/types';

/**
 * Bring-your-own image. Files are read in the browser, downscaled to the Frame's
 * longest edge (so localStorage stays light and exports stay crisp), and kept as
 * data URLs in the local store — ready to crop in Frame Studio like any museum work.
 * Each upload batch is also gathered into a collection named after the moment.
 */

const ACCEPT = UPLOAD_ACCEPT;

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A readable name for a batch's collection, e.g. "Upload · 15 Jun 2026, 23:46". */
function batchName(date = new Date()): string {
  return `Upload · ${date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function Uploader() {
  const { uploads } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingest(files: FileList | File[]) {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      setError('Please choose an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const batch: Artwork[] = [];
      for (const file of images) {
        const { url, w, h } = await fileToDataUrl(file);
        const id = uid();
        const art: Artwork = {
          id: `upload:${id}`,
          source: 'upload',
          sourceId: id,
          title: baseName(file.name),
          artist: 'Your upload',
          year: '',
          medium: '',
          museum: 'Your upload',
          isPublicDomain: true,
          imageUrl: url,
          thumbUrl: url,
          width: w,
          height: h,
        };
        addUpload(art);
        batch.push(art);
      }
      // Gather the batch into a collection named after the upload moment.
      if (batch.length) createCollectionWithItems(batchName(), batch);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong reading that image.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
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
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? 'border-brass bg-brass/5' : 'border-stone bg-ivory/40'
        }`}
      >
        <p className="font-editorial text-2xl">Drop an image to frame it</p>
        <p className="max-w-md text-sm text-ink-soft">
          Drag a photo or artwork here — or choose a file. We size it for your{' '}
          {TARGET.width}×{TARGET.height} Frame and hand it to Frame Studio to crop.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) ingest(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-1 bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Choose a file'}
        </button>
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {uploads.map((art) => (
            <div key={art.id} className="group space-y-2">
              <Link href={artworkHref(art)} className="block">
                <div className="relative aspect-[4/5] overflow-hidden border border-stone bg-ivory">
                  <ArtImage
                    src={art.thumbUrl}
                    alt={art.title}
                    label={art.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </Link>
              <p className="truncate text-xs text-ink-soft">{art.title}</p>
              <div className="flex items-center gap-3 text-xs">
                <Link
                  href={studioHref({ id: art.id, title: art.title })}
                  className="text-brass hover:underline"
                >
                  Crop for Frame
                </Link>
                <button
                  type="button"
                  onClick={() => removeUpload(art.id)}
                  className="text-ink-soft transition-colors hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
