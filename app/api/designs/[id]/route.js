import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { getAuth, forbidden } from '@/lib/apiAuth';
import { sendDesignReviewEmail } from '@/lib/designEmail';
import { makeSku } from '@/lib/designSku';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db.from('saved_designs').select('*').eq('id', id).eq('client_id', user.id).maybeSingle();
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ design: data });
}

// Admin only: move a design through Submitted, In Setup and Live
export async function PATCH(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  if (!auth.isAdmin) return forbidden();
  const { id } = await params;
  const { status, note, sku } = await request.json();
  const db0 = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  // Editing only the SKU
  if (sku !== undefined && !status) {
    const clean = String(sku).trim().toUpperCase().replace(/[^A-Z0-9._-]/g, '-').slice(0, 60);
    if (!clean) return Response.json({ error: 'SKU cannot be empty' }, { status: 400 });
    const { data: cur } = await db0.from('saved_designs').select('product').eq('id', id).maybeSingle();
    if (!cur) return Response.json({ error: 'Not found' }, { status: 404 });
    const { error: e3 } = await db0.from('saved_designs').update({ product: { ...(cur.product || {}), sku: clean } }).eq('id', id);
    if (e3) return Response.json({ error: e3.message }, { status: 500 });
    return Response.json({ ok: true, sku: clean });
  }
  if (!['Submitted', 'Approved', 'Denied', 'In Setup', 'Live'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: row } = await db.from('saved_designs').select('id, name, client_id, product').eq('id', id).maybeSingle();
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  const { error } = await db.from('saved_designs').update({ product: { ...(row.product || {}), status, reviewNote: status === 'Denied' ? (note || '') : (row.product?.reviewNote && status !== 'Approved' ? row.product.reviewNote : ''), reviewedAt: new Date().toISOString(), sku: (status === 'Approved' || status === 'In Setup' || status === 'Live') ? (row.product?.sku || makeSku(row.product)) : row.product?.sku }, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Tell the client when their design is approved or denied
  let emailed = false;
  if ((status === 'Approved' || status === 'Denied') && row.product?.status !== status) {
    const { data: client } = await db.from('profiles').select('email').eq('id', row.client_id).maybeSingle();
    emailed = await sendDesignReviewEmail({ to: client?.email, status, design: { ...row, product: { ...row.product, sku: row.product?.sku || makeSku(row.product) } }, note, origin: new URL(request.url).origin });
  }
  return Response.json({ ok: true, emailed, sku: (status === 'Approved' || status === 'In Setup' || status === 'Live') ? (row.product?.sku || makeSku(row.product)) : row.product?.sku });
}
