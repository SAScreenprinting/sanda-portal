import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const UPSTREAM = process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev';

// Admin: every product a client can design on, with the costs you have entered for it
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  let products = [];
  try {
    const res = await fetch(`${UPSTREAM}/portal/products`, { headers: { 'x-portal-key': process.env.PORTAL_API_KEY || '' }, cache: 'no-store' });
    if (res.ok) products = (await res.json()).products || [];
  } catch {}
  const { data: rows } = await serviceDb().from('pod_pricing').select('*');
  const pricing = Object.fromEntries((rows || []).map((r) => [r.shopify_product_id, r]));
  return Response.json({ products, pricing });
}

export async function PUT(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const b = await request.json();
  const num = (v) => Math.max(0, Number.parseFloat(v) || 0);
  if (!b.productId) return Response.json({ error: 'productId required' }, { status: 400 });
  const row = {
    shopify_product_id: String(b.productId), title: b.title || null,
    base_cost: num(b.base_cost), print_cost: num(b.print_cost), shipping_cost: num(b.shipping_cost),
    suggested_price: b.suggested_price === '' || b.suggested_price == null ? null : num(b.suggested_price),
    updated_at: new Date().toISOString(),
  };
  const { error } = await serviceDb().from('pod_pricing').upsert(row, { onConflict: 'shopify_product_id' });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
