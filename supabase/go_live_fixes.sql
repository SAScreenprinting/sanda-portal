-- Go-live fixes for the S&A portal. Safe to run more than once. Run in the Supabase SQL editor.

-- Client artwork uploads from an order page need these two columns (the admin Artwork review queue uses them).
alter table artwork add column if not exists status text;
update artwork set status = 'approved' where status is null;   -- files that already exist do not need review
alter table artwork alter column status set default 'pending';
alter table artwork add column if not exists order_id uuid references orders(id) on delete set null;
