-- Run this in your Supabase SQL Editor to add the new artwork columns

ALTER TABLE artwork ADD COLUMN IF NOT EXISTS label       text;
ALTER TABLE artwork ADD COLUMN IF NOT EXISTS admin_notes text;

-- Optional: add an index on client_id for faster lookups
CREATE INDEX IF NOT EXISTS artwork_client_id_idx ON artwork(client_id);
