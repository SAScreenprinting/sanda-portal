-- ============================================================
--  S&A Screen Printing — Client Portal Database Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID extension (usually already on)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- One row per Supabase auth user. Stores client-specific data.
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name       TEXT,
  contact_name        TEXT,
  email               TEXT,
  phone               TEXT,
  account_rep         TEXT DEFAULT 'S&A Team',
  theme               TEXT DEFAULT 'classic',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  onboarding_step     INT DEFAULT 0,
  is_admin            BOOLEAN DEFAULT FALSE,
  -- Loyalty rewards (feature #11)
  total_orders        INT DEFAULT 0,
  loyalty_tier        TEXT DEFAULT 'Bronze', -- Bronze / Silver / Gold / Platinum
  discount_pct        INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, contact_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT UNIQUE NOT NULL,          -- e.g. "#1051"
  client_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'Awaiting Artwork',
  -- Statuses: Awaiting Artwork | Art Approved | In Production | Quality Check | Shipped | Delivered
  notes           TEXT,
  rush            BOOLEAN DEFAULT FALSE,
  reorder_of      UUID REFERENCES orders(id),   -- feature #6: reorders
  total_amount    NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- Estimated dates for tracking bar (feature #3)
  est_art_approved_at   DATE,
  est_in_production_at  DATE,
  est_quality_check_at  DATE,
  est_shipped_at        DATE,
  -- Actual completion dates
  art_approved_at       TIMESTAMPTZ,
  in_production_at      TIMESTAMPTZ,
  quality_check_at      TIMESTAMPTZ,
  shipped_at            TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  tracking_number       TEXT,
  tracking_carrier      TEXT
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku         TEXT,                   -- e.g. "PC61-RED-L"
  description TEXT,
  quantity    INT DEFAULT 0,
  unit_price  NUMERIC(10,2) DEFAULT 0,
  decoration  TEXT,                  -- Screen Print | Embroidery | DTG | Sublimation
  placement   TEXT,                  -- Front | Back | Left Chest
  colors      INT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER STATUS HISTORY ────────────────────────────────────────────────────
-- Full audit trail of every status change
CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  changed_by  UUID REFERENCES profiles(id),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();


-- ─── PROOFS ──────────────────────────────────────────────────────────────────
-- Artwork proofs clients approve/reject (feature #4)
CREATE TABLE IF NOT EXISTS proofs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version       INT DEFAULT 1,
  file_url      TEXT NOT NULL,
  thumbnail_url TEXT,
  status        TEXT DEFAULT 'Pending',  -- Pending | Approved | Rejected | Revision Requested
  client_note   TEXT,
  approved_by   UUID REFERENCES profiles(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ─── ARTWORK LIBRARY ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artwork (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  thumbnail   TEXT,
  file_type   TEXT,                    -- PNG | AI | PDF | SVG | EPS
  file_size   BIGINT,
  tags        TEXT[],
  used_on     UUID[],                  -- order IDs this art was used on
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ─── MESSAGES ────────────────────────────────────────────────────────────────
-- Two-way client ↔ admin messaging (feature #2)
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL, -- optional thread link
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  body        TEXT NOT NULL,
  attachment_url TEXT,
  read_by_client BOOLEAN DEFAULT FALSE,
  read_by_admin  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id),
  invoice_number  TEXT UNIQUE NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  paid            BOOLEAN DEFAULT FALSE,
  paid_at         TIMESTAMPTZ,
  due_date        DATE,
  -- Payment deeplinks (feature #10)
  venmo_link      TEXT,
  zelle_info      TEXT,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─── SAVED DESIGNS ───────────────────────────────────────────────────────────
-- Studio saved designs (feature #9)
CREATE TABLE IF NOT EXISTS saved_designs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled Design',
  product     JSONB,                   -- product config snapshot
  decorations JSONB,                   -- array of decoration layers
  thumbnail   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
-- Email notification queue (feature #5)
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- order_status | message | proof_ready | invoice
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  email_sent  BOOLEAN DEFAULT FALSE,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────────────────────
-- Clients only see their own data. Admins see everything.

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_designs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- profiles
CREATE POLICY "Own profile" ON profiles
  FOR ALL USING (id = auth.uid() OR is_admin());

-- orders
CREATE POLICY "Own orders" ON orders
  FOR ALL USING (client_id = auth.uid() OR is_admin());

-- order_items
CREATE POLICY "Own order items" ON order_items
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
    OR is_admin()
  );

-- order_status_history
CREATE POLICY "Own order history" ON order_status_history
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
    OR is_admin()
  );

-- proofs
CREATE POLICY "Own proofs" ON proofs
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE client_id = auth.uid())
    OR is_admin()
  );

-- artwork
CREATE POLICY "Own artwork" ON artwork
  FOR ALL USING (client_id = auth.uid() OR is_admin());

-- messages
CREATE POLICY "Own messages" ON messages
  FOR ALL USING (client_id = auth.uid() OR is_admin());

-- invoices
CREATE POLICY "Own invoices" ON invoices
  FOR ALL USING (client_id = auth.uid() OR is_admin());

-- saved_designs
CREATE POLICY "Own designs" ON saved_designs
  FOR ALL USING (client_id = auth.uid() OR is_admin());

-- notifications
CREATE POLICY "Own notifications" ON notifications
  FOR ALL USING (client_id = auth.uid() OR is_admin());


-- ─── REALTIME ────────────────────────────────────────────────────────────────
-- Enable realtime subscriptions for messages and order updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE proofs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ─── SEED: DEMO ADMIN USER PROFILE ───────────────────────────────────────────
-- After creating your admin user via Supabase Auth, run:
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'admin@sandascreenprinting.com';
