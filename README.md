# Framio

**Your personal museum.** Framio is an open, living gallery of the world's **open-access** art —
browse public-domain and CC0 works from real museums, watch them play as an ambient exhibition on
any screen, and export any piece as a wallpaper for your **TV, phone, tablet, or desktop** with the
artist's credit embedded in the file.

> *Art belongs on the walls of the living.* — [the manifesto](MANIFESTO.md)

> **Status:** v0.2 — a living-museum overhaul: multi-device exports, open art descriptions, ambient
> Watch mode, and an accessibility-first rebuild.

> **Live demo:** [framio.britx.me](https://framio.britx.me) — a static showcase deployed via
> GitHub Actions.

---

## Principles

- **Open access only.** Framio works exclusively with genuinely open art — public domain or CC0,
  from museums' own open-access programs. In-copyright works are surfaced for discovery, never
  download.
- **Credit travels with the art.** Every export embeds the artist, title, museum, and license in
  the file itself. We never take credit for others' work.
- **Access is the point.** Open, community-written descriptions let art be met without being seen,
  and every screen — remote, touch, or keyboard — is a first-class way in.

## Why

People who want fine art on their screens hunt for high-quality public-domain images, download them
by hand, crop them, and lose quality along the way — and there was nowhere calm to just *live* with
open-access art across all their screens. Framio replaces that with a gallery-like app that
**discovers, curates, frames, and credits** art for you. It is not a wallpaper manager — it is a
quiet way to keep art close.

## What it does

- **Curation-first home** — like Samsung's Art Store, browsing leads: pick a **mood** (calm,
  dramatic, romantic…), a **colour**, or a curated **exhibition** (Distant Shores, After Dark,
  Floating World…). Search is one tap away, never the only way in.
- **Browse by colour** — choose a swatch and works are ranked by perceptual distance to it,
  powered by the **Art Institute of Chicago**'s published dominant-colour data — a keyless take
  on Google's Art Palette.
- **"Fits your Frame" filter** — aspect ratio is a first-class facet: keep only works that crop
  cleanly to 16:9 (the Frame TV's native shape), flagged with a `16:9` badge on each card. Frame
  Studio's device presets extend the same idea to phone, tablet, and desktop shapes.
- **Search** open-access collections from **The Met**, the **Art Institute of Chicago**, the
  **Cleveland Museum of Art**, **Statens Museum for Kunst (SMK)**, and **Wikimedia Commons** at
  once — keyless, CC0, live from the browser — by artist (one-tap Monet, Van Gogh, Vermeer…),
  movement, culture, period, medium, mood, colour, and topic.
- **Related works** — every artwork page surfaces more by the same hand, for serendipitous
  discovery.
- **Open art descriptions** — visual descriptions of works, from museums where they publish them
  and from an open [community CC0 dataset](data/descriptions.json) anyone can add to. They become
  the image's alt text, appear on the artwork page and in Watch mode, and are embedded in exports.
- **Watch mode** — a full-screen ambient exhibition of any collection, your favorites, or the day's
  mood: art shown whole, credits always visible, driven by a TV remote, touch, or keyboard.
- **Multi-device export** — Frame Studio frames any work for **The Frame TV, a phone, a tablet, or
  a desktop**, auto-cropping to the piece's most interesting region for each shape, with **artist,
  museum, and license embedded (EXIF + XMP)** in every file. See [`docs/EXPORTS.md`](docs/EXPORTS.md).
- **Every device, its own way in** — a left rail and keyboard shortcuts on desktop, a bottom tab bar
  and touch on phone/tablet, D-pad spatial navigation for TV remotes.
- **Bring your own image** — drop a photo and crop it for any screen (never stamped with a rights
  claim it doesn't have).
- **Light / dark** — a one-tap theme switch, remembered on your device.
- **Favorite** works and organize them into **Collections** (your own "exhibitions") to watch or
  bundle-export. Selections persist locally on your device.
- **Installable** — a PWA manifest and icons make Framio add-to-home-screen ready.

## The Frame, briefly

Every Samsung Frame TV is **16:9**, regardless of size — a 55" Frame is **4K (3840×2160)**. There
is **no public cloud API** for Art Mode, so the MVP produces perfect files you load manually.
Automated push to the TV (a small home-network **Frame Bridge**) is on the roadmap. Full details in
[`docs/FRAME-TV.md`](docs/FRAME-TV.md).

## Tech

Next.js + React + TypeScript + Tailwind · keyless in-browser museum APIs · Vitest · Sharp/libvips
(icons + reference export pipeline) · Supabase (optional persistence)

## Quickstart

```bash
npm install
cp .env.example .env.local      # museum APIs need no keys; Supabase is optional for persistence
npm run dev                     # http://localhost:3000

npm test                        # unit tests (Vitest)
npm run typecheck && npm run lint
```

Browse works immediately against the live keyless museum APIs. Favorites, Collections, and Uploads
persist in your browser's localStorage; a Supabase project can later mirror them across devices
(see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).

## Deploy (GitHub Pages)

The app ships as a **static export** (`next build` with `output: 'export'`) hosted on GitHub Pages.

- **CI** (`.github/workflows/ci.yml`) typechecks, lints, tests, and builds on every push and PR.
- **Deploy** (`.github/workflows/deploy.yml`) builds and publishes to Pages on push to the deploy
  branch (and daily, so *Artwork of the Day* and the curated set stay fresh).
- **CodeQL** (`.github/workflows/codeql.yml`) scans for vulnerabilities; Dependabot keeps
  dependencies and actions current.

To enable it once: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then set
**Custom domain** to `framio.britx.me`. The base path is derived automatically from that
configuration via `PAGES_BASE_PATH` (see below) — no manual step needed.

### Deployment model: dedicated subdomain, not a path

Framio is deployed at the **domain root** of its own subdomain, `framio.britx.me` — not under a
path on a shared account site (the old `britx.me/framio/` project-page layout). This matters
because a project page and a subdomain resolve assets, routes, and manifest URLs differently:

- **Base path.** [`next.config.mjs`](next.config.mjs) sets `basePath`/`assetPrefix` from
  `PAGES_BASE_PATH`, which is empty by default — correct for a subdomain served at `/`.
  `.github/workflows/deploy.yml` sets it dynamically from
  `actions/configure-pages`' `base_path` output, which itself resolves to `''` once a custom
  domain is configured, so no manual value is needed. It would only need to be non-empty again if
  this app were ever redeployed under a path (e.g. a fork left on `<user>.github.io/<repo>/`) — see
  [`lib/basePath.ts`](lib/basePath.ts).
- **Absolute URLs.** [`app/layout.tsx`](app/layout.tsx)'s `metadataBase` (used to resolve Open
  Graph/canonical URLs) comes from `NEXT_PUBLIC_SITE_URL`, which defaults to
  `https://framio.britx.me` and is set explicitly in the deploy workflow from
  `actions/configure-pages`' `base_url` output, so it always matches whatever domain Pages
  actually serves.
- **PWA manifest & icons.** [`app/manifest.ts`](app/manifest.ts) and the `icons` block in
  `app/layout.tsx` prefix their `src`/`href` values with the same base path by hand, since Next
  does not rewrite arbitrary strings authored inside metadata/manifest output the way it rewrites
  `<Link>`/`<Image>`.

#### DNS (subdomain)

In your DNS provider (e.g. Namecheap **Domain List → britx.me → Manage → Advanced DNS**), point the
subdomain at GitHub Pages with a `CNAME` record — not the apex `A` records a root-domain setup
would use:

| Type | Host | Value | TTL | Why |
| --- | --- | --- | --- | --- |
| `CNAME` | `framio` | `pedrobritx.github.io` | Automatic | Routes `framio.britx.me` to GitHub Pages |

Then, in this repo's **Settings → Pages → Custom domain**, enter `framio.britx.me` and click
**Save** — GitHub verifies ownership and issues the TLS certificate automatically for a `CNAME`-based
custom domain (no separate `TXT` ownership challenge, which only applies to apex/organization
domains). Enable **Enforce HTTPS** once the certificate shows as issued; this can take up to a
few hours after DNS propagates.

`https://framio-lemon.vercel.app` can remain a separate preview/alternate deployment — it's
unaffected by the `britx.me` DNS above, since it's served from its own `vercel.app` domain.

Because GitHub Pages is static (no Node server), the deployed build differs from `npm run dev`:

| Feature | Local dev | Static site |
| --- | --- | --- |
| Home (mood / colour / exhibitions) | Curated vocabulary + live covers | Curated vocabulary, pre-rendered |
| Search & facets (mood, colour, Frame-fit) | Live museum APIs (in-browser) | Live museum APIs (in-browser — keyless, CORS) |
| Browse by colour | AIC dominant-colour ranking (in-browser) | AIC dominant-colour ranking (in-browser) |
| Related works | Live museum APIs (in-browser) | Live museum APIs (in-browser) |
| Favorites / Collections | Browser localStorage | Browser localStorage |
| Frame Studio export | Sharp on the server (`/api/export`) | Composited in-browser on a `<canvas>` |
| Deep links | Any museum object id | Resolved live client-side from `?id=` |

The full Met catalogue and server-side Sharp pipeline remain the target for the self-hosted /
Frame Bridge deployment (Phase 2).

## Project structure

```
framio/
├─ app/                 # Next.js App Router (Discover, Artwork, Studio, Watch, …)
├─ components/          # UI (cards, Watch, CropStage, nav, a11y helpers)
├─ lib/                 # museum adapters · curation · devices · studio (crop, saliency, metadata)
│  └─ studio/           # geometry · saliency crop · metadata embedding · canvas compositor
├─ data/descriptions.json  # open, CC0 community art descriptions
├─ test/fixtures/       # recorded museum API responses for unit tests
├─ scripts/icons.mjs    # renders app icons from SVG at build
├─ styles/tokens.css    # Framio design tokens (palette + type)
├─ supabase/migrations/ # optional database schema
├─ .github/             # CI · Pages deploy · CodeQL · dependabot · issue/PR templates
├─ docs/                # product, exports, descriptions, open-access, adapters, architecture…
└─ design/              # Figma references
```

## Documentation

| Doc | What's inside |
| --- | --- |
| [`MANIFESTO.md`](MANIFESTO.md) | Why Framio exists: credit, open access, accessibility |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Problem, vision, users, pillars, MVP scope, roadmap |
| [`docs/EXPORTS.md`](docs/EXPORTS.md) | Per-device export presets, embedded credit, how-to |
| [`docs/DESCRIPTIONS.md`](docs/DESCRIPTIONS.md) | Contributing open, CC0 art descriptions |
| [`docs/OPEN-ACCESS.md`](docs/OPEN-ACCESS.md) | For museums: how to open a collection to Framio |
| [`docs/ADAPTERS.md`](docs/ADAPTERS.md) | For developers: writing a museum adapter |
| [`docs/BRANDING.md`](docs/BRANDING.md) | Voice, palette (hex), typography, motion, logo |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data model, museum APIs, export pipeline |
| [`docs/FRAME-TV.md`](docs/FRAME-TV.md) | 16:9/4K facts, upload methods, copyright notes |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Dev setup, tests, how to contribute |

## Roadmap (short)

- **Phase 1 — MVP (done):** keyless multi-museum discovery — curation-first home (mood, colour,
  exhibitions), faceted search, Frame-fit filtering, related works, Frame Studio export.
- **Phase 2 — search engine backend:** ingest a normalised, pre-embedded copy of each museum into
  **Supabase Postgres** (`tsvector` + `pg_trgm` full-text, `pgvector` for OpenAI text + CLIP image
  embeddings, hybrid Reciprocal Rank Fusion, `cube` colour-distance), so semantic ("calm misty
  seascape") and visual ("looks like this") search join the colour/mood browsing this build ships.
  Plus more museums (Rijksmuseum, Harvard), **Frame Bridge** auto-push, and Room Preview.
- **Phase 3:** AI Curator, seasonal/auto collections, native SwiftUI apps, multi-user.

## Why it exists

Framio began with a simple want: beautiful art on my own TV. The Samsung Frame turns a screen into
a canvas, but filling it meant hunting for high-resolution public-domain images and cropping them by
hand. So I built the tool I wished existed — and it grew from dressing one screen into a living,
interactive way to make open-access art part of a day, on every screen. Read the full
[**manifesto**](MANIFESTO.md).

## Feedback & contributing

Tell me what you think — the good and the graceless — at **pedrobritx@gmail.com**. Contributions
are welcome: write an [art description](docs/DESCRIPTIONS.md), help a
[museum open its collection](docs/OPEN-ACCESS.md), add an [adapter](docs/ADAPTERS.md), or fix a bug.
See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Credits & rights

Artwork and metadata via the open-access programs of **The Met**, the **Art Institute of Chicago**,
the **Cleveland Museum of Art**, **Statens Museum for Kunst (SMK)**, and **Wikimedia Commons** —
public domain / CC0. Framio displays only works it can source under open licenses; in-copyright
artists are surfaced for discovery, not download. See
[`docs/FRAME-TV.md`](docs/FRAME-TV.md#rights--licensing).

> **A note on images:** a few museum image hosts (notably the Art Institute of Chicago) now sit
> behind bot protection that blocks hotlinked images. By default Framio leans on the image-reliable
> sources so the grid always fills; set `NEXT_PUBLIC_IMAGE_PROXY` to a proxy you control (e.g. a free
> Cloudflare Worker) to bring those images back everywhere. See [`.env.example`](.env.example).

## License & author

Open source under the [MIT License](LICENSE) — use it, fork it, build on it. The only rule is to keep
the credit. Built by **Pedro Brito**.

- **Source:** [github.com/pedrobritx/framio](https://github.com/pedrobritx/framio)
- **LinkedIn:** [in/pedrobritx](https://www.linkedin.com/in/pedrobritx/)
- **Site:** [pedrobritx.github.io/EwP](https://pedrobritx.github.io/EwP/)
- **Support:** [buymeacoffee.com/pedrobritx](https://buymeacoffee.com/pedrobritx)
