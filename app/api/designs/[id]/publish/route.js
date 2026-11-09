import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';
import { decryptToken } from '@/lib/tokenCrypto';
import { publishProduct, publishProductVariants } from '@/lib/shopifyStore';
import { fetchProductVariants, variantKey } from '@/lib/designVariants';
import { buildVariantSkus } from '@/lib/designSku';

// Publish an approved design to one of the client's connected Shopify stores (saved as a draft unless they choose otherwise)
export async function POST(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { id } = await params;
  const { connectionId, title, description, price, draft, variants: chosen } = await request.json();
  const db = serviceDb();
  const { data: design } = await db.from('saved_designs').select('id, name, product, decorations').eq('id', id).eq('client_id', auth.user.id).maybeSingle();
  if (!design) return Response.json({ error: 'Design not found' }, { status: 404 });
  if (!['Approved', 'In Setup', 'Live'].includes(design.product?.status)) return Response.json({ error: 'A design can be published once it is approved.' }, { status: 400 });
  const { data: conn } = await db.from('store_connections').select('*').eq('id', connectionId).eq('client_id', auth.user.id).maybeSingle();
  if (!conn) return Response.json({ error: 'Choose one of your connected stores.' }, { status: 400 });
  const p = Number.parseFloat(price);
  if (!String(title || '').trim()) return Response.json({ error: 'Enter a product title.' }, { status: 400 });

  // Several colors/sizes at once: one product, every variant gets its own SKU from the design number.
  if (Array.isArray(chosen) && chosen.length > 0) {
    if (chosen.length > 250) return Response.json({ error: 'Choose 250 variants or fewer at a time.' }, { status: 400 });
    const info = await fetchProductVariants(design.product?.productId, auth.user.id);
    if (!info) return Response.json({ error: "Could not load this product's colors and sizes right now. Please try again." }, { status: 502 });
    const real = new Set(info.variants.map((v) => variantKey(v.values)));
    const seen = new Set();
    for (const c of chosen) {
      if (!Array.isArray(c.values) || !real.has(variantKey(c.values))) return Response.json({ error: 'One of the chosen colors or sizes is not available for this product.' }, { status: 400 });
      if (seen.has(variantKey(c.values))) return Response.json({ error: 'A color and size was chosen twice.' }, { status: 400 });
      seen.add(variantKey(c.values));
      if (!(Number.parseFloat(c.price) > 0)) return Response.json({ error: 'Every variant needs a price above zero.' }, { status: 400 });
    }
    const number = design.product?.designNumber;
    if (!number) return Response.json({ error: 'This design has no number yet.' }, { status: 400 });
    const skus = buildVariantSkus(number, info.optionNames, chosen.map((c) => c.values));
    try {
      const images = Object.values(design.decorations?.previews || {});
      const out = await publishProductVariants(conn.store_domain, decryptToken(conn.token_encrypted), {
        title: String(title).trim(), description: String(description || '').trim(), draft: draft !== false, images,
        optionNames: info.optionNames,
        variants: chosen.map((c, i) => ({ values: c.values, price: Number.parseFloat(c.price).toFixed(2), sku: skus[i] })),
      });
      await db.from('design_publications').insert({ design_id: id, connection_id: conn.id, external_id: out.id, external_url: out.adminUrl, price: Math.min(...chosen.map((c) => Number.parseFloat(c.price))) });
      return Response.json({ ok: true, adminUrl: out.adminUrl, variantCount: chosen.length });
    } catch (e) {
      return Response.json({ error: e.message || 'Could not publish.' }, { status: 502 });
    }
  }

  if (!(p > 0)) return Response.json({ error: 'Enter a price above zero.' }, { status: 400 });
  try {
    const images = Object.values(design.decorations?.previews || {});
    const out = await publishProduct(conn.store_domain, decryptToken(conn.token_encrypted), {
      title: String(title).trim(), description: String(description || '').trim(), price: p.toFixed(2),
      sku: design.product?.sku || design.name, images, draft: draft !== false,
    });
    await db.from('design_publications').insert({ design_id: id, connection_id: conn.id, external_id: out.id, external_url: out.adminUrl, price: p });
    return Response.json({ ok: true, adminUrl: out.adminUrl });
  } catch (e) {
    return Response.json({ error: e.message || 'Could not publish.' }, { status: 502 });
  }
}
