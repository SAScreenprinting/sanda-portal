import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: list artwork for a client or all artwork for admin
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const isAdmin  = searchParams.get('admin') === 'true';

    let query = supabase
      .from('artwork')
      .select('*, client:client_id ( business_name, contact_name )')
      .order('created_at', { ascending: false });

    if (!isAdmin && clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ artwork: data || [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
