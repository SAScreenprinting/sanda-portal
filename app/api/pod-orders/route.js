import { getAuth, unauthorized, forbidden } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';
const UPSTREAM = process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev';

// Store orders for POD clients: admins see everyone's, a client sees only their own
export async function GET(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const url = new URL(request.url);
  const wantAll = url.searchParams.get('all') === 'true';
  if (wantAll && !auth.isAdmin) return forbidden();
  const qs = new URLSearchParams();
  if (!wantAll) qs.set('clientId', auth.user.id);
  const status = url.searchParams.get('status');
  if (status) qs.set('status', status);
  try {
    const res = await fetch(`${UPSTREAM}/portal/pod-orders?${qs}`, { headers: { 'x-portal-key': process.env.PORTAL_API_KEY || '' }, cache: 'no-store' });
    if (!res.ok) return Response.json({ orders: [] });
    return Response.json(await res.json());
  } catch {
    return Response.json({ orders: [] });
  }
}
