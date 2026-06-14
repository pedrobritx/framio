# The Samsung Frame TV — what Framio must respect

A practical reference for the constraints that shape Framio. The short version: **all Frames are
16:9**, the **55" is 4K**, and **there is no public cloud API** for Art Mode — so the MVP exports
perfect files you load by hand.

---

## Display spec

Every Samsung Frame TV is **16:9**. The size in inches changes the panel, **not the proportion**, so
one output spec covers most of the range:

| Model size | Resolution | Aspect | Notes |
| --- | --- | --- | --- |
| 32" | 1920 × 1080 (FHD) | 16:9 | The only non-4K Frame |
| 43"–85" (incl. **55"**) | **3840 × 2160 (4K)** | 16:9 | Pedro's TV |

**Framio output target:** `3840 × 2160`, **sRGB**, **JPEG** (quality ~92, 4:4:4 chroma). This is
[`lib/frame.ts → TARGET`](../lib/frame.ts) and is the canvas every Frame Studio mode composes onto.

> Because the proportion is constant, Framio needs **no per-size logic** for the MVP. A future
> Settings option can switch the target to 1920×1080 for a 32" Frame.

## Getting art onto the Frame

There is **no official public cloud API** to push art into Art Mode. The real options:

| Method | How | Automatable? |
| --- | --- | --- |
| **SmartThings app** | Art Mode → *Add Your Photos* → upload from phone | Manual |
| **USB** | Copy JPEGs to a USB stick → plug into the TV → import in Art Mode | Manual |
| **Local WebSocket** | The reverse-engineered [`samsungtvws`](https://github.com/xchwarze/samsung-tv-ws-api) library uploads to Art Mode over the **home network** | Yes — but only from the **same LAN** |

**MVP decision:** Framio produces the perfect file; you load it via **SmartThings or USB**. This
removes all dependence on undocumented, model-specific behavior and works on day one.

**Phase 2 — Frame Bridge:** a small Python service running `samsungtvws` on the home network
auto-uploads the active collection and rotates it on a schedule. It must run on the LAN (it speaks the
TV's local WebSocket on ports 8001/8002), which is precisely why a browser-only app can't do it. See
[`ARCHITECTURE.md`](ARCHITECTURE.md#7-phase-2--frame-bridge-designed-not-built).

### Manual load — quick steps (SmartThings)

1. Open Framio → Frame Studio → **Export for Frame** (downloads a 3840×2160 JPEG to your phone).
2. Open **SmartThings** → your Frame → **Art Mode** → **Add Your Photos**.
3. Pick the exported file. It fills the screen 16:9 with no crop, because Framio already framed it.

## Mattes

Modern Frames matte natively in Art Mode, and `samsungtvws` can set the matte too. Framio instead
**bakes the mat into the exported image** (Museum Mat / Floating Canvas modes). That keeps the result
portable and predictable across load methods and TV models — what you preview is exactly what hangs.

## Image quality tips

- Start from the **highest-resolution source** (`primaryImage`, not `primaryImageSmall`).
- Compose **once** to 4K and export **once** — avoid repeated JPEG re-compression.
- Keep everything **sRGB**; the Frame is an sRGB display, and wide-gamut files can look off.
- For very small source images, prefer **Museum Mat / Floating Canvas** (which don't upscale the art
  to fill) over Smart Crop (which does).

## Rights & licensing

- **The Met Open Access** provides **CC0** images and metadata — free to use, modify, and display,
  no permission needed. This is the MVP catalog.
- **Public domain ≠ everything.** Many 20th-century artists (e.g., Brazilian modernists Tarsila do
  Amaral, Candido Portinari, Di Cavalcanti) are **still in copyright**. Their works generally are
  **not** in open-access feeds and should **not** be redistributed or exported. Framio surfaces such
  artists for **discovery and learning**, not download.
- When adding sources in Phase 2+, gate "Export / Send to Frame" on an open-access/public-domain flag
  per artwork; show the rights status plainly on every Artwork Detail screen.

## References

- The Met Collection API — <https://metmuseum.github.io/> (keyless; ~80 req/s; CC0)
- `samsung-tv-ws-api` — <https://github.com/xchwarze/samsung-tv-ws-api>
- Samsung — *How to get artwork for The Frame* — <https://www.samsung.com/us/support/answer/ANS00092545/>
