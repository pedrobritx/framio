# Framio — Diagrams

GitHub renders the Mermaid blocks below directly. Source of truth for the structures they describe:
[`../ARCHITECTURE.md`](../ARCHITECTURE.md).

---

## 1. System architecture

Browse hits the Met API live; persistence and files live in Supabase; Frame Studio composes 4K files
in a Node API route. The dashed **Home network** group (Frame Bridge → TV) is **Phase 2**.

```mermaid
flowchart LR
  subgraph Client["Framio — Next.js PWA (Vercel)"]
    UI["Browse · Artwork · Frame Studio<br/>Collections · Library · Settings"]
  end
  subgraph API["Next.js API routes (Node runtime)"]
    MET["/api/met<br/>proxy + cache"]
    EXPORT["/api/export<br/>Sharp → 3840×2160 JPEG"]
  end
  MetAPI["The Met Collection API<br/>(keyless · CC0)"]
  subgraph SB["Supabase"]
    DB[("Postgres<br/>artworks · collections<br/>collection_items · favorites")]
    STORE[["Storage<br/>uploads · exports"]]
  end
  subgraph Home["Home network — Phase 2"]
    BRIDGE["Frame Bridge<br/>Python · samsungtvws"]
    TV["Samsung Frame TV<br/>Art Mode"]
  end

  UI -->|search / detail| MET --> MetAPI
  UI -->|compose| EXPORT
  EXPORT -->|fetch source| MetAPI
  EXPORT -->|JPEG download| UI
  UI <-->|collections · favorites| DB
  UI <-->|upload / export files| STORE
  MET -.cache.-> DB
  DB -. active collection + schedule .-> BRIDGE
  STORE -. exported files .-> BRIDGE
  BRIDGE -->|LAN WebSocket upload| TV

  classDef future stroke-dasharray:4 3,stroke:#9A7B4F;
  class Home,BRIDGE,TV future;
```

## 2. "Export for Frame" — sequence (MVP)

No Samsung API is touched. Framio makes the file; the human is the transport. Phase 2 automates the
last step via the Frame Bridge.

```mermaid
sequenceDiagram
  actor User
  participant Studio as Frame Studio (UI)
  participant Export as /api/export (Node)
  participant Src as Met API / Storage
  participant TV as Samsung Frame TV

  User->>Studio: choose artwork + mode (mat / crop / blur)
  Studio->>Export: POST { src, mode, options }
  Export->>Src: fetch source image bytes
  Src-->>Export: original image
  Note over Export: Sharp compose → 3840×2160 sRGB JPEG
  Export-->>Studio: image/jpeg (download)
  User->>TV: load via SmartThings / USB (manual)
  Note over User,TV: Phase 2 — Frame Bridge uploads automatically over the LAN
```

## 3. Data model

`artworks` is the canonical record for both Met works and user uploads. Uploads are simply
`source = 'upload'` rows; binaries live in Supabase Storage.

```mermaid
erDiagram
  artworks {
    uuid id PK
    text source
    text source_id
    text title
    text artist
    text year
    text medium
    text museum
    bool is_public_domain
    text image_url
  }
  collections {
    uuid id PK
    text name
    uuid cover_artwork_id FK
    int rotation_interval_minutes
    bool shuffle
    jsonb schedule
  }
  collection_items {
    uuid id PK
    uuid collection_id FK
    uuid artwork_id FK
    int position
    jsonb studio_settings
    text exported_path
  }
  favorites {
    uuid id PK
    uuid artwork_id FK
  }
  collections ||--o{ collection_items : contains
  artworks ||--o{ collection_items : "framed in"
  artworks ||--o{ favorites : "favorited as"
  artworks ||--o| collections : "is cover of"
```
