# Framio

**Your personal museum.** Framio turns a Samsung Frame TV into a living gallery — browse
public-domain masterpieces from the world's museums, curate rotating collections, and export
them perfectly formatted for your screen.

> **Status:** v0.1 — product definition + MVP scaffold. Personal-first, built to grow.

---

## Why

Frame TV owners hunt for high-quality public-domain art, download it by hand, crop it for a 16:9
screen, and lose quality along the way. Framio replaces that with a calm, gallery-like app that
**discovers, curates, and frames** art for you. It is not a wallpaper manager — it is a personal
curator that lives between the museum and your wall.

## What it does (MVP)

- **Browse** The Met's Open Access collection (~406,000 CC0 artworks) — no API key required.
- **Favorite** works and organize them into **Collections** (your own "exhibitions").
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

## Project structure

```
framio/
├─ app/                 # Next.js App Router (Browse, Artwork, Frame Studio, …)
│  └─ api/              # met (proxy/cache) · export (Sharp → 3840×2160 JPEG)
├─ lib/                 # met client · supabase · studio (mat/crop/blur compositors)
├─ styles/tokens.css    # Framio design tokens (palette + type)
├─ supabase/migrations/ # database schema
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
