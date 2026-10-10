'use client';
import { useMemo, useState } from 'react';
import { PageHead, Empty, Badge, money, fmtDate, clientName, useApi, downloadCsv } from './ui';

const TONE = { 'Awaiting Artwork': 'warn', 'Art Approved': 'info', 'In Production': 'info', 'Quality Check': 'info', Shipped: 'ok', Delivered: 'ok' };
const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Other'];

const summary = (o) => {
  const it = o.items || [];
  if (it.length === 0) return 'No items';
  const first = `${it[0].quantity}× ${it[0].description || 'Items'}`;
  return it.length > 1 ? `${first} + ${it.length - 1} more` : first;
};

export default function Orders() {
  const { data, error, loading, reload } = useApi('/api/admin/orders');
  const [filter, setFilter] = useState('open'); // open | all | a status
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState({ status: '', tracking_number: '', tracking_carrier: 'USPS', note: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const statuses = data?.statuses || [];
  const orders = data?.orders || [];
  const open = orders.find((o) => o.id === openId) || null;

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === 'open' && o.status === 'Delivered') return false;
      if (filter !== 'open' && filter !== 'all' && o.status !== filter) return false;
      if (!t) return true;
      return [o.order_number, clientName(o.client), o.client?.email, summary(o)].some((v) => String(v || '').toLowerCase().includes(t));
    });
  }, [orders, filter, q]);

  function openOrder(o) {
    setOpenId(o.id); setMsg(null);
    setDraft({ status: o.status, tracking_number: o.tracking_number || '', tracking_carrier: o.tracking_carrier || 'USPS', note: '' });
  }

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: open.id, status: draft.status, tracking_number: draft.tracking_number, tracking_carrier: draft.tracking_carrier, note: draft.note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ tone: 'bad', text: body.error || 'Could not save.' }); setBusy(false); return; }

      let note = 'Saved. The client sees this on their order page.';
      if (body.statusChanged) {
        // Email the client about the new status (skipped quietly if email is not configured).
        const mail = await fetch('/api/notify/order-status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: open.id, newStatus: draft.status, trackingNumber: draft.tracking_number || undefined }),
        }).then((r) => r.json()).catch(() => ({}));
        note += mail.sent ? ' They were emailed.' : ' No email was sent' + (mail.reason ? ` (${mail.reason}).` : '.');
      }
      setMsg({ tone: 'ok', text: note });
      await reload();
    } catch { setMsg({ tone: 'bad', text: 'Network error. Try again.' }); }
    setBusy(false);
  }

  const counts = useMemo(() => {
    const c = {};
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  return (
    <div className="ad">
      <PageHead title="Orders" sub={loading ? 'Loading…' : `${orders.length} order${orders.length === 1 ? '' : 's'} from your clients`}>
        <button
          className="ad-btn"
          disabled={orders.length === 0}
          onClick={() => downloadCsv('orders.csv',
            [
              { label: 'Order', get: (o) => o.order_number }, { label: 'Client', get: (o) => clientName(o.client) }, { label: 'Email', get: (o) => o.client?.email },
              { label: 'Items', get: summary }, { label: 'Status', get: (o) => o.status }, { label: 'Total', get: (o) => o.total_amount ?? '' },
              { label: 'Tracking', get: (o) => o.tracking_number || '' }, { label: 'Placed', get: (o) => o.created_at },
            ], shown)}
        >Export CSV</button>
      </PageHead>

      {error ? <div className="ad-notice ad-notice--bad">{error}</div> : null}

      <div className="ad-toolbar">
        <input className="ad-input" style={{ minWidth: 240 }} placeholder="Search order, client or item" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="ad-chips">
          {[['open', 'Open'], ['all', 'All'], ...statuses.map((s) => [s, `${s}${counts[s] ? ` (${counts[s]})` : ''}`])].map(([k, label]) => (
            <button key={k} className={`ad-chipbtn${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <Empty title="Loading…" />
        ) : orders.length === 0 ? (
          <Empty title="No orders yet">When a client places an order in the portal, it shows up here.</Empty>
        ) : shown.length === 0 ? (
          <Empty title="No orders match">Try another filter or search.</Empty>
        ) : (
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead><tr><th>Order</th><th>Client</th><th>Items</th><th>Status</th><th className="ad-right">Total</th><th>Placed</th></tr></thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id} onClick={() => openOrder(o)} style={{ cursor: 'pointer' }}>
                    <td className="ad-strong">{o.order_number}{o.rush ? <span style={{ marginLeft: 8 }}><Badge tone="bad">Rush</Badge></span> : null}</td>
                    <td>{clientName(o.client)}</td>
                    <td className="ad-muted">{summary(o)}</td>
                    <td><Badge tone={TONE[o.status]}>{o.status}</Badge></td>
                    <td className="ad-right">{o.total_amount != null ? money(o.total_amount) : '—'}</td>
                    <td className="ad-muted">{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open ? (
        <div className="ad-overlay" onClick={() => !busy && setOpenId(null)}>
          <aside className="ad-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ad-drawer-head">
              <div><h2>Order {open.order_number}</h2><div className="ad-muted" style={{ marginTop: 4 }}>{clientName(open.client)}</div></div>
              <button className="ad-btn ad-btn--sm" onClick={() => setOpenId(null)}>Close</button>
            </div>

            {msg ? <div className={`ad-notice ad-notice--${msg.tone}`}>{msg.text}</div> : null}

            <dl className="ad-kv">
              <dt>Placed</dt><dd>{fmtDate(open.created_at)}</dd>
              <dt>Email</dt><dd>{open.client?.email || '—'}</dd>
              {open.notes ? (<><dt>Client notes</dt><dd>{open.notes}</dd></>) : null}
            </dl>

            <div className="ad-section-title">Items</div>
            {(open.items || []).length === 0 ? <p className="ad-muted">No items on this order.</p> : (
              <div style={{ display: 'grid', gap: 8 }}>
                {open.items.map((i) => (
                  <div key={i.id} className="ad-card ad-card-pad" style={{ padding: '12px 14px' }}>
                    <div className="ad-strong">{i.quantity}× {i.description || 'Items'}</div>
                    <div className="ad-muted" style={{ fontSize: 13, marginTop: 2 }}>{[i.decoration, i.colors, i.placement].filter(Boolean).join(' · ') || 'No decoration details'}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="ad-section-title">Update this order</div>
            <div className="ad-form" style={{ gridTemplateColumns: '1fr' }}>
              <div className="ad-field">
                <label>Status</label>
                <select className="ad-select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10 }}>
                <div className="ad-field"><label>Carrier</label>
                  <select className="ad-select" value={draft.tracking_carrier} onChange={(e) => setDraft({ ...draft, tracking_carrier: e.target.value })}>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div className="ad-field"><label>Tracking number</label>
                  <input className="ad-input" value={draft.tracking_number} onChange={(e) => setDraft({ ...draft, tracking_number: e.target.value })} placeholder="Add when it ships" />
                </div>
              </div>
              <div className="ad-field"><label>Note for the history (optional)</label>
                <input className="ad-input" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              </div>
            </div>
            <div className="ad-actions" style={{ marginTop: 18 }}>
              <button className="ad-btn ad-btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
            <p className="ad-muted" style={{ fontSize: 12.5, marginTop: 10 }}>Changing the status updates what the client sees and emails them.</p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
