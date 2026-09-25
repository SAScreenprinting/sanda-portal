import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { getAuth, forbidden } from '@/lib/apiAuth';
import { sendDesignReviewEmail } from '@/lib/designEmail';

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
  const { status, note } = await request.json();
  if (!['Submitted', 'Approved', 'Denied', 'In Setup', 'Live'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: row } = await db.from('saved_designs').select('id, name, client_id, product').eq('id', id).maybeSingle();
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  const { error } = await db.from('saved_designs').update({ product: { ...(row.product || {}), status, reviewNote: status === 'Denied' ? (note || '') : (row.product?.reviewNote && status !== 'Approved' ? row.product.reviewNote : ''), reviewedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Tell the client when their design is approved or denied
  let emailed = false;
  if ((status === 'Approved' || status === 'Denied') && row.product?.status !== status) {
    const { data: client } = await db.from('profiles').select('email').eq('id', row.client_id).maybeSingle();
    emailed = await sendDesignReviewEmail({ to: client?.email, status, design: row, note, origin: new URL(request.url).origin });
  }
  return Response.json({ ok: true, emailed });
}
