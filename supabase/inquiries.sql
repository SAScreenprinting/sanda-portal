-- Run in Supabase → SQL Editor
-- Inquiry / support ticket system

-- Inquiries table (the ticket itself)
create table if not exists inquiries (
  id              uuid primary key default gen_random_uuid(),
  inquiry_number  text unique not null,
  client_id       uuid references auth.users(id) on delete cascade,
  title           text not null,
  status          text default 'open',   -- open | in_progress | resolved
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table inquiries enable row level security;
create policy "Clients insert own inquiries" on inquiries for insert  with check (auth.uid() = client_id);
create policy "Clients view own inquiries"   on inquiries for select  using    (auth.uid() = client_id);

-- Inquiry thread messages
create table if not exists inquiry_messages (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid references inquiries(id) on delete cascade,
  sender_id   uuid references auth.users(id) on delete set null,
  body        text not null,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

alter table inquiry_messages enable row level security;
create policy "Clients view own inquiry messages" on inquiry_messages for select
  using (exists (
    select 1 from inquiries i where i.id = inquiry_id and i.client_id = auth.uid()
  ));
create policy "Clients insert own inquiry messages" on inquiry_messages for insert
  with check (
    exists (select 1 from inquiries i where i.id = inquiry_id and i.client_id = auth.uid())
    and is_admin = false
  );
