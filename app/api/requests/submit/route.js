import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const { brand, sku, garment, notes, clientId } = await request.json();
  if (!garment || !clientId) return Response.json({ error: 'Missing required fields' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('product_requests').insert({
    client_id: clientId,
    brand: brand || null,
    sku: sku || null,
    garment_name: garment,
    notes: notes || null,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
