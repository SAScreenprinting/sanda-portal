import { getAuth, unauthorized, forbidden } from '@/lib/apiAuth';

const UPSTREAM = process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev';

// Admin only: start production or ship an order (the tracking number goes to the client's store)
export async function POST(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const { id } = await params;
  const body = await request.json();
  const res = await fetch(`${UPSTREAM}/portal/pod-orders/${encodeURIComponent(id)}`, {
    method: 'POST', headers: { 'x-portal-key': process.env.PORTAL_API_KEY || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  return Response.json(out, { status: res.status });
}
