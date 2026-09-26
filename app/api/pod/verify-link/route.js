import { isPortalKey, parseLinkCode } from '@/lib/podLink';
import { serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// Called by the Shopify app: is this connection code real, and whose is it?
export async function GET(request) {
  if (!isPortalKey(request)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const id = parseLinkCode(new URL(request.url).searchParams.get('code'));
  if (!id) return Response.json({ error: 'Invalid code' }, { status: 400 });
  const { data } = await serviceDb().from('profiles').select('id, business_name, contact_name').eq('id', id).maybeSingle();
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ clientId: data.id, name: data.business_name || data.contact_name || 'S&A POD client' });
}
