# Exporting art for every screen

Framio frames one open-access artwork for whatever screen you want to live
with it on — a TV, a phone, a tablet, a desktop — and **embeds the artist,
museum, and license inside every file it makes**. Credit travels with the
image.

## Device presets

In **Frame Studio** (and in a collection's **Bundle export**) pick a device,
then a framing style:

| Preset | Output | Reference |
| --- | --- | --- |
| The Frame TV | your saved Frame size (4K, or FHD on the 32″) · 16:9 | Samsung The Frame |
| Phone wallpaper | 1320 × 2868 · portrait | iPhone Pro Max — downscales to any modern phone |
| Tablet · portrait | 2048 × 2732 | iPad Pro 12.9″ |
| Tablet · landscape | 2732 × 2048 | iPad Pro 12.9″, on its side |
| Desktop · 4K | 3840 × 2160 · 16:9 | any 16:9 monitor |

Anything smaller than a reference device downscales cleanly, so one export
covers a whole category.

## Showing the most interesting part

Every screen has a different shape, so a portrait phone can't show a wide
landscape whole without either bars or a crop. In **Smart Crop** mode, press
**Auto-crop to the focus**: Framio samples the image for visual energy —
edges, saturation, and faces — and centres the crop on the busiest, most
compositionally important region for that aspect ratio. It's a starting
point, not a verdict — **drag, pinch, or scroll to adjust**, and the preview
is exactly what exports.

Prefer the whole work uncropped? Use **Museum Mat**, **Floating Canvas**, or
**Blur Extend** — they letterbox the piece instead of cropping it.

## Credit inside the file

Every exported JPEG carries, in standard metadata that photo apps and
operating systems read:

- **EXIF** — image description (title · artist · year), artist, copyright /
  license line with the source link, and "Framio" as the software.
- **XMP** — Dublin Core title, creator, rights, and source; the artwork's
  **visual description** (the same open description used for accessibility);
  and a machine-readable CC0 statement
  (`https://creativecommons.org/publicdomain/zero/1.0/`) for open-access
  works.
- **A plain-text comment** so even a bare `strings` on the file shows the
  credit.

Your own uploaded images get only the title you gave them — Framio never
stamps a public-domain or CC0 claim on work that isn't open access, and only
open-access museum works are exportable in the first place.

You can confirm any export with, e.g., `exiftool framio-*.jpg`.

## Getting art onto each device

- **The Frame TV** — load the file via the SmartThings app or a USB stick.
  See [FRAME-TV.md](./FRAME-TV.md) for the step-by-step.
- **iPhone / iPad** — Save the file to Photos, then set it as your wallpaper
  (Settings → Wallpaper, or long-press the lock screen).
- **Desktop** — set it as your wallpaper the usual way for your OS.

> **A note on wallpapers and metadata.** The file you save to Photos keeps
> its embedded credit. But when iOS (and some desktops) *set* an image as
> wallpaper, they generate a cropped derivative that does not carry the
> original metadata. So keep the exported file itself if you want the credit
> to travel — the wallpaper is a copy, the file is the record.
