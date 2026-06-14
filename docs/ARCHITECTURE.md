# Framio — Architecture

> Personal-first MVP, designed so the platform vision is an extension, not a rewrite.

---

## 1. Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Frontend | **Next.js (App Router) + TypeScript + Tailwind** | One framework for UI + API routes; PWA-ready; deploys to Vercel |
| Persistence | **Supabase** (Postgres + Storage) | Database, file storage, and (later) auth in one service — replaces Postgres + R2 + custom auth |
| Image processing | **Sharp / libvips** | Fast, high-quality resize/compose; the Frame Studio engine |
| Art source | **The Met Collection API** | Keyless, CC0, high-res — the whole MVP catalog |
| Hosting | **Vercel** | First-class Next.js; the export route runs on the Node runtime (Sharp needs native libs) |

**Deliberately deferred:** OpenSearch, CLIP embeddings, a separate FastAPI service, and Cloudflare R2
from the ChatGPT draft. Postgres full-text search and on-demand Met fetches cover the MVP; the heavy
pieces arrive in Phase 2/3 when there's data and users to justify them.

## 2. Repo structure

```
framio/
├─ app/
│  ├─ layout.tsx            # shell: theme tokens, nav rail, fonts
│  ├─ page.tsx              # Browse (live Met)
│  ├─ artwork/[id]/page.tsx # Artwork Detail
│  ├─ studio/page.tsx       # Frame Studio
│  ├─ collections/page.tsx  # Collections (stub)
│  ├─ library/page.tsx      # Library (stub)
│  ├─ settings/page.tsx     # Settings (stub)
│  └─ api/
│     ├─ met/route.ts       # proxy + cache Met search/object
│     └─ export/route.ts    # Sharp → 3840×2160 JPEG (runtime = 'nodejs')
├─ lib/
│  ├─ met.ts                # Met client + mapping to Artwork
│  ├─ supabase.ts           # browser + server clients
│  ├─ frame.ts              # TARGET spec + shared constants
│  └─ studio/               # mat · smartCrop · blurExtend · floating compositors
├─ components/              # ArtworkGrid, ArtworkCard, NavRail, MetaSheet, …
├─ styles/tokens.css        # design tokens (palette + type)
├─ supabase/migrations/0001_init.sql
├─ docs/ · design/
└─ tailwind.config.ts · next.config.mjs · .env.example
```

## 3. Data model

Binaries live in **Supabase Storage** (buckets `uploads`, `exports`). Tables:

```sql
artworks          -- canonical record for Met works AND user uploads
  id uuid pk · source text('met'|'upload') · source_id text
  title · artist · year · medium · museum · department · rights
  is_public_domain bool · image_url · thumb_url · object_url
  width int · height int · created_at
  unique(source, source_id)

collections
  id uuid pk · name · description · cover_artwork_id → artworks
  rotation_interval_minutes int · shuffle bool · schedule jsonb · created_at

collection_items
  id uuid pk · collection_id → collections · artwork_id → artworks
  position int · studio_settings jsonb · exported_path text · created_at
  unique(collection_id, artwork_id)

favorites
  id uuid pk · artwork_id → artworks · created_at · unique(artwork_id)
```

- **Uploads** are `artworks` rows with `source='upload'`, `image_url` pointing at the `uploads`
  Storage bucket — no separate table needed.
- `studio_settings` (jsonb) records the Frame Studio choices (mode, mat color, margin, crop) so a
  framed look is reproducible and re-exportable.
- MVP is single-user, so no `user_id` columns yet; they slot in cleanly for multi-user (Phase 3) via
  Supabase Auth + row-level security.

## 4. The Met integration (`lib/met.ts`)

- **Base:** `https://collectionapi.metmuseum.org/public/collection/v1`
- **Endpoints:** `/search?q=&hasImages=true` → `{ total, objectIDs[] }`; `/objects/{id}` → full
  object; `/objects`, `/departments` for browsing.
- **Mapping:** `primaryImage`→`image_url`, `primaryImageSmall`→`thumb_url`, `artistDisplayName`,
  `objectDate`→`year`, `medium`, `repository`→`museum`, `isPublicDomain`, `objectURL`.
- **Pattern:** `/search` returns IDs only, so Browse fetches a page of IDs, then fetches details for
  just the visible slice (~24) with a small concurrency cap. Results upsert into `artworks` as a
  cache, keeping us well under the 80 req/s guidance and making repeat views instant.
- **No key required.** `MET_API_BASE` is overridable via env for testing.

## 5. Frame Studio pipeline (`lib/studio/*`, `app/api/export/route.ts`)

Target canvas: **3840 × 2160, sRGB** (the 55" Frame's native spec — see
[`FRAME-TV.md`](FRAME-TV.md)).

```
POST /api/export  { src, mode, matColor?, margin?, position? }
  → fetch source bytes (Met URL or Storage)
  → compose via Sharp by mode:
      museumMat / floating : resize(contain) onto flat mat, centered, with margin
      smartCrop            : resize(cover, position:'attention')   // libvips entropy crop
      blurExtend           : blurred enlarged cover + sharp contain composited on top
  → .flatten({ background }).toColourspace('srgb')
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  → stream image/jpeg as a download (and optionally save to the `exports` bucket)
```

The export route pins `export const runtime = 'nodejs'` because Sharp ships native binaries that the
Edge runtime can't load.

## 6. "Export for Frame" — sequence (MVP)

```
User (Frame Studio) → /api/export (Next.js, Node runtime) → Sharp compose 3840×2160
   → JPEG returned as download  → user loads it on the Frame via SmartThings or USB
```

No Samsung API is touched in the MVP. The file is the deliverable; the human is the transport.

## 7. Phase 2 — Frame Bridge (designed, not built)

To push art automatically, a small **Python service** using
[`samsungtvws`](https://github.com/xchwarze/samsung-tv-ws-api) runs on the **same LAN** as the TV
(an always-on Mac, a Raspberry Pi, or Docker on a NAS). It:

1. Pairs with the Frame (TV IP + access token).
2. Reads the active collection's exported files + rotation schedule from Supabase.
3. Uploads images to Art Mode, sets the matte, and rotates on schedule.

```
Framio (cloud)  ──active collection + schedule──►  Frame Bridge (home LAN, Python/samsungtvws)
                                                         │ WebSocket upload
                                                         ▼
                                                  Samsung Frame TV — Art Mode
```

This is why a browser-only design can't auto-push: Art Mode upload is a **local-network** operation,
not a public cloud API. See [`FRAME-TV.md`](FRAME-TV.md#getting-art-onto-the-frame).

## 8. Configuration (`.env.example`)

```
# Met API (no key required; override only for testing)
MET_API_BASE=https://collectionapi.metmuseum.org/public/collection/v1

# Supabase (optional for MVP Browse; required for Collections/Favorites/Uploads)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only: cache upserts + Storage writes
```

Browse renders against the live Met API with **no** configuration. Supabase only becomes necessary
when you save a favorite, build a collection, or upload your own image.

## 9. Deployment

- **Frontend + API:** Vercel. Ensure the export function uses the Node runtime and a memory/time
  budget sufficient for 4K Sharp work.
- **Database/Storage:** a Supabase project (provision via the Supabase MCP or the dashboard; not
  auto-created by this scaffold). Run `supabase/migrations/0001_init.sql`.
- **Frame Bridge (Phase 2):** Docker image on the home network; configured with the TV's IP.
