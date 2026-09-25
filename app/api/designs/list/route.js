import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { getAuth, forbidden } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const wantAdmin = new URL(request.url).searchParams.get('admin') === 'true';
  if (wantAdmin) {
    const auth = await getAuth();
    if (!auth.isAdmin) return forbidden();
    const dbAll = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: all, error: e2 } = await dbAll.from('saved_designs')
      .select('id, name, thumbnail, product, decorations, created_at, client_id, client:client_id ( business_name, contact_name, email )')
      .order('created_at', { ascending: false }).limit(500);
    if (e2) return Response.json({ error: e2.message }, { status: 500 });
    return Response.json({ designs: all || [] });
  }
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '100', 10) || 100, 200);
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await db.from('saved_designs')
    .select('id, name, thumbnail, product, created_at')
    .eq('client_id', user.id).order('created_at', { ascending: false }).limit(limit);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ designs: data || [] });
}
