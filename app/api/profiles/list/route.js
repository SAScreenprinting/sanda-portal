import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: list all client profiles (admin use only)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, business_name, contact_name, email')
      .eq('is_admin', false)
      .order('business_name', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ profiles: data || [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
