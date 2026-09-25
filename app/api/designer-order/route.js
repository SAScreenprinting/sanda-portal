import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

// A client finished a design in the studio: turn it into a portal order with its artwork attached.
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const d = await request.json();
  const quantity = parseInt(d.quantity, 10);
  if (!d.productTitle || !quantity || quantity < 1) return Response.json({ error: 'Missing design details' }, { status: 400 });

  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { count } = await db.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = `#${1100 + (count || 0)}`;

  const fees = (d.feeItems || []).map((f) => `${f.decorationMethodLabel} x ${f.quantity}`).join(', ');
  const notes = [
    'Submitted from the Design Studio. Pending S&A review.',
    `Design ID: ${d.designId}`,
    d.variantTitle ? `Variant: ${d.variantTitle}` : null,
    fees ? `Additional fees: ${fees}` : null,
  ].filter(Boolean).join('\n');

  const { data: order, error } = await db
    .from('orders')
    .insert({ client_id: user.id, order_number: orderNumber, status: 'Art Approved', notes })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const colors = (d.colorCounts || []).reduce((n, c) => n + (c.colorCount || 0), 0);
  await db.from('order_items').insert({
    order_id: order.id,
    description: d.variantTitle ? `${d.productTitle} - ${d.variantTitle}` : d.productTitle,
    quantity,
    decoration: d.hasScreenPrint ? 'Screen Print' : null,
    colors: colors || 1,
  });

  const files = (d.printFileUrls || []).map((f) => ({
    client_id: user.id,
    name: `${d.productTitle} - ${f.viewName} ${f.printAreaLabel}`.slice(0, 120),
    file_url: f.url,
    thumbnail: (d.previewImageUrls || {})[f.viewName] || null,
    file_type: 'PNG',
    tags: ['design-studio'],
    used_on: [order.id],
  }));
  if (files.length) await db.from('artwork').insert(files);
  await db.from('order_status_history').insert({ order_id: order.id, status: 'Art Approved', changed_by: user.id, note: 'Design submitted from the Design Studio' });

  return Response.json({ ok: true, orderId: order.id, orderNumber });
}
