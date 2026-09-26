import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const url = new URL(request.url);
  const wantAdmin = url.searchParams.get('admin') === 'true';
  if (wantAdmin && !auth.isAdmin) return forbidden();
  const db = serviceDb();
  let q = db.from('sample_orders').select('*, design:design_id ( id, name, product ), client:client_id ( business_name, contact_name, email )').order('created_at', { ascending: false }).limit(300);
  if (!wantAdmin) {
    q = q.eq('client_id', auth.user.id);
    const designId = url.searchParams.get('designId');
    if (designId) q = q.eq('design_id', designId);
  }
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ samples: data || [] });
}

// Client asks for a printed sample of an approved design
export async function POST(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { designId, quantity, note } = await request.json();
  const db = serviceDb();
  const { data: design } = await db.from('saved_designs').select('id, product').eq('id', designId).eq('client_id', auth.user.id).maybeSingle();
  if (!design) return Response.json({ error: 'Design not found' }, { status: 404 });
  if (!['Approved', 'In Setup', 'Live'].includes(design.product?.status)) return Response.json({ error: 'Samples can be ordered once a design is approved.' }, { status: 400 });
  const qty = Math.min(5, Math.max(1, parseInt(quantity, 10) || 1));
  const { data, error } = await db.from('sample_orders').insert({ client_id: auth.user.id, design_id: designId, quantity: qty, size_note: String(note || '').slice(0, 300) || null }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, sample: data });
}

// Admin moves a sample along and adds tracking
export async function PATCH(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const { id, status, tracking_number } = await request.json();
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const update = {};
  if (status) { if (!['requested', 'in_production', 'shipped'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 }); update.status = status; }
  if (tracking_number !== undefined) update.tracking_number = String(tracking_number).slice(0, 80) || null;
  const { error } = await serviceDb().from('sample_orders').update(update).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
