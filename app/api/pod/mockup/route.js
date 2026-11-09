import { serviceDb } from '@/lib/apiAuth';
import { verifyMockupParams } from '@/lib/podMockupUrl';
import { renderViewMockup } from '@/lib/designMockups';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// One color picture of a design. Only reachable with a link signed by publish-plan; Shopify downloads these into the store.
export async function GET(request) {
  const p = verifyMockupParams(new URL(request.url).searchParams);
  if (!p) return new Response('Not found', { status: 404 });
  const { data: design } = await serviceDb().from('saved_designs').select('id, client_id, product, decorations').eq('id', p.designId).maybeSingle();
  if (!design) return new Response('Not found', { status: 404 });
  try {
    const buf = await renderViewMockup({ design, view: p.view, hex: p.hex, userId: design.client_id });
    if (!buf) return new Response('Not found', { status: 404 });
    return new Response(buf, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return new Response('Could not build the picture', { status: 502 });
  }
}
