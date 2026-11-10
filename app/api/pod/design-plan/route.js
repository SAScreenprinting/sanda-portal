import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';
import { loadVariantInfo, colorOptionIndex } from '@/lib/designVariants';
import { mockupViews } from '@/lib/designMockups';
import { isCustom, customColorPictures } from '@/lib/customDesign';

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

  const info = await loadVariantInfo(design, clientId);
  if (!info) return Response.json({ error: "Could not load this product's colors and sizes right now." }, { status: 502 });
  const hasColor = colorOptionIndex(info.optionNames) >= 0;
  const custom = isCustom(design);

  // Color pictures: a custom product uses the photos that were uploaded for each color, a catalog product is built from its shirt picture.
  let viewNames;
  if (custom) viewNames = customColorPictures(design).length > 0 ? ['Front'] : [];
  else viewNames = hasColor ? (await mockupViews(design, clientId)).map((v) => v.name) : [];

  let pricing = null;
  if (custom) {
    const c = design.product.custom;
    if (c.cost != null || c.suggested != null) pricing = { cost: c.cost ?? 0, suggested: c.suggested ?? null };
  } else {
    const { data: price } = await db.from('pod_pricing').select('base_cost, print_cost, shipping_cost, suggested_price').eq('shopify_product_id', String(design.product?.productId || '')).maybeSingle();
    if (price) {
      const cost = Number(price.base_cost) + Number(price.print_cost) + Number(price.shipping_cost);
      pricing = { cost: +cost.toFixed(2), suggested: price.suggested_price != null ? Number(price.suggested_price) : null };
    }
  }

  return Response.json({
    design: {
      id: design.id, name: design.name, number: design.product?.designNumber || null, productTitle: design.product?.productTitle || null,
      image: Object.values(design.decorations?.previews || {})[0] || null, designVariant: design.product?.variantTitle || null, retailPrice: design.product?.retailPrice ?? null,
    },
    optionNames: info.optionNames,
    options: info.options,
    variants: info.variants.map((v) => v.values),
    canMockup: viewNames.length > 0,
    mockupViews: viewNames,
    pricing,
  });
}
