# Open your collection to Framio

*A note for museums, galleries, and archives.*

Framio is a free, open-source gallery that helps people **discover, live with,
and credit** open-access art across every screen they own. If your institution
publishes open-access images, we would love to show them — and to credit you on
every wall they reach.

## What Framio shows — and never shows

- **Only genuinely open works.** Public domain or CC0, released through your
  own open-access program. Nothing scraped, nothing repackaged.
- **Your credit, everywhere.** Your institution is named on every card, every
  artwork page, and inside every file a visitor exports (embedded as EXIF and
  XMP metadata). We never present a work as ours.
- **A link home.** Every artwork page links back to the work on your site.
- **Discovery, not appropriation.** In-copyright works, if surfaced at all, are
  marked for discovery only and can never be downloaded or exported.

## Three ways in

### A. You already have an open API

If you publish a public, keyless, CORS-enabled API (like the Met, the Art
Institute of Chicago, Cleveland, or SMK), that's the ideal path. Open a
[**Museum request**](https://github.com/pedrobritx/framio/issues/new?template=museum_request.yml)
issue with your API details and we'll write an adapter. Developers can also
contribute one directly — see [ADAPTERS.md](ADAPTERS.md).

### B. Publish a lightweight open-collection file

No API? You can publish a single static JSON file — the **`framio.collection.json`**
spec — anywhere with CORS enabled (your own site, a bucket, a GitHub Pages
repo). It's a plain list of your open works:

```jsonc
{
  "version": 1,
  "museum": {
    "name": "Example Museum of Art",
    "url": "https://example.org"
  },
  "license": "CC0",                     // "CC0" or "PD" — the default for all works
  "artworks": [
    {
      "id": "1994.52",                  // your accession/object id (required)
      "title": "A Quiet Harbour",       // required
      "artist": "Jane Doe",             // "" if unknown
      "year": "1898",
      "medium": "Oil on canvas",
      "imageUrl": "https://cdn.example.org/1994.52/full.jpg",    // required, hi-res
      "thumbUrl": "https://cdn.example.org/1994.52/thumb.jpg",   // required, small
      "objectUrl": "https://example.org/art/1994.52",           // link back to you
      "license": "CC0",                 // optional per-work override
      "width": 4000,
      "height": 2600,
      "description": "A calm harbour at dawn…",   // optional; used for access + alt text
      "altText": "Boats moored in a still harbour under a pale sky."  // optional
    }
  ]
}
```

Then open a Museum request issue pointing us at the file's URL. (The generic
adapter that reads this format is on the near-term roadmap; the spec is stable
now so you can publish ahead of it.)

### C. Contribute the adapter yourselves

If you have developers, the fastest path is a pull request. The adapter
contract and a worked example are in [ADAPTERS.md](ADAPTERS.md).

## What we ask of you

- **Honest rights metadata.** Mark open works as open (CC0 / public domain) and
  don't include anything that isn't.
- **Stable image URLs** that won't rot next quarter.
- **CORS enabled** (`Access-Control-Allow-Origin`) so browsers can load your
  images and JSON directly — Framio is a static app with no server of its own.
- **Reasonably sized images** — a hi-res JPEG for export and a small thumbnail,
  not a 500 MB TIFF.

## Talk to us

Questions, or want help getting started? Email **pedrobritx@gmail.com** or open
a [Museum request](https://github.com/pedrobritx/framio/issues/new?template=museum_request.yml).
The more of the world's art that is open, the more of it can live in people's
lives.
