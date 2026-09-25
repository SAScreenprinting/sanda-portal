import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;
  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db.from('saved_designs').select('*').eq('id', id).eq('client_id', user.id).maybeSingle();
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ design: data });
}
