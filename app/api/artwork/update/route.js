import { getAuth, unauthorized, forbidden } from '@/lib/apiAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PATCH: update artwork status, label, or admin notes
export async function PATCH(req) {
  try {
    const auth = await getAuth();
    if (!auth.user) return unauthorized();
    if (!auth.isAdmin) return forbidden();
    const { id, status, label, admin_notes } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const update = {};
    if (status      !== undefined) update.status      = status;
    if (label       !== undefined) update.label       = label;
    if (admin_notes !== undefined) update.admin_notes = admin_notes;

    if (Object.keys(update).length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { error } = await supabase.from('artwork').update(update).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
