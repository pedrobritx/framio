# Framio — Product Definition

> **Your personal museum.** A digital art curator that turns a Samsung Frame TV into a living gallery.

**Version:** 0.1 · **Status:** Concept + MVP scaffold · **Stance:** Personal-first, built to grow.

---

## 1. Problem

Samsung Frame TV owners want to display fine art, but the path there is tedious and lossy:

- Finding high-quality, *legally usable* public-domain artwork is hard.
- Images must be downloaded by hand, one at a time.
- Artworks rarely fit a 16:9 screen and get awkwardly cropped.
- Quality degrades through manual resizing and re-compression.
- There's no good way to organize works into rotating, themed sets.

Existing tools focus on *file management*. None of them feel like **discovery and curation**.

## 2. Vision

> Transform digital displays into living museums.

Framio should feel like **Apple Music for art** — you browse artists, movements, and museums the way
you browse albums, build "exhibitions" the way you build playlists, and your TV changes through the
day, the seasons, and your mood. The app itself nearly disappears; **the artwork is the interface.**

## 3. Target users

**Primary**

- Samsung Frame TV owners
- Art, museum, and interior-design enthusiasts
- Home-automation tinkerers

**Secondary (later)**

- Designers, educators, galleries, hotels, offices, architecture firms

The MVP is built for **one person and one Frame** (Pedro's 55"), then generalizes.

## 4. Product pillars

| Pillar | Promise |
| --- | --- |
| **Discovery** | Browse the world's museum collections in one calm place. |
| **Curation** | Build personal collections and rotating exhibitions. |
| **Optimization** | Convert any artwork into a flawless Frame-ready file. |
| **Presentation** | Display art beautifully — and, later, push it to the TV automatically. |
| **Education** | Learn about artists, movements, and museums as you browse. |

## 5. Art sources

**MVP**

- **The Metropolitan Museum of Art — Open Access API.** ~406k CC0 images, **no API key**,
  ~80 req/s. JSON REST, high-resolution JPEGs. This is the entire MVP catalog.

**Phase 2+ (all open-access friendly)**

- Art Institute of Chicago (keyless), Cleveland Museum of Art (keyless), Rijksmuseum (free key),
  Smithsonian (key), Harvard Art Museums (key), Europeana (key).

**Brazilian strategy (Phase 3, licensing-dependent)**

- Institutions: Instituto Moreira Salles, Pinacoteca de São Paulo, MASP, MAM-SP, MNBA.
- Artists (mostly **in copyright** — discovery, not download): Tarsila do Amaral, Portinari,
  Almeida Júnior, Di Cavalcanti, Anita Malfatti, Victor Meirelles, Pedro Américo.
  See [rights notes](FRAME-TV.md#rights--licensing).

## 6. The differentiator: Frame Studio

When an artwork doesn't naturally fit 16:9, Frame Studio composes it onto a **3840×2160** canvas:

- **Museum Mat** — artwork preserved, centered on an elegant mat with a balanced border.
- **Floating Canvas** — artwork with generous, curated margins (a gallery hang).
- **Smart Crop** — composition-aware crop that fills the screen (entropy/attention based).
- **Blur Extend** — fills the 16:9 remainder with a soft, enlarged blur of the artwork itself.

Output is always **sRGB JPEG at 3840×2160** — the Frame's native spec. (Modern Frames also matte
natively; Framio bakes the mat into the file so the result is portable and predictable.)

## 7. MVP scope (v0.1)

**In**

- Met Open Access: browse, search, artwork detail
- Favorites
- Collections (with rotation settings stored for later auto-rotation)
- Personal uploads
- Frame Studio (mat / smart crop / blur-extend / floating) → **export 3840×2160 JPEG**
- **Manual delivery**: download the file, load via SmartThings or USB

**Out (deferred)**

- Frame Bridge auto-push (Phase 2) · additional museums (Phase 2) · semantic/AI search (Phase 2/3)
- AI Curator · seasonal auto-collections · multi-user / social · subscriptions

## 8. Roadmap

| Phase | Theme | Highlights |
| --- | --- | --- |
| **0** | Foundation | This repo: specs, diagrams, MVP scaffold, mockups |
| **1** | MVP | Met → curate → Frame Studio → export → onto the TV; one auto-rotating collection (manual load) |
| **2** | Reach + automation | More museums; **Frame Bridge** auto-push & rotation; Room Preview; semantic search |
| **3** | Intelligence + platform | AI Curator; seasonal/auto collections; native SwiftUI apps; multi-user |

## 9. Success signals

- Time from "I like this" → "it's framed on my wall" drops to **under a minute**.
- A single collection auto-rotates on the Frame without manual fiddling (Phase 2).
- Pedro stops downloading art by hand. Framio becomes the default way the TV gets its art.

## 10. Non-goals

- Not a generic wallpaper/screensaver manager.
- Not a marketplace or print shop (at least not in early phases).
- Not a social network. Curation is personal first.
