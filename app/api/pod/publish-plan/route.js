import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';
import { loadVariantInfo, variantKey, colorOptionIndex } from '@/lib/designVariants';
import { isCustom, customColorPictures } from '@/lib/customDesign';
import { buildVariantSkus } from '@/lib/designSku';
import { colorHexes, mockupViews } from '@/lib/designMockups';
import { mockupUrl } from '@/lib/podMockupUrl';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const READY = ['Approved', 'In Setup', 'Live'];
const MAX_VARIANTS = 250;

// For the Shopify app: the chosen colors/sizes turned into SKUs plus links to the color pictures, ready to create the product with.
export async function POST(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { clientId, designId, selected, mockups = true } = await request.json().catch(() => ({}));
  if (!clientId || !designId || !Array.isArray(selected) || selected.length === 0) return Response.json({ error: 'Choose at least one color or size.' }, { status: 400 });
  if (selected.length > MAX_VARIANTS) return Response.json({ error: `Choose ${MAX_VARIANTS} variants or fewer at a time.` }, { status: 400 });

  const db = serviceDb();
  const { data: design } = await db.from('saved_designs').select('id, name, product, decorations').eq('id', designId).eq('client_id', clientId).maybeSingle();
  if (!design || !READY.includes(design.product?.status)) return Response.json({ error: 'Design not found' }, { status: 404 });
  const number = design.product?.designNumber;
  if (!number) return Response.json({ error: 'This design has no number yet.' }, { status: 400 });

  const info = await loadVariantInfo(design, clientId);
  if (!info) return Response.json({ error: "Could not load this product's colors and sizes right now. Please try again." }, { status: 502 });
  const real = new Set(info.variants.map((v) => variantKey(v.values)));
  const seen = new Set();
  for (const values of selected) {
    const k = Array.isArray(values) ? variantKey(values) : null;
    if (!k || !real.has(k)) return Response.json({ error: 'One of the chosen colors or sizes is not available for this product.' }, { status: 400 });
    if (seen.has(k)) return Response.json({ error: 'A color and size was chosen twice.' }, { status: 400 });
    seen.add(k);
  }
  const skus = buildVariantSkus(number, info.optionNames, selected);
  const variants = selected.map((values, i) => ({ values, sku: skus[i] }));

  // Color pictures: one link per chosen color per view
  let media = [];
  let mockupNote = null;
  const colorIdx = colorOptionIndex(info.optionNames);
  if (mockups !== false && colorIdx >= 0 && isCustom(design)) {
    // Hand-built product: use the picture uploaded for each chosen color (its link is already public)
    const colors = [...new Set(selected.map((v) => v[colorIdx]))];
    media = customColorPictures(design, colors).map((p) => ({ color: p.color, view: p.view, hex: '', url: p.url }));
    if (media.length === 0) mockupNote = 'No color pictures were uploaded for this product, so the design picture was used.';
  } else if (mockups !== false && colorIdx >= 0) {
    try {
      const views = await mockupViews(design, clientId);
      if (views.length === 0) mockupNote = 'This product has no shirt picture to build color pictures from.';
      else {
        const colors = [...new Set(selected.map((v) => v[colorIdx]))];
        const hexes = await colorHexes(info, colors);
        const origin = new URL(request.url).origin;
        media = colors.flatMap((color) => views.map((v) => ({
          color, view: v.name, hex: hexes[color],
          url: mockupUrl(origin, { designId: design.id, color, view: v.name, hex: hexes[color] }),
        })));
      }
    } catch (e) {
      media = [];
      mockupNote = 'The color pictures could not be prepared (' + (e.message || 'error') + ').';
    }
  }

  return Response.json({
    designName: design.name,
    optionNames: info.optionNames,
    colorIndex: colorIdx,
    variants,
    media,
    fallbackImages: Object.values(design.decorations?.previews || {}),
    mockupNote,
  });
}
