import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const FINISHED = ['Delivered'];

// Admin dashboard numbers, all counted from the live tables (nothing is invented).
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const db = serviceDb();

  const [clients, orders, invoices, requests, inquiries, artwork, designs, samples] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', false),
    db.from('orders').select('id, status, created_at'),
    db.from('invoices').select('id, amount, paid, due_date'),
    db.from('product_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('inquiries').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
    db.from('artwork').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('saved_designs').select('id, product'),
    db.from('sample_orders').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
  ]);

  const today = new Date(new Date().toDateString());
  const orderRows = orders.data || [];
  const invoiceRows = invoices.data || [];
  const unpaid = invoiceRows.filter((i) => !i.paid);
  const overdue = unpaid.filter((i) => i.due_date && new Date(i.due_date) < today);
  const byStatus = {};
  for (const o of orderRows) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  return Response.json({
    clients: clients.count || 0,
    orders: {
      total: orderRows.length,
      open: orderRows.filter((o) => !FINISHED.includes(o.status)).length,
      awaitingArtwork: byStatus['Awaiting Artwork'] || 0,
      byStatus,
    },
    invoices: {
      unpaidCount: unpaid.length,
      unpaidTotal: unpaid.reduce((s, i) => s + Number(i.amount || 0), 0),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((s, i) => s + Number(i.amount || 0), 0),
      paidTotal: invoiceRows.filter((i) => i.paid).reduce((s, i) => s + Number(i.amount || 0), 0),
    },
    attention: {
      newRequests: requests.count || 0,
      openInquiries: inquiries.count || 0,
      artworkPending: artwork.count || 0,
      designsToReview: (designs.data || []).filter((d) => (d.product?.status || 'Submitted') === 'Submitted').length,
      sampleRequests: samples.count || 0,
    },
  });
}
