# Writing a museum adapter

Framio talks to each museum through a small **`MuseumAdapter`**. Every source —
The Met, the Art Institute of Chicago, Cleveland, SMK, Wikimedia Commons — is
one of these, and adding a museum is a local change: implement the adapter and
register it. This guide walks through it.

All adapters live in [`lib/sources.ts`](../lib/sources.ts).

## The contract

```ts
interface MuseumAdapter {
  id: MuseumSource;        // short slug: 'met', 'aic', 'cma', …
  label: string;           // full name, e.g. 'Cleveland Museum of Art'
  short: string;           // badge label, e.g. 'Cleveland'
  imagesReliable: boolean; // false if the image host blocks hotlinks (see below)
  hasColor?: boolean;      // true if the API publishes a dominant colour per work
  search(query: SearchQuery, cursor: unknown, signal?: AbortSignal): Promise<SourcePage>;
  getById(id: string, signal?: AbortSignal): Promise<Artwork | null>;
}
```

Two hard rules, because Framio is a **static, keyless, in-browser** app:

1. **No API keys, no backend.** The adapter runs in the visitor's browser. If a
   source needs a key, it can only register when a `NEXT_PUBLIC_*` env var is
   set (see the conditional spread in `ADAPTERS`).
2. **CORS required.** The museum's API and image host must send
   `Access-Control-Allow-Origin`, or the browser can't read them.

And one duty: **only surface open works.** Filter to public domain / CC0, set
`isPublicDomain` truthfully, and populate `rights`. Framio only exports open
works, and only shows the rest for discovery.

## The shape you map to

Everything normalises to the `Artwork` type in [`lib/types.ts`](../lib/types.ts):
`id` (`"source:sourceId"`), `title`, `artist`, `year`, `medium`, `museum`,
`imageUrl` (hi-res), `thumbUrl` (small), `objectUrl` (link back), optional
`width`/`height`/`aspect`, optional `color`, and — for accessibility —
`description` / `altText` / `descriptionSource` where the API offers them.

Helpers in `lib/sources.ts` do the tedious parts: `stripHtml()`, `clampText()`
(caps prose at a readable length and keeps the XMP export packet small),
`keyword()`, and `getJson()` (a fetch that returns `null` on any error instead
of throwing).

## A worked example: Cleveland (`mapCma`)

The Cleveland adapter is the clearest reference. Its normaliser:

```ts
export function mapCma(it: CmaItem): Artwork | null {
  const thumb = it.images?.web?.url;
  // `print` is a hi-res JPEG; `full` is a huge TIFF — never use it for export.
  const full = it.images?.print?.url || thumb;
  if (!thumb || !full) return null;               // no image → skip the record

  const cc0 = (it.share_license_status || '').toUpperCase() === 'CC0';
  const description = [stripHtml(it.description ?? ''), stripHtml(it.did_you_know ?? '')]
    .filter(Boolean)
    .join('\n\n');

  return {
    id: `cma:${it.id}`,
    source: 'cma',
    sourceId: String(it.id),
    title: it.title?.trim() || 'Untitled',
    artist: firstLine(it.creators?.[0]?.description).replace(/\s*\(.*\)\s*$/, '') || 'Unknown artist',
    year: it.creation_date?.trim() || '',
    medium: it.technique?.trim() || '',
    museum: 'Cleveland Museum of Art',
    rights: cc0 ? 'Public Domain · CC0' : it.share_license_status || undefined,
    isPublicDomain: cc0,
    imageUrl: full,
    thumbUrl: thumb,
    objectUrl: it.url || undefined,
    description: description ? clampText(description) : undefined,
    descriptionSource: description ? 'museum' : undefined,
  };
}
```

The paging function (`cmaPage`) builds the request URL, calls `getJson`, maps
each item, and returns a `SourcePage` — `{ artworks, next, hasMore }` — where
`next` is any opaque cursor you want handed back on the following call. The
by-id function (`getCma`) fetches one object and maps it. Then it's registered:

```ts
const cma: MuseumAdapter = {
  id: 'cma',
  label: 'Cleveland Museum of Art',
  short: 'Cleveland',
  imagesReliable: true,
  search: cmaPage,
  getById: getCma,
};

const ADAPTERS: MuseumAdapter[] = [met, aic, cma, smk, wiki];
```

That registration line is the only wiring needed — `SOURCES`, `ALL_SOURCES`,
`DEFAULT_SOURCES`, filter chips, and card badges all derive from `ADAPTERS`.

## `imagesReliable`

Some image hosts (notably AIC's, behind Cloudflare) answer hotlinked `<img>`
requests with a challenge page instead of the picture. Mark those
`imagesReliable: false` so they're kept out of the default grid (but stay
toggleable and usable for features only they power, like colour browse). A
visitor-configured `NEXT_PUBLIC_IMAGE_PROXY` flips them back on.

## Tests

Add a trimmed real API response under [`test/fixtures/`](../test/fixtures) and a
mapper test next to the others in
[`lib/sources.test.ts`](../lib/sources.test.ts). Assert the id, the PD flag and
rights string, the image URLs, and any description extraction — the same shape
the existing `mapAic` / `mapCma` / `mapSmk` / `mapWiki` tests follow. Run
`npm test`.

## Checklist

- [ ] Keyless (or key-gated behind `NEXT_PUBLIC_*`) and CORS-enabled
- [ ] Filters to public domain / CC0; `isPublicDomain` and `rights` are honest
- [ ] `imageUrl` is a hi-res JPEG, `thumbUrl` a small one (never a giant TIFF)
- [ ] `objectUrl` links back to the museum
- [ ] Description / alt text mapped where the API offers it
- [ ] Registered in `ADAPTERS`
- [ ] Fixture + mapper test added; `npm test`, `npm run typecheck`, `npm run lint` pass
