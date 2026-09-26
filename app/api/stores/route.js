import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';
import { encryptToken } from '@/lib/tokenCrypto';
import { cleanDomain, checkStore } from '@/lib/shopifyStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { data } = await serviceDb().from('store_connections').select('id, platform, store_domain, status, created_at').eq('client_id', auth.user.id).order('created_at', { ascending: false });
  return Response.json({ stores: data || [] });
}

// Connect a Shopify store: the client pastes their store address and an Admin API access token
export async function POST(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { domain, token } = await request.json();
  const d = cleanDomain(domain);
  if (!d) return Response.json({ error: 'Enter your store address, like yourstore.myshopify.com.' }, { status: 400 });
  if (!token || String(token).length < 20) return Response.json({ error: 'Paste the Admin API access token.' }, { status: 400 });
  let shop;
  try { shop = await checkStore(d, String(token).trim()); }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
  const { error } = await serviceDb().from('store_connections').upsert(
    { client_id: auth.user.id, platform: 'shopify', store_domain: d, token_encrypted: encryptToken(String(token).trim()), status: 'connected' },
    { onConflict: 'client_id,platform,store_domain' },
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, name: shop.name });
}

export async function DELETE(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const id = new URL(request.url).searchParams.get('id');
  await serviceDb().from('store_connections').delete().eq('id', id).eq('client_id', auth.user.id);
  return Response.json({ ok: true });
}
