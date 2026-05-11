import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const formData = await request.formData();
  const file     = formData.get('file');
  const clientId = formData.get('clientId');
  const orderId  = formData.get('orderId') || null;

  if (!file || !clientId) return Response.json({ error: 'Missing file or clientId' }, { status: 400 });

  const MAX_MB = 20;
  if (file.size > MAX_MB * 1024 * 1024) return Response.json({ error: `File too large (max ${MAX_MB}MB)` }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const ext      = file.name.split('.').pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path     = `${clientId}/${Date.now()}_${safeName}`;
  const bytes    = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from('artwork')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadErr) return Response.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('artwork').getPublicUrl(path);

  const { error: dbErr } = await supabase.from('artwork').insert({
    client_id: clientId,
    order_id:  orderId,
    file_name: file.name,
    file_url:  publicUrl,
    file_size: file.size,
    file_type: file.type,
    status:    'pending',
  });

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 });
  return Response.json({ ok: true, url: publicUrl });
}
