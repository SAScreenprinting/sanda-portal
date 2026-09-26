-- Order Desk tables. Paste into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.

-- Orders pulled from a client's connected online store
create table if not exists pod_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  connection_id uuid references store_connections(id) on delete set null,
  external_id text not null,                 -- the store's own order id
  order_number text,                         -- like #1042
  customer_name text,
  customer_email text,
  ship_to jsonb,                             -- shipping address
  currency text default 'USD',
  total numeric(10,2),
  status text not null default 'new',        -- new | in_production | shipped | cancelled
  tracking_number text,
  tracking_carrier text,
  tracking_pushed boolean default false,     -- true once the tracking number reached the client's store
  notes text,
  external_created_at timestamptz,
  created_at timestamptz default now(),
  unique (connection_id, external_id)
);

create table if not exists pod_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references pod_orders(id) on delete cascade,
  external_line_id text,
  sku text,
  title text,
  variant_title text,
  quantity int not null default 1,
  price numeric(10,2),
  design_id uuid references saved_designs(id) on delete set null   -- matched by SKU
);

alter table store_connections add column if not exists last_synced_at timestamptz;

alter table pod_orders enable row level security;
alter table pod_order_items enable row level security;
create index if not exists pod_orders_client_idx on pod_orders (client_id, created_at desc);
create index if not exists pod_order_items_order_idx on pod_order_items (order_id);
