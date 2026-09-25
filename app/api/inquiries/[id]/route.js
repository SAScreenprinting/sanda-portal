import { getAuth, unauthorized, forbidden } from '@/lib/apiAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: all messages in an inquiry thread
async function canAccess(auth, id) {
  if (!auth.user) return false;
  if (auth.isAdmin) return true;
  const { data } = await supabase.from('inquiries').select('client_id').eq('id', id).maybeSingle();
  return data?.client_id === auth.user.id;
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth.user) return unauthorized();
    if (!(await canAccess(auth, id))) return forbidden();
    const { data, error } = await supabase
      .from('inquiry_messages')
      .select('*, sender:sender_id ( business_name, contact_name, is_admin )')
      .eq('inquiry_id', id)
      .order('created_at', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ messages: data || [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// POST: add a reply to an inquiry thread
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    if (!auth.user) return unauthorized();
    if (!(await canAccess(auth, id))) return forbidden();
    const { body } = await req.json();
    const senderId = auth.user.id;
    const isAdmin = auth.isAdmin;
    if (!body?.trim()) {
      return Response.json({ error: 'senderId and body required' }, { status: 400 });
    }

    const { data: msg, error } = await supabase
      .from('inquiry_messages')
      .insert({ inquiry_id: id, sender_id: senderId, body: body.trim(), is_admin: isAdmin || false })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Update inquiry timestamp; if admin replied, move to in_progress unless resolved
    const statusUpdate = isAdmin ? { status: 'in_progress', updated_at: new Date().toISOString() } : { updated_at: new Date().toISOString() };
    await supabase.from('inquiries').update(statusUpdate).eq('id', id).neq('status', 'resolved');

    return Response.json({ message: msg });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
