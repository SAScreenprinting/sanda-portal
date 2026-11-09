import { isPortalKey } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// The Shopify app tells the portal when it added a design to a client's store (so the portal can show it as published).
export async function POST(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { clientId, designId, externalId, externalUrl, price } = await request.json().catch(() => ({}));
  if (!clientId || !designId) return Response.json({ error: 'Missing details' }, { status: 400 });
  const db = serviceDb();
  const { data: design } = await db.from('saved_designs').select('id').eq('id', designId).eq('client_id', clientId).maybeSingle();
  if (!design) return Response.json({ error: 'Design not found' }, { status: 404 });
  const p = Number.parseFloat(price);
  const { error } = await db.from('design_publications').insert({ design_id: designId, connection_id: null, external_id: externalId || null, external_url: externalUrl || null, price: p > 0 ? p : null });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
