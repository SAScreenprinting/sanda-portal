import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';
import { designNumberFromSku } from '@/lib/designSku';

export const dynamic = 'force-dynamic';

// Called by the Shopify app when a POD SKU sells: the design's print files, but only if it belongs to the linked client.
export async function GET(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const sku = String(url.searchParams.get('sku') || '').trim().toUpperCase();
  const clientId = url.searchParams.get('clientId');
  if (!sku || !clientId) return Response.json({ design: null });
  const { data } = await serviceDb().from('saved_designs').select('id, name, client_id, product, decorations').eq('client_id', clientId).limit(500);
  // Exact SKU first (older single-variant designs), then any variant of the design: POD-<number>-<color>-<size> all share the number.
  const designs = data || [];
  const number = designNumberFromSku(sku);
  const hit = designs.find((d) => String(d.product?.sku || '').toUpperCase() === sku)
    || (number ? designs.find((d) => String(d.product?.designNumber || '') === number) : null);
  if (!hit) return Response.json({ design: null });
  const exact = String(hit.product?.sku || '').toUpperCase() === sku;
  return Response.json({
    design: {
      id: hit.id, name: hit.name, clientId: hit.client_id, sku, productTitle: hit.product?.productTitle || null,
      // For another variant of the design the order's own variant says which color/size, so none is given here.
      variantTitle: exact ? (hit.product?.variantTitle || null) : null,
      blank: hit.product?.custom?.blank || null,
      previews: hit.decorations?.previews || {},
      printFiles: hit.decorations?.printFiles || [],
    },
  });
}
