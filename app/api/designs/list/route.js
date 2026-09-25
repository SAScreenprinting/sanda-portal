import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '100', 10) || 100, 200);
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await db.from('saved_designs')
    .select('id, name, thumbnail, product, created_at')
    .eq('client_id', user.id).order('created_at', { ascending: false }).limit(limit);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ designs: data || [] });
}
