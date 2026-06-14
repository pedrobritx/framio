import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getObject } from '@/lib/met';
import { getGalleryIds } from '@/lib/gallery';

// Static export: pre-render exactly the works reachable from the Browse grid.
export const dynamicParams = false;

export async function generateStaticParams() {
  const ids = await getGalleryIds();
  return ids.map((id) => ({ id }));
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-t border-stone pt-3">
      <dt className="w-28 shrink-0 text-xs uppercase tracking-label text-ink-soft">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const art = await getObject(id);
  if (!art) notFound();

  const studioHref = `/studio?src=${encodeURIComponent(
    art.imageUrl,
  )}&title=${encodeURIComponent(art.title)}`;

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <div className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:gap-12">
        <div className="relative aspect-[4/3] w-full overflow-hidden border border-stone bg-ivory md:aspect-auto md:min-h-[70vh]">
          <Image
            src={art.imageUrl}
            alt={`${art.title} by ${art.artist}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain"
          />
        </div>

        <aside className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-editorial text-3xl leading-tight md:text-4xl">
              {art.title}
            </h1>
            <p className="text-lg text-ink-soft">
              {art.artist}
              {art.year ? `, ${art.year}` : ''}
            </p>
          </div>

          <dl className="space-y-3 text-sm">
            {art.medium && <MetaRow label="Medium" value={art.medium} />}
            <MetaRow label="Museum" value={art.museum} />
            {art.department && (
              <MetaRow label="Department" value={art.department} />
            )}
            <MetaRow
              label="Rights"
              value={
                art.isPublicDomain
                  ? 'Public Domain · CC0'
                  : art.rights ?? 'See museum'
              }
            />
          </dl>

          <div className="flex flex-wrap gap-3 pt-2">
            {art.isPublicDomain ? (
              <Link
                href={studioHref}
                className="bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass"
              >
                Open in Frame Studio
              </Link>
            ) : (
              <span className="border border-stone px-5 py-2.5 text-sm text-ink-soft">
                Discovery only
              </span>
            )}
            {art.objectUrl && (
              <a
                href={art.objectUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-stone px-5 py-2.5 text-sm transition-colors duration-300 ease-gallery hover:border-brass"
              >
                View at the museum
              </a>
            )}
          </div>

          {!art.isPublicDomain && (
            <p className="text-xs text-ink-soft">
              This work may be in copyright — shown for discovery, not export.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
