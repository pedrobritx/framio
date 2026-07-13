# Open art descriptions

Framio's accessibility centerpiece: **open-source visual descriptions of
artworks**, so people who can't see an image — or can't see it well — can
still experience the art.

Descriptions appear on the artwork page, become the image's alt text across
the app, are read in Watch mode's info panel, and travel **inside every
exported file** (embedded as XMP `dc:description`), so access follows the
image wherever it goes.

## Where descriptions come from

1. **Museums.** Where a museum's open API publishes prose, Framio shows it
   with credit: the Art Institute of Chicago (`short_description`,
   `description`, and curated image `alt_text`), the Cleveland Museum of Art
   (`description`, `did_you_know`), SMK (`content_description`, `labels`),
   and Wikimedia Commons (`ImageDescription`). The Met's API publishes none —
   which is exactly why the community dataset exists.
2. **The community — you.** [`data/descriptions.json`](../data/descriptions.json)
   is an open CC0 dataset anyone can contribute to. Community entries are
   written for access, so they take precedence over museum marketing copy.

## How to contribute a description

Open a PR editing [`data/descriptions.json`](../data/descriptions.json), or —
easier — use the **[Describe an artwork issue form](https://github.com/pedrobritx/framio/issues/new?template=artwork_description.yml)**
and a maintainer will land it for you.

An entry is keyed by the artwork's composite id (shown in the artwork page
URL, e.g. `met:436535`):

```json
{
  "met:436535": {
    "altText": "A windblown wheat field under a turbulent sky; two dark green cypresses rise on the right like flames.",
    "description": "A summer landscape painted in thick, restless strokes. …",
    "contributor": "Your name or handle",
    "lang": "en"
  }
}
```

| Field | What it is |
| --- | --- |
| `altText` | One or two sentences. What the image shows, for someone hearing it in a stream of other content. No "image of", no interpretation — just what's there. |
| `description` | A fuller visual walkthrough (up to ~1200 characters). Composition, subjects, colours, light, what's happening. Written to be *listened to*. |
| `contributor` | Credit for you. Listed in the dataset forever. |
| `lang` | BCP-47 language tag (`en`, `pt-BR`, `da`, …). |

### What makes a good visual description

- **Describe, don't caption.** "Golden wheat fills the foreground, bending as
  if in wind" beats "A famous Van Gogh landscape."
- **Order it like looking:** the whole, then the parts, then the details.
- **Colours, light, and texture matter** — they're most of what a sighted
  viewer gets.
- **Say what's uncertain plainly** ("a figure, possibly a shepherd").
- **Don't editorialise.** Art-historical context belongs at the museum link;
  the description's job is the image itself.

### The CC0 dedication

By submitting a description you dedicate it to the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). This is what
lets the description travel inside exported files, be read by any tool, and
be reused by museums themselves — access with no strings attached. The PR
checklist and the issue form both ask you to confirm this.

## Checklist for PRs

- [ ] Key is a valid composite id (`met:…`, `aic:…`, `cma:…`, `smk:…`, `wiki:…`)
- [ ] `altText` is 1–2 sentences; `description` ≤ 1200 characters
- [ ] `contributor` and `lang` present
- [ ] You confirm the CC0 dedication
- [ ] `npm test` passes (`data/descriptions.test.ts` validates the schema)
