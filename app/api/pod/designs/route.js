import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const READY = ['Approved', 'In Setup', 'Live'];

// For the Shopify app: the approved designs a linked client can add to their store.
export async function GET(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const clientId = new URL(request.url).searchParams.get('clientId');
  if (!clientId) return Response.json({ designs: [] });
  const { data } = await serviceDb().from('saved_designs').select('id, name, thumbnail, product, decorations, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(200);
  const designs = (data || []).filter((d) => READY.includes(d.product?.status)).map((d) => ({
    id: d.id, name: d.name, number: d.product?.designNumber || null, status: d.product?.status,
    productTitle: d.product?.productTitle || null, image: Object.values(d.decorations?.previews || {})[0] || d.thumbnail || null,
    retailPrice: d.product?.retailPrice ?? null, createdAt: d.created_at,
  }));
  return Response.json({ designs });
}
