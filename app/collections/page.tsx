'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  createCollection,
  deleteCollection,
  removeFromCollection,
  renameCollection,
  useStore,
  type Collection,
} from '@/lib/store';
import { artworkHref, studioHref } from '@/lib/links';
import type { Artwork } from '@/lib/types';

function frameHref(art: Artwork) {
  return art.source === 'upload'
    ? studioHref({ id: art.id, title: art.title })
    : studioHref({ src: art.imageUrl, title: art.title });
}

function NewCollectionForm() {
  const [name, setName] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        createCollection(name);
        setName('');
      }}
      className="flex max-w-md gap-2"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name a collection — “Living Room”…"
        className="min-w-0 flex-1 border border-stone bg-paper px-3 py-2.5 text-sm outline-none focus:border-brass"
      />
      <button
        type="submit"
        className="shrink-0 bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass"
      >
        + New
      </button>
    </form>
  );
}

function CollectionDetail({
  collection,
  onBack,
}: {
  collection: Collection;
  onBack: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection.name);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-ink-soft transition-colors hover:text-ink"
      >
        ← All collections
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-5">
        <div className="space-y-1">
          {renaming ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                renameCollection(collection.id, name);
                setRenaming(false);
              }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-stone bg-paper px-3 py-2 font-editorial text-2xl outline-none focus:border-brass"
              />
              <button type="submit" className="bg-ink px-4 text-sm text-paper hover:bg-brass">
                Save
              </button>
            </form>
          ) : (
            <h2 className="font-editorial text-3xl">{collection.name}</h2>
          )}
          <p className="text-xs uppercase tracking-label text-ink-soft">
            {collection.items.length} work{collection.items.length === 1 ? '' : 's'} · queued to
            frame
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => {
              setName(collection.name);
              setRenaming((v) => !v);
            }}
            className="text-ink-soft transition-colors hover:text-ink"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete “${collection.name}”?`)) {
                deleteCollection(collection.id);
                onBack();
              }
            }}
            className="text-ink-soft transition-colors hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {collection.items.length === 0 ? (
        <p className="text-ink-soft">
          Empty for now. Favorite works while browsing and add them here — then frame each for
          your TV.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {collection.items.map((art) => (
            <div key={art.id} className="group space-y-2">
              <Link href={artworkHref(art)} className="block">
                <div className="relative aspect-[4/5] overflow-hidden border border-stone bg-ivory">
                  {art.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={art.thumbUrl}
                      alt={art.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              </Link>
              <p className="truncate text-xs text-ink-soft">{art.artist}</p>
              <div className="flex items-center gap-3 text-xs">
                {art.isPublicDomain ? (
                  <Link href={frameHref(art)} className="text-brass hover:underline">
                    Frame for TV
                  </Link>
                ) : (
                  <span className="text-ink-soft">Discovery only</span>
                )}
                <button
                  type="button"
                  onClick={() => removeFromCollection(collection.id, art.id)}
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

export default function CollectionsPage() {
  const { collections } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = collections.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      {selected ? (
        <CollectionDetail collection={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <div className="space-y-8">
          <header className="space-y-2">
            <p className="eyebrow">Collections</p>
            <h1 className="font-editorial text-4xl md:text-5xl">Your exhibitions</h1>
            <p className="max-w-xl text-ink-soft">
              Group works into rotating sets — each collection is the queue of art you&apos;ll
              crop in Frame Studio and send to your Frame TV.
            </p>
          </header>

          <NewCollectionForm />

          {collections.length === 0 ? (
            <p className="text-ink-soft">
              No collections yet. Create one above, then add works as you browse.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {collections.map((c) => {
                const cover = c.items[0];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className="group text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden border border-stone bg-ivory">
                      {cover?.thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover.thumbUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-gallery group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-label text-ink-soft">
                          Empty
                        </div>
                      )}
                    </div>
                    <p className="mt-2 truncate font-editorial text-lg">{c.name}</p>
                    <p className="text-xs uppercase tracking-label text-ink-soft">
                      {c.items.length} work{c.items.length === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
