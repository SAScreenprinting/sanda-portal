import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// Called by the Shopify app when a POD SKU sells: the design's print files, but only if it belongs to the linked client.
export async function GET(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const sku = String(url.searchParams.get('sku') || '').trim().toUpperCase();
  const clientId = url.searchParams.get('clientId');
  if (!sku || !clientId) return Response.json({ design: null });
  const { data } = await serviceDb().from('saved_designs').select('id, name, client_id, product, decorations').eq('client_id', clientId).limit(500);
  const hit = (data || []).find((d) => String(d.product?.sku || '').toUpperCase() === sku);
  if (!hit) return Response.json({ design: null });
  return Response.json({
    design: {
      id: hit.id, name: hit.name, clientId: hit.client_id, sku, productTitle: hit.product?.productTitle || null,
      variantTitle: hit.product?.variantTitle || null, previews: hit.decorations?.previews || {}, printFiles: hit.decorations?.printFiles || [],
    },
  });
}
