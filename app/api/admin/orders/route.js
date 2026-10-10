import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export const ORDER_STATUSES = ['Awaiting Artwork', 'Art Approved', 'In Production', 'Quality Check', 'Shipped', 'Delivered'];

// The timestamp column that records when an order reached each status (read by the client's order tracker).
const STAMP = {
  'Art Approved': 'art_approved_at',
  'In Production': 'in_production_at',
  'Quality Check': 'quality_check_at',
  Shipped: 'shipped_at',
  Delivered: 'delivered_at',
};

// GET: every client order with the client's name and its items (admin only).
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const db = serviceDb();

  const { data: orders, error } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const list = orders || [];
  if (list.length === 0) return Response.json({ orders: [], statuses: ORDER_STATUSES });

  const [{ data: items }, { data: profiles }] = await Promise.all([
    db.from('order_items').select('*').in('order_id', list.map((o) => o.id)),
    db.from('profiles').select('id, business_name, contact_name, email').in('id', [...new Set(list.map((o) => o.client_id))]),
  ]);
  const byClient = new Map((profiles || []).map((p) => [p.id, p]));
  return Response.json({
    statuses: ORDER_STATUSES,
    orders: list.map((o) => ({
      ...o,
      client: byClient.get(o.client_id) || null,
      items: (items || []).filter((i) => i.order_id === o.id),
    })),
  });
}

// PATCH: change an order's status and/or tracking. Records the history row and the status timestamp
// so the client's order tracker (which reads those columns) shows the same thing the admin set.
export async function PATCH(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const body = await request.json().catch(() => ({}));
  const { id, status, tracking_number, tracking_carrier, note } = body;
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  if (status !== undefined && !ORDER_STATUSES.includes(status)) return Response.json({ error: 'Unknown status' }, { status: 400 });

  const db = serviceDb();
  const { data: current } = await db.from('orders').select('id, status').eq('id', id).maybeSingle();
  if (!current) return Response.json({ error: 'Order not found' }, { status: 404 });

  const update = { updated_at: new Date().toISOString() };
  if (tracking_number !== undefined) update.tracking_number = String(tracking_number).trim() || null;
  if (tracking_carrier !== undefined) update.tracking_carrier = String(tracking_carrier).trim() || null;
  if (status !== undefined && status !== current.status) {
    update.status = status;
    if (STAMP[status]) update[STAMP[status]] = new Date().toISOString();
  }
  const { data: order, error } = await db.from('orders').update(update).eq('id', id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const changed = update.status !== undefined;
  if (changed) {
    await db.from('order_status_history').insert({ order_id: id, status, changed_by: auth.user.id, note: note || null });
  }
  return Response.json({ ok: true, order, statusChanged: changed });
}
