'use client';

import { useEffect, useRef, useState } from 'react';
import type { Artwork } from '@/lib/types';
import {
  addToCollection,
  createCollection,
  removeFromCollection,
  useCollectionsContaining,
  useStore,
} from '@/lib/store';
import { announce } from '@/lib/announce';
import { trapFocus } from '@/lib/focus-trap';
import { CheckIcon, PlusIcon } from './icons';

/**
 * "Add to collection" control: a button that opens a small panel listing the
 * user's collections (toggle membership) with an inline "new collection" field.
 * Collections are the set of works queued to be framed and sent to the TV.
 */
export default function CollectionPicker({
  art,
  variant = 'icon',
}: {
  art: Artwork;
  variant?: 'icon' | 'full';
}) {
  const { collections } = useStore();
  const containing = useCollectionsContaining(art.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    const releaseTrap = panelRef.current ? trapFocus(panelRef.current) : undefined;
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      releaseTrap?.();
    };
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createCollection(trimmed);
    addToCollection(id, art);
    announce(`Added to ${trimmed}`);
    setName('');
  }

  const count = containing.size;

  return (
    <div ref={ref} className="relative">
      {variant === 'full' ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={`flex items-center gap-2 border px-5 py-2.5 text-sm transition-colors duration-300 ease-gallery ${
            count ? 'border-brass bg-brass/10 text-brass-text' : 'border-stone hover:border-brass'
          }`}
        >
          <PlusIcon className="text-base" />
          {count ? `In ${count} collection${count > 1 ? 's' : ''}` : 'Add to collection'}
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Add to collection"
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-base shadow-sm backdrop-blur transition-colors duration-300 ease-gallery hover:bg-paper ${
            count ? 'text-brass-text' : 'text-ink'
          }`}
        >
          <PlusIcon />
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Add to collection"
          className="absolute right-0 z-30 mt-2 w-60 border border-stone bg-paper p-3 text-left shadow-lg"
        >
          <p className="mb-2 text-xs uppercase tracking-label text-ink-soft">
            Add to collection
          </p>

          {collections.length > 0 && (
            <ul className="mb-3 max-h-52 space-y-1 overflow-auto">
              {collections.map((c) => {
                const inIt = containing.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (inIt) {
                          removeFromCollection(c.id, art.id);
                          announce(`Removed from ${c.name}`);
                        } else {
                          addToCollection(c.id, art);
                          announce(`Added to ${c.name}`);
                        }
                      }}
                      className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-ivory"
                    >
                      <span className="truncate">{c.name}</span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center text-xs ${
                          inIt ? 'text-brass-text' : 'text-stone'
                        }`}
                      >
                        {inIt && <CheckIcon />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={onCreate} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New collection…"
              className="min-w-0 flex-1 border border-stone bg-paper px-2 py-1.5 text-sm outline-none focus:border-brass"
            />
            <button
              type="submit"
              className="shrink-0 bg-ink px-3 py-1.5 text-sm text-paper transition-colors hover:bg-brass"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
