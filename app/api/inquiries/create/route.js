import { getAuth, unauthorized, forbidden } from '@/lib/apiAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const auth = await getAuth();
    if (!auth.user) return unauthorized();
    const { title, body, clientId: requestedClient } = await req.json();
    const clientId = auth.isAdmin && requestedClient ? requestedClient : auth.user.id;
    if (!clientId || !title?.trim() || !body?.trim()) {
      return Response.json({ error: 'Title, description, and client are required.' }, { status: 400 });
    }

    // Generate inquiry number (INQ-0001 format)
    const { count } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true });
    const num = String((count || 0) + 1).padStart(4, '0');
    const inquiry_number = `INQ-${num}`;

    // Create inquiry
    const { data: inquiry, error: iErr } = await supabase
      .from('inquiries')
      .insert({ client_id: clientId, title: title.trim(), inquiry_number, status: 'open' })
      .select()
      .single();

    if (iErr) return Response.json({ error: iErr.message }, { status: 500 });

    // Insert opening message
    await supabase.from('inquiry_messages').insert({
      inquiry_id: inquiry.id,
      sender_id: clientId,
      body: body.trim(),
      is_admin: false,
    });

    // Update inquiry updated_at
    await supabase.from('inquiries').update({ updated_at: new Date().toISOString() }).eq('id', inquiry.id);

    return Response.json({ inquiry });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
