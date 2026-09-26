-- POD portal features. Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- The portal reads and writes these tables with its server key, so row level security is switched on with no public policies.

-- Your cost and the suggested price for each product a client can design on (you fill this in on the Admin > Pricing screen)
create table if not exists pod_pricing (
  id uuid primary key default gen_random_uuid(),
  shopify_product_id text unique not null,
  title text,
  base_cost numeric(10,2) not null default 0,       -- blank garment
  print_cost numeric(10,2) not null default 0,      -- printing per item
  shipping_cost numeric(10,2) not null default 0,   -- shipping per item
  suggested_price numeric(10,2),
  updated_at timestamptz default now()
);

-- A client's own online store, so approved designs can be published to it
create table if not exists store_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  platform text not null default 'shopify',
  store_domain text not null,
  token_encrypted text not null,                    -- encrypted before it is saved
  status text default 'connected',
  created_at timestamptz default now(),
  unique (client_id, platform, store_domain)
);

-- Where each approved design was published in a client's store
create table if not exists design_publications (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references saved_designs(id) on delete cascade,
  connection_id uuid references store_connections(id) on delete set null,
  external_id text,
  external_url text,
  price numeric(10,2),
  created_at timestamptz default now()
);

-- One-off printed samples of an approved design
create table if not exists sample_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  design_id uuid references saved_designs(id) on delete set null,
  quantity int not null default 1,
  size_note text,
  status text default 'requested',                  -- requested | in_production | shipped
  tracking_number text,
  created_at timestamptz default now()
);

-- Extra people who can log in to a client's account
create table if not exists team_members (
  client_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  role text default 'member',
  invited_at timestamptz default now(),
  primary key (client_id, email)
);

alter table pod_pricing enable row level security;
alter table store_connections enable row level security;
alter table design_publications enable row level security;
alter table sample_orders enable row level security;
alter table team_members enable row level security;
