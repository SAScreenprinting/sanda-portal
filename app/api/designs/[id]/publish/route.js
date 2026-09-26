import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';
import { decryptToken } from '@/lib/tokenCrypto';
import { publishProduct } from '@/lib/shopifyStore';

// Publish an approved design to one of the client's connected Shopify stores (saved as a draft unless they choose otherwise)
export async function POST(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { id } = await params;
  const { connectionId, title, description, price, draft } = await request.json();
  const db = serviceDb();
  const { data: design } = await db.from('saved_designs').select('id, name, product, decorations').eq('id', id).eq('client_id', auth.user.id).maybeSingle();
  if (!design) return Response.json({ error: 'Design not found' }, { status: 404 });
  if (!['Approved', 'In Setup', 'Live'].includes(design.product?.status)) return Response.json({ error: 'A design can be published once it is approved.' }, { status: 400 });
  const { data: conn } = await db.from('store_connections').select('*').eq('id', connectionId).eq('client_id', auth.user.id).maybeSingle();
  if (!conn) return Response.json({ error: 'Choose one of your connected stores.' }, { status: 400 });
  const p = Number.parseFloat(price);
  if (!(p > 0)) return Response.json({ error: 'Enter a price above zero.' }, { status: 400 });
  if (!String(title || '').trim()) return Response.json({ error: 'Enter a product title.' }, { status: 400 });
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
