# Changelog

All notable changes to Framio are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-07-13

A "living museum" overhaul: art that reaches every screen, credits its makers,
and can be experienced by everyone.

### Added

- **Multi-device export.** Frame Studio and Bundle export now frame any work for
  The Frame TV, a phone (iPhone Pro Max reference), a tablet (iPad Pro, portrait
  or landscape), or a desktop — each at the right resolution and aspect.
- **Saliency auto-crop.** An in-browser attention model (Sobel edges +
  saturation + skin tone) centres the crop on the artwork's most interesting
  region for each shape; still fully adjustable by hand.
- **Embedded credit metadata.** Every exported JPEG carries the artist, title,
  museum, license, source link, and visual description as EXIF + XMP + a
  plain-text comment. Uploads are never stamped with a rights claim.
- **Open art descriptions.** Museum-published descriptions (AIC, Cleveland, SMK,
  Commons) plus an open CC0 community dataset (`data/descriptions.json`), used as
  alt text, on the artwork page, in Watch mode, and inside exports.
- **Watch mode.** A full-screen ambient exhibition of a collection, favorites,
  or the day's mood — art shown whole, credits always visible, driven by TV
  remote, touch, or keyboard.
- **Multi-device navigation.** D-pad spatial navigation for TV remotes, pinch/
  scroll zoom in the crop stage, and desktop keyboard shortcuts (`/`, `w`, `t`,
  `?`).
- **Accessibility.** A WCAG contrast pass (new `--brass-text` token), focus
  traps and live-region announcements, curated alt text app-wide, and `jsx-a11y`
  linting plus axe smoke tests.
- **Installability.** A PWA manifest and app icons.
- **Tests.** A Vitest suite (adapters, crop geometry, metadata, saliency, store,
  descriptions) wired into CI.
- **Docs & community.** `MANIFESTO.md`, per-device `docs/EXPORTS.md`, contributor
  `docs/DESCRIPTIONS.md`, museum-facing `docs/OPEN-ACCESS.md` (with the
  `framio.collection.json` spec) and `docs/ADAPTERS.md`; `CONTRIBUTING`,
  `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`, issue/PR templates, CodeQL, and
  Dependabot.

### Changed

- Positioning is now explicitly **open-access only**; the manifesto and README
  lead with credit, open access, and accessibility.
- Studio and collection links carry the artwork id so exports can embed credit.

### Fixed

- The SMK adapter: its search API had begun rejecting the `frontend_url` field
  and `lang=en` parameter, breaking every SMK query; the museum page URL is now
  derived from the object number.
- Removed a stale `MUSEUMS` export in `lib/facets.ts` and widened the (optional)
  Supabase source constraint to all sources.

### Deferred to a follow-up

- Service worker / offline caching; a generic `framio.collection.json` adapter;
  splitting `lib/sources.ts` into per-adapter modules; Supabase sync; Ken Burns
  motion and scheduled rotation in Watch; a Lighthouse a11y budget.

## [0.1.0]

- Initial MVP: keyless multi-museum discovery (Met, Art Institute of Chicago,
  Cleveland, SMK, Wikimedia Commons), curation-first home (mood, colour,
  exhibitions), faceted search, Frame-fit filtering, related works, favorites
  and collections, and a Samsung Frame TV export via Frame Studio.

[0.2.0]: https://github.com/pedrobritx/framio/releases/tag/v0.2.0
