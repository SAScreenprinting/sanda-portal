import { createClient } from '@/lib/supabase-server';

// The design studio talks to /apps/designer/* (the same paths the Shopify storefront uses).
// Here those calls are passed through to the designer server, but only for signed-in portal
// users, and with the shared secret added server-side so it never reaches the browser.
export const dynamic = 'force-dynamic';

const UPSTREAM = process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev';

async function forward(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  if (!process.env.PORTAL_API_KEY) return Response.json({ error: 'Designer is not configured' }, { status: 503 });

  const { path } = await params;
  const url = new URL(request.url);
  const target = new URL(`${UPSTREAM}/${path.map(encodeURIComponent).join('/')}`);
  url.searchParams.forEach((v, k) => { if (k !== 'logged_in_customer_id') target.searchParams.set(k, v); });
  target.searchParams.set('logged_in_customer_id', `portal-${user.id}`);

  const headers = new Headers();
  const type = request.headers.get('content-type');
  if (type) headers.set('content-type', type);
  headers.set('x-portal-key', process.env.PORTAL_API_KEY);

  const init = { method: request.method, headers, cache: 'no-store' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();

  const res = await fetch(target, init);
  const out = new Headers();
  ['content-type', 'cache-control'].forEach((h) => { const v = res.headers.get(h); if (v) out.set(h, v); });
  return new Response(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status, headers: out });
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE };
