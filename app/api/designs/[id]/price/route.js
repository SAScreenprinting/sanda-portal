import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';

// The client saves the retail price they plan to charge for one of their designs
export async function POST(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { id } = await params;
  const { price } = await request.json();
  const p = Number.parseFloat(price);
  if (!(p > 0) || p > 100000) return Response.json({ error: 'Enter a price above zero.' }, { status: 400 });
  const db = serviceDb();
  const { data: row } = await db.from('saved_designs').select('product').eq('id', id).eq('client_id', auth.user.id).maybeSingle();
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  const { error } = await db.from('saved_designs').update({ product: { ...(row.product || {}), retailPrice: +p.toFixed(2) } }).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, price: +p.toFixed(2) });
}
