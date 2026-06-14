-- Framio — initial schema (single-user MVP). See docs/ARCHITECTURE.md.
-- Binaries live in Supabase Storage buckets: `uploads`, `exports`.

create extension if not exists "pgcrypto";

-- Canonical record for Met works AND user uploads (source = 'upload').
create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('met', 'upload')),
  source_id text,
  title text not null default 'Untitled',
  artist text not null default 'Unknown artist',
  year text not null default '',
  medium text not null default '',
  museum text not null default '',
  department text,
  rights text,
  is_public_domain boolean not null default false,
  image_url text not null,
  thumb_url text,
  object_url text,
  width int,
  height int,
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_artwork_id uuid references artworks (id) on delete set null,
  rotation_interval_minutes int not null default 60,
  shuffle boolean not null default false,
  schedule jsonb,
  created_at timestamptz not null default now()
);

create table if not exists collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections (id) on delete cascade,
  artwork_id uuid not null references artworks (id) on delete cascade,
  position int not null default 0,
  studio_settings jsonb, -- { mode, matColor, margin, position }
  exported_path text, -- Storage path of the framed 3840×2160 file
  created_at timestamptz not null default now(),
  unique (collection_id, artwork_id)
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (artwork_id)
);

create index if not exists idx_collection_items_collection
  on collection_items (collection_id, position);
create index if not exists idx_artworks_source
  on artworks (source, source_id);

-- Multi-user (Phase 3): add user_id columns + row-level security via Supabase Auth.
