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

## What it does (MVP)

- **Browse** The Met's Open Access collection (~406,000 CC0 artworks) — no API key required.
- **Search** by word, school/movement (Impressionism, Pointillism, Baroque…), artist, culture,
  period/decade, museum, medium, and topic (nature, portrait, still life…).
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
| Browse / Artwork | Live Met API | Curated set pre-rendered at build time |
| Search (facets) | Live Met API (in-browser) | Live Met API (in-browser — keyless, CORS) |
| Favorites / Collections | Browser localStorage | Browser localStorage |
| Frame Studio export | Sharp on the server (`/api/export`) | Composited in-browser on a `<canvas>` |
| Deep links | Any Met object id | Only the pre-rendered curated works (others → 404) |

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

- **Phase 1 — MVP:** Met → curate → Frame Studio → export → onto the TV.
- **Phase 2:** more museums (Art Institute of Chicago, Cleveland, Rijksmuseum), **Frame Bridge**
  auto-push, Room Preview, semantic search.
- **Phase 3:** AI Curator, seasonal/auto collections, native SwiftUI apps, multi-user.

## Credits & rights

Artwork and metadata via **The Met Open Access** program (CC0). Framio displays only works it can
source under open licenses; in-copyright artists are surfaced for discovery, not download. See
[`docs/FRAME-TV.md`](docs/FRAME-TV.md#rights--licensing).
