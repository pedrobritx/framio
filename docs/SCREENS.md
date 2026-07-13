# Framio — Screens & Interaction

> Five destinations, one principle: the artwork fills the frame; the chrome stays out of the way.

**Primary navigation:** Browse · Collections · Frame Studio · Library · Settings
On desktop/tablet this is a slim left rail (icon + small-caps label); on phone, a bottom bar. The rail
is near-black-on-paper, with the single **brass** accent marking the active destination.

---

## Global patterns

- **Image-first.** Every list is a grid of artworks with minimal overlay. Metadata appears on hover
  (desktop) or in a slide-up sheet (touch), never permanently on top of the art.
- **States.** Each screen defines *loading* (soft shimmer on stone, no spinners where avoidable),
  *empty* (a quiet line of editorial copy + one action), and *error* (calm, retry-able).
- **Motion.** Cross-fades and slow zooms; sheets slide up 300–400 ms ease-out.

---

## 1. Onboarding

**Purpose:** set taste and connect the Frame in under a minute.

**Flow:** Welcome → choose interests (movements/themes) → choose favorite artists → *(Phase 2: connect
Frame)* → create first collection → land on Browse.

- **Welcome** — full-bleed rotating masterpiece, wordmark, one line: *"Your personal museum."* Single
  button: **Begin**.
- **Interests / Artists** — large tappable tiles (Impressionism, Japanese Woodblock, Portraiture…),
  multi-select, no counts or gamification.
- **First collection** — name it (suggests "Living Room"); seeds with a few works matching interests.

**States:** skippable at every step; choices saved to preferences (local for MVP).

## 2. Browse

**Purpose:** discover art with zero friction.

**Contents:**

- **Artwork of the Day** — one hero piece, full-width, slow Ken-Burns zoom; tap → Artwork Detail.
- **Shelves** (horizontal rails): *Trending Artists*, *Movements*, *Museums*, *Curated Collections*,
  *Recommended for you*.
- **Infinite grid** below the shelves, drawn from the Met Open Access catalog (`hasImages=true`).

**Interactions:**

- Hover (desktop) reveals a one-line caption: *Artist — Title, Year*.
- Long-press (touch) opens a quick-actions sheet: Favorite · Add to Collection · Frame Studio.
- Pull/scroll loads the next page (Met `objectIDs` paged, details fetched for the visible slice).

**States:** loading = stone shimmer tiles; empty = never (catalog is large); error = "Couldn't reach
the museum. Retry."

## 3. Search

**Purpose:** find a specific artist/work now; discover by theme later.

- **MVP:** keyword search over the Met API (`/search?q=…&hasImages=true`) with filters — *has image*,
  *public domain*, *department/medium*. Results as a grid.
- **Phase 2+ (semantic):** "blue paintings", "rainy landscapes", "dark academia" via embeddings.

Search is a full-screen overlay invoked from any screen (⌘K / search icon). Recent and suggested
queries shown as small-caps chips.

## 4. Artwork Detail

**Purpose:** appreciate one work and act on it.

**Contents:**

- Full-bleed image on a paper/charcoal field, with breathing room (a gallery hang).
- **Slide-up metadata sheet:** Title (Cormorant), Artist · Year, Medium, Museum/Repository, a short
  description when available, and **Rights** (CC0 / Open Access badge).

**Actions** (in the sheet): **Favorite** · **Add to Collection** · **Open in Frame Studio** ·
**Export for Frame**.

**States:** loading = blurred low-res `primaryImageSmall` upgrading to `primaryImage`; error = retry.

## 5. Artist / Movement

**Purpose:** context and a path to more.

- Short editorial bio (1–2 paragraphs), key dates, and a works grid.
- Related artists and the museums that hold the work.
- (Bios are light/curated for MVP; richer timelines later.)

## 6. Collections

Your **exhibitions**.

- **List view:** cards showing cover artwork, name (Cormorant), and a small-caps count
  ("12 WORKS"). One card to **+ New collection**.
- **Detail view:** the works grid, a header with cover + name + description, and **Rotation settings**:
  interval, shuffle, and an optional schedule (e.g., 08:00–23:00). For MVP these settings are stored
  and used to order an exported set; **Phase 2** the Frame Bridge enacts them live on the TV.

**Interactions:** drag to reorder, swipe/long-press to remove, set any work as cover, **Export
collection** (batch files, one device preset applied to every work).

## 7. Frame Studio  ⭐ flagship

**Purpose:** turn any artwork into a flawless file for whatever screen it's headed to — the Frame
TV, a phone, a tablet, or a desktop.

**Layout:** a large **live preview** matching the chosen device's shape, a device picker, a mode
switcher, and fine controls.

**Modes:** **Museum Mat** · **Floating Canvas** · **Smart Crop** · **Blur Extend**
(see [`PRODUCT.md`](PRODUCT.md#6-the-differentiator-frame-studio) and
[`ARCHITECTURE.md`](ARCHITECTURE.md#frame-studio-pipeline)).

**Controls:** device preset (Frame TV / phone / tablet / desktop), mat color (ivory/charcoal/custom),
margin/zoom, crop position (for Smart Crop), and an output toggle (sRGB JPEG at the chosen device's
native resolution — 3840×2160 for the default 55" Frame).

**Actions:** **Export** (downloads the file, credit embedded) · **Add to Collection** (stores the
work + its studio settings). *Phase 2:* **Send to Frame** (push via Bridge, TV only).

**States:** preview re-renders debounced as controls change; export shows a calm progress line.

## 8. Library

**Purpose:** your own material in one place.

- Tabs: **Uploads** (drag-and-drop or pick; stored in Supabase Storage), **Favorites**, **Exports**
  (previously framed files).
- Uploads enter the same pipeline as museum works — you can open them in Frame Studio.

## 9. Settings

- **Frame** — your Frame TV size/spec (defaults to 55" / 3840×2160); *Phase 2:* pair the Frame
  Bridge (TV IP + token, connection status).
- **Appearance** — Light "Gallery Wall" / Dark "Exhibition Room" / Auto.
- **Output** — default Frame Studio mode and mat color, JPEG quality.
- **About** — sources, rights, version.

---

## Screen → data → action map (quick reference)

| Screen | Reads | Writes |
| --- | --- | --- |
| Browse / Search | Met API (`/search`, `/objects/{id}`), cache | — |
| Artwork Detail | Met object, cache | favorites, collection_items |
| Collections | collections, collection_items, artworks | collections, collection_items |
| Frame Studio | source image (Met/upload) | `/api/export` → file; collection_items.studio_settings |
| Library | artworks(source='upload'), favorites, exports bucket | uploads (Storage), favorites |
| Settings | preferences | preferences (+ Phase 2 bridge config) |
