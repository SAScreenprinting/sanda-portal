import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET: every invoice with the client's name (admin only).
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const db = serviceDb();
  const { data: invoices, error } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const list = invoices || [];
  if (list.length === 0) return Response.json({ invoices: [] });
  const { data: profiles } = await db
    .from('profiles').select('id, business_name, contact_name, email')
    .in('id', [...new Set(list.map((i) => i.client_id))]);
  const byClient = new Map((profiles || []).map((p) => [p.id, p]));
  return Response.json({ invoices: list.map((i) => ({ ...i, client: byClient.get(i.client_id) || null })) });
}

// POST: create an invoice for a client. The client sees it on their Billing page right away.
export async function POST(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const b = await request.json().catch(() => ({}));
  const amount = Number.parseFloat(b.amount);
  if (!b.client_id) return Response.json({ error: 'Choose a client.' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return Response.json({ error: 'Enter an amount greater than zero.' }, { status: 400 });
  if (!b.due_date) return Response.json({ error: 'Choose a due date.' }, { status: 400 });

  const db = serviceDb();
  // Next invoice number: INV-1001, INV-1002, ... (based on the highest existing number, not the row count)
  const { data: existing } = await db.from('invoices').select('invoice_number');
  const highest = (existing || []).reduce((m, r) => Math.max(m, Number(String(r.invoice_number || '').replace(/\D/g, '')) || 0), 1000);
  const invoice_number = `INV-${highest + 1}`;

  const { data, error } = await db.from('invoices').insert({
    client_id: b.client_id,
    order_id: b.order_id || null,
    invoice_number,
    amount: Math.round(amount * 100) / 100,
    due_date: b.due_date,
    paid: false,
    venmo_link: b.venmo_link || null,
    zelle_info: b.zelle_info || null,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, invoice: data });
}

// PATCH: mark an invoice paid / unpaid, or change its due date, amount or payment details.
export async function PATCH(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const b = await request.json().catch(() => ({}));
  if (!b.id) return Response.json({ error: 'id required' }, { status: 400 });

  const update = {};
  if (b.paid !== undefined) {
    update.paid = !!b.paid;
    update.paid_at = b.paid ? new Date().toISOString() : null;
  }
  if (b.due_date !== undefined) update.due_date = b.due_date;
  if (b.amount !== undefined) {
    const amount = Number.parseFloat(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) return Response.json({ error: 'Enter an amount greater than zero.' }, { status: 400 });
    update.amount = Math.round(amount * 100) / 100;
  }
  if (b.venmo_link !== undefined) update.venmo_link = b.venmo_link || null;
  if (b.zelle_info !== undefined) update.zelle_info = b.zelle_info || null;
  if (Object.keys(update).length === 0) return Response.json({ error: 'Nothing to update' }, { status: 400 });

  const { data, error } = await serviceDb().from('invoices').update(update).eq('id', b.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, invoice: data });
}

// DELETE: remove an invoice that was created by mistake.
export async function DELETE(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const { error } = await serviceDb().from('invoices').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
