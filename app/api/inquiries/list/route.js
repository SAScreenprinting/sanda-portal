import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: list inquiries for a client, or all inquiries for admin
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const isAdmin  = searchParams.get('admin') === 'true';

    let query = supabase
      .from('inquiries')
      .select(`
        id, inquiry_number, title, status, created_at, updated_at, client_id,
        client:client_id ( business_name, contact_name ),
        last_message:inquiry_messages ( body, is_admin, created_at )
      `)
      .order('updated_at', { ascending: false });

    if (!isAdmin && clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Supabase returns last_message as array — pick the most recent one
    const inquiries = (data || []).map(inq => ({
      ...inq,
      last_message: inq.last_message?.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      )[0] ?? null,
    }));

    return Response.json({ inquiries });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: update inquiry status (admin only)
export async function PATCH(req) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return Response.json({ error: 'id and status required' }, { status: 400 });

    const { error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
