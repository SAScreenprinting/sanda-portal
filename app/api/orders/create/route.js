import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const { clientId, garment, quantity, colors, decoration, notes } = await request.json();
  if (!clientId || !garment || !quantity) return Response.json({ error: 'Missing required fields' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = `#${1100 + (count || 0)}`;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ client_id: clientId, order_number: orderNumber, status: 'Awaiting Artwork', notes: notes || null })
    .select()
    .single();

  if (orderErr) return Response.json({ error: orderErr.message }, { status: 500 });

  await supabase.from('order_items').insert({
    order_id:    order.id,
    description: garment,
    quantity:    parseInt(quantity),
    decoration:  decoration || null,
    colors:      colors || null,
  });

  return Response.json({ ok: true, orderId: order.id, orderNumber });
}
