create extension if not exists pgcrypto;

create type product_status as enum ('DRAFT', 'PUBLISHED');
create type analytics_event_name as enum ('page_view', 'tool_open', 'tool_started', 'tool_completed', 'download_clicked');

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null,
  status product_status not null default 'DRAFT',
  short_description text not null,
  spec_json jsonb not null,
  spec_version integer not null check (spec_version > 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_publication_state_check check (
    (status = 'DRAFT' and published_at is null)
    or (status = 'PUBLISHED' and published_at is not null)
  )
);

create table product_spec_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  version integer not null check (version > 0),
  spec_json jsonb not null,
  created_by text,
  created_at timestamptz not null default now(),
  unique (product_id, version)
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name analytics_event_name not null,
  product_id uuid references products(id) on delete set null,
  session_id uuid not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_product_created_idx on analytics_events(product_id, created_at desc);
