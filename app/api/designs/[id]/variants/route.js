import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';
import { fetchProductVariants } from '@/lib/designVariants';

export const dynamic = 'force-dynamic';

// The colors/sizes a design's product comes in, so the owner can choose which ones to publish.
export async function GET(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { id } = await params;
  const { data: design } = await serviceDb().from('saved_designs').select('id, product').eq('id', id).eq('client_id', auth.user.id).maybeSingle();
  if (!design) return Response.json({ error: 'Design not found' }, { status: 404 });
  const info = await fetchProductVariants(design.product?.productId, auth.user.id);
  if (!info) return Response.json({ error: 'Could not load this product\'s colors and sizes right now.' }, { status: 502 });
  return Response.json({ ...info, designVariant: design.product?.variantTitle || null });
}
