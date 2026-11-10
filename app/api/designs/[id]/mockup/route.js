import { getAuth, unauthorized, serviceDb } from '@/lib/apiAuth';
import { loadVariantInfo, colorOptionIndex } from '@/lib/designVariants';
import { isCustom } from '@/lib/customDesign';
import { buildColorMockups } from '@/lib/designMockups';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// A preview of the design on one color of shirt: /api/designs/<id>/mockup?color=Red&view=Front
export async function GET(request, { params }) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  const { id } = await params;
  const url = new URL(request.url);
  const color = url.searchParams.get('color');
  const view = url.searchParams.get('view') || undefined;
  const { data: design } = await serviceDb().from('saved_designs').select('id, product, decorations').eq('id', id).eq('client_id', auth.user.id).maybeSingle();
  if (!design) return Response.json({ error: 'Design not found' }, { status: 404 });
  if (isCustom(design)) return Response.json({ error: 'This product uses the pictures S&A uploaded.' }, { status: 404 });
  const info = await loadVariantInfo(design, auth.user.id);
  if (!info || colorOptionIndex(info.optionNames) < 0) return Response.json({ error: 'No colors for this product' }, { status: 404 });
  const idx = colorOptionIndex(info.optionNames);
  const colors = [...new Set(info.variants.map((v) => v.values[idx]))];
  if (!color || !colors.includes(color)) return Response.json({ error: 'Unknown color' }, { status: 400 });
  try {
    const built = await buildColorMockups({ design, info, colors: [color], userId: auth.user.id, onlyView: view });
    const hit = built?.items?.[0];
    if (!hit) return Response.json({ error: 'No preview available' }, { status: 404 });
    return new Response(hit.buffer, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=300' } });
  } catch (e) {
    return Response.json({ error: e.message || 'Could not build the preview' }, { status: 502 });
  }
}
