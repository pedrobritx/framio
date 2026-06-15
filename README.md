# Framio

**Your personal museum.** Framio turns a Samsung Frame TV into a living gallery — browse
public-domain masterpieces from the world's museums, curate rotating collections, and export
them perfectly formatted for your screen.

> **Status:** v0.1 — product definition + MVP scaffold. Personal-first, built to grow.

> **Live demo:** [pedrobritx.github.io/framio](https://pedrobritx.github.io/framio/) — a static
> showcase deployed from the default branch via GitHub Actions.

---

## Why

Frame TV owners hunt for high-quality public-domain art, download it by hand, crop it for a 16:9
screen, and lose quality along the way. Framio replaces that with a calm, gallery-like app that
**discovers, curates, and frames** art for you. It is not a wallpaper manager — it is a personal
curator that lives between the museum and your wall.

## What it does

- **Curation-first home** — like Samsung's Art Store, browsing leads: pick a **mood** (calm,
  dramatic, romantic…), a **colour**, or a curated **exhibition** (Distant Shores, After Dark,
  Floating World…). Search is one tap away, never the only way in.
- **Browse by colour** — choose a swatch and works are ranked by perceptual distance to it,
  powered by the **Art Institute of Chicago**'s published dominant-colour data — a keyless take
  on Google's Art Palette.
- **"Fits your Frame" filter** — every Frame is 16:9, so aspect ratio is a first-class facet:
  keep only works that crop cleanly to the wall, flagged with a `16:9` badge on each card.
- **Search** open-access collections from **The Met**, the **Art Institute of Chicago**, the
  **Cleveland Museum of Art**, **Statens Museum for Kunst (SMK)**, and **Wikimedia Commons** at
  once — keyless, CC0, live from the browser — by artist (one-tap Monet, Van Gogh, Vermeer…),
  movement, culture, period, medium, mood, colour, and topic.
- **Related works** — every artwork page surfaces more by the same hand, for serendipitous
  discovery.
- **Bring your own image** — drop a photo, it's sized for your Frame and crops in Frame Studio.
- **Light / dark** — a one-tap theme switch (sun/moon) in the top bar, remembered on your device.
- **Favorite** works and organize them into **Collections** (your own "exhibitions") — the queue
  you crop in Frame Studio and send to the TV. Selections persist locally on your device.
- **Mobile-first** layout: a left rail on desktop, a bottom tab bar on phones, proportions intact.
- **Import** your own images into your Library.
- **Frame Studio** composes any artwork onto a flawless **3840×2160 (16:9)** canvas — museum mat,
  smart crop, blur-extend, or floating canvas.
- **Export for Frame** → a TV-ready file you load onto your Frame via SmartThings or USB.

## The Frame, briefly

Every Samsung Frame TV is **16:9**, regardless of size — a 55" Frame is **4K (3840×2160)**. There
is **no public cloud API** for Art Mode, so the MVP produces perfect files you load manually.
Automated push to the TV (a small home-network **Frame Bridge**) is on the roadmap. Full details in
[`docs/FRAME-TV.md`](docs/FRAME-TV.md).

## Tech

Next.js + TypeScript + Tailwind · Supabase (Postgres + Storage) · Sharp/libvips · The Met Collection API

## Quickstart

```bash
npm install
cp .env.example .env.local      # Met API needs no key; Supabase is optional for persistence
npm run dev                     # http://localhost:3000
```

Browse works immediately against the live Met API. Collections, Favorites, and Uploads persist once
you connect a Supabase project (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).

## Deploy (GitHub Pages)

The app ships as a **static export** (`next build` with `output: 'export'`) hosted on GitHub Pages.

- **CI** (`.github/workflows/ci.yml`) typechecks, lints, and builds on every push and PR.
- **Deploy** (`.github/workflows/deploy.yml`) builds and publishes to Pages on every push to the
  default branch (and daily, so *Artwork of the Day* and the curated set stay fresh).

To enable it once: **Settings → Pages → Build and deployment → Source: GitHub Actions.** The base
path (`/framio`) is injected automatically from the Pages config via `PAGES_BASE_PATH`.

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
├─ app/                 # Next.js App Router (Browse, Artwork, Frame Studio, …)
├─ lib/                 # met client · gallery (curated set) · studio compositors · supabase
├─ styles/tokens.css    # Framio design tokens (palette + type)
├─ supabase/migrations/ # database schema
├─ .github/workflows/   # CI (typecheck/lint/build) · Pages deploy
├─ docs/                # product, branding, screens, architecture, frame-tv (+ diagrams)
└─ design/              # Figma references
```

## Documentation

| Doc | What's inside |
| --- | --- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Problem, vision, users, pillars, MVP scope, roadmap |
| [`docs/BRANDING.md`](docs/BRANDING.md) | Voice, palette (hex), typography, motion, logo |
| [`docs/SCREENS.md`](docs/SCREENS.md) | Every screen: contents, interactions, states |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data model, Met API, export pipeline |
| [`docs/FRAME-TV.md`](docs/FRAME-TV.md) | 16:9/4K facts, upload methods, copyright notes |

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
hand. So I built the tool I wished existed — and it grew from dressing one screen into a calm,
gallery-like hub for anyone to wander the world's open collections. Read the full
[manifesto in the app](https://pedrobritx.github.io/framio/about/).

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
