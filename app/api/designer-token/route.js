import { createHmac } from 'node:crypto';
import { createClient } from '@/lib/supabase-server';

// Short-lived token that lets the browser upload large print files straight to the designer server.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  if (!process.env.PORTAL_API_KEY) return Response.json({ error: 'Designer is not configured' }, { status: 503 });
  const exp = Date.now() + 60 * 60 * 1000;
  const sig = createHmac('sha256', process.env.PORTAL_API_KEY).update(`upload:${exp}`).digest('hex');
  return Response.json({ token: `${exp}.${sig}`, url: `${process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev'}/uploads` });
}
