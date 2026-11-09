import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';
import { fetchProductVariants, colorOptionIndex } from '@/lib/designVariants';
import { mockupViews } from '@/lib/designMockups';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const READY = ['Approved', 'In Setup', 'Live'];

// For the Shopify app: everything needed to set up one design in a client's store (colors, sizes, price hints).
export async function GET(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');
  const designId = url.searchParams.get('designId');
  if (!clientId || !designId) return Response.json({ error: 'Missing details' }, { status: 400 });
  const db = serviceDb();
  const { data: design } = await db.from('saved_designs').select('id, name, product, decorations').eq('id', designId).eq('client_id', clientId).maybeSingle();
  if (!design || !READY.includes(design.product?.status)) return Response.json({ error: 'Design not found' }, { status: 404 });

  const info = await fetchProductVariants(design.product?.productId, clientId);
  if (!info) return Response.json({ error: "Could not load this product's colors and sizes right now." }, { status: 502 });
  const hasColor = colorOptionIndex(info.optionNames) >= 0;
  const views = hasColor ? await mockupViews(design, clientId) : [];
  const { data: price } = await db.from('pod_pricing').select('base_cost, print_cost, shipping_cost, suggested_price').eq('shopify_product_id', String(design.product?.productId || '')).maybeSingle();
  const cost = price ? Number(price.base_cost) + Number(price.print_cost) + Number(price.shipping_cost) : null;

  return Response.json({
    design: {
      id: design.id, name: design.name, number: design.product?.designNumber || null, productTitle: design.product?.productTitle || null,
      image: Object.values(design.decorations?.previews || {})[0] || null, designVariant: design.product?.variantTitle || null, retailPrice: design.product?.retailPrice ?? null,
    },
    optionNames: info.optionNames,
    options: info.options,
    variants: info.variants.map((v) => v.values),
    canMockup: views.length > 0,
    mockupViews: views.map((v) => v.name),
    pricing: price ? { cost: +cost.toFixed(2), suggested: price.suggested_price != null ? Number(price.suggested_price) : null } : null,
  });
}
