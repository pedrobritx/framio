# Framio — Brand & Visual Identity

> The art is the interface. The application nearly disappears.

---

## 1. Name & tagline

- **Name:** **Framio** — *frame* + the soft, product-friendly *-io*. Short, ownable, easy to say in
  English and Portuguese.
- **Primary tagline:** **"Your personal museum."**
- **Alternates:** "Curated art for your Frame." · "A living gallery at home."

## 2. Positioning

Framio is **Apple Music for art** — calm, editorial, and curatorial. It borrows the quiet of a
gallery and the warmth of archival paper, never the clutter of a stock-photo site or the kitsch of a
skeuomorphic wood frame.

**Feels like:** elegant · quiet · refined · curated · human.
**Never:** flashy · gamified · busy · decorative for its own sake.

## 3. Color

Two themes, drawn from real gallery surfaces. Use large fields of neutral; let the artwork supply the
color. The accent is for *active state only* — never decoration.

### Light — "Gallery Wall"

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#FBFAF7` | App background (warm white) |
| `--ivory` | `#F7F4EF` | Cards, raised surfaces |
| `--stone` | `#E7E2D9` | Hairlines, dividers, mats |
| `--sand` | `#D9D0C2` | Muted fills, hover |
| `--ink` | `#1C1B19` | Primary text |
| `--ink-soft` | `#6B675F` | Secondary text, captions |

### Dark — "Exhibition Room"

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#1A1A1C` | App background (charcoal) |
| `--ivory` | `#222024` | Cards, raised surfaces |
| `--stone` | `#2E2A26` | Hairlines, dividers |
| `--sand` | `#241F1B` | Deep-brown muted fills |
| `--midnight` | `#13161D` | Optional deep backdrop |
| `--ink` | `#EDEAE3` | Primary text (off-white) |
| `--ink-soft` | `#A39E95` | Secondary text |

### Accent (both themes)

| Token | Hex | Use |
| --- | --- | --- |
| `--brass` | `#9A7B4F` | Active nav, selected state, focus ring |
| `--brass-soft` | `#C2A878` | Hover on accent |

> **Rule:** at most one brass element visible per view. If two things compete for the accent, one of
> them isn't important.

## 4. Typography

| Role | Typeface | Notes |
| --- | --- | --- |
| **UI / body** | **Inter** | Free, excellent screen rendering; stands in for SF Pro with no licensing risk |
| **Editorial / titles** | **Cormorant Garamond** | Artwork titles, section headers, the wordmark |
| **Labels / metadata** | Inter, **small-caps**, tracked +0.08em | "MEDIUM", "MUSEUM", "1887" |

### Type scale (desktop)

| Token | Size / line | Use |
| --- | --- | --- |
| `display` | 48 / 56, Cormorant | Hero artwork title |
| `title` | 28 / 36, Cormorant | Section headers |
| `body` | 16 / 26, Inter | Descriptions |
| `label` | 12 / 16, Inter small-caps | Metadata, captions |

Generous leading, wide margins, lots of negative space. Text never crowds an image.

## 5. Motion

Museum pacing. Animations are deliberate and slow.

- **Allowed:** gentle fade, slow zoom (Ken Burns), soft parallax, fluid cross-fades.
- **Timing:** 300–600 ms, ease-in-out. Page/image transitions toward the longer end.
- **Forbidden:** bounce, spring overshoot, confetti, anything that calls attention to the UI.

## 6. Logo

- **Wordmark:** "Framio" set in Cormorant Garamond, regular weight, normal tracking.
- **Glyph:** a thin rectangle (the frame) with a single inner hairline (the mat) and an implied
  aperture — reads as both *frame* and *lens*. Stroke ~1.5px at 24px, never filled.
- **Lockups:** glyph + wordmark (horizontal); glyph alone for app icon / favicon.
- **Clearspace:** the height of the glyph on all sides. Never place on a busy image without a scrim.

## 7. Voice & tone

- Speak like a knowledgeable, unpretentious curator. Short, warm, specific.
- Prefer the artwork's own words (title, year, medium) over marketing copy.
- Microcopy examples: "Added to *Living Room*." · "Framed for your screen." · "Nothing here yet —
  start with *Artwork of the Day*."

## 8. Do / Don't

| Do | Don't |
| --- | --- |
| Full-bleed art, quiet chrome | Wood-grain frames, drop shadows on everything |
| One accent, lots of neutral | Rainbow tags, gradients |
| Editorial serif for titles | Decorative display fonts |
| Slow, intentional motion | Bounce, parallax-on-scroll overload |
| Whitespace as a material | Pinterest-style dense masonry with no breathing room |

## 9. Tokens in code

These tokens live in [`styles/tokens.css`](../styles/tokens.css) as CSS variables and are mapped into
Tailwind via `tailwind.config.ts`, so `bg-paper`, `text-ink`, `border-stone`, `text-brass`, and the
`font-editorial` / `font-ui` families are available throughout the app.
