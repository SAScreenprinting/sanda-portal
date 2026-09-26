import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// A client's cost for one product (what they pay per item) and the suggested retail price
export async function GET(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const productId = new URL(request.url).searchParams.get('productId');
  if (!productId) return Response.json({ pricing: null });
  const { data } = await serviceDb().from('pod_pricing').select('base_cost, print_cost, shipping_cost, suggested_price').eq('shopify_product_id', productId).maybeSingle();
  if (!data) return Response.json({ pricing: null });
  const cost = Number(data.base_cost) + Number(data.print_cost) + Number(data.shipping_cost);
  return Response.json({ pricing: { cost: +cost.toFixed(2), suggested: data.suggested_price != null ? Number(data.suggested_price) : null } });
}
