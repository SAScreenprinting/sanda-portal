-- Run this in Supabase → SQL Editor

-- Product requests (from client "Request a Product" form)
create table if not exists product_requests (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references auth.users(id) on delete cascade,
  brand        text,
  sku          text,
  garment_name text not null,
  notes        text,
  status       text default 'pending', -- pending | reviewed | sourced | declined
  created_at   timestamptz default now()
);
alter table product_requests enable row level security;
create policy "Clients can insert own requests"  on product_requests for insert with check (auth.uid() = client_id);
create policy "Clients can view own requests"    on product_requests for select using (auth.uid() = client_id);

-- Artwork files (client uploads)
create table if not exists artwork (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references auth.users(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  file_name   text not null,
  file_url    text not null,
  file_size   bigint,
  file_type   text,
  status      text default 'pending', -- pending | approved | rejected
  notes       text,
  created_at  timestamptz default now()
);
alter table artwork enable row level security;
create policy "Clients can insert own artwork"  on artwork for insert with check (auth.uid() = client_id);
create policy "Clients can view own artwork"    on artwork for select using (auth.uid() = client_id);

-- Orders table (if not already created)
create table if not exists orders (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references auth.users(id) on delete cascade,
  order_number text,
  status       text default 'Awaiting Artwork',
  total_amount numeric(10,2) default 0,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table orders enable row level security;
create policy "Clients can view own orders"   on orders for select using (auth.uid() = client_id);
create policy "Clients can insert own orders" on orders for insert with check (auth.uid() = client_id);

-- Order items table (if not already created)
create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade,
  description text,
  quantity    integer,
  decoration  text,
  colors      text,
  created_at  timestamptz default now()
);
alter table order_items enable row level security;
create policy "Clients can view own order items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.client_id = auth.uid()));
create policy "Clients can insert own order items" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.client_id = auth.uid()));

-- Supabase Storage: create a bucket named "artwork" (public)
-- Do this in Supabase → Storage → New bucket → name: artwork → Public: ON

