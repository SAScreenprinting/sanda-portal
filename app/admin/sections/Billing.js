'use client';
import { useMemo, useState } from 'react';
import { PageHead, Stat, Empty, Badge, money, fmtDate, clientName, useApi, downloadCsv } from './ui';
import { BUSINESS } from '@/lib/business';

const today = () => new Date(new Date().toDateString());
const statusOf = (i) => (i.paid ? 'paid' : i.due_date && new Date(i.due_date + 'T12:00:00') < today() ? 'overdue' : 'open');
const TONE = { paid: 'ok', overdue: 'bad', open: 'warn' };
const in30 = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };

export default function Billing() {
  const inv = useApi('/api/admin/invoices');
  const clientsApi = useApi('/api/profiles/list');
  const ordersApi = useApi('/api/admin/orders');
  const [filter, setFilter] = useState('open');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ client_id: '', order_id: '', amount: '', due_date: in30(), venmo_link: '', zelle_info: '', email: true });
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const invoices = inv.data?.invoices || [];
  const clients = clientsApi.data?.profiles || [];
  const orders = (ordersApi.data?.orders || []).filter((o) => o.client_id === form.client_id);

  const totals = useMemo(() => {
    const t = { outstanding: 0, overdue: 0, paid: 0, billed: 0 };
    for (const i of invoices) {
      const a = Number(i.amount || 0); t.billed += a;
      const s = statusOf(i);
      if (s === 'paid') t.paid += a; else { t.outstanding += a; if (s === 'overdue') t.overdue += a; }
    }
    return t;
  }, [invoices]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return invoices.filter((i) => {
      const s = statusOf(i);
      if (filter === 'open' && s === 'paid') return false;
      if ((filter === 'overdue' || filter === 'paid') && s !== filter) return false;
      return !t || [i.invoice_number, clientName(i.client), i.client?.email].some((v) => String(v || '').toLowerCase().includes(t));
    });
  }, [invoices, filter, q]);

  // Paid revenue by month (from the date each invoice was marked paid).
  const byMonth = useMemo(() => {
    const m = new Map();
    for (const i of invoices.filter((x) => x.paid && x.paid_at)) {
      const k = i.paid_at.slice(0, 7);
      m.set(k, (m.get(k) || 0) + Number(i.amount || 0));
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [invoices]);

  async function call(method, url, body) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const out = await res.json().catch(() => ({}));
    return { ok: res.ok, out };
  }

  async function create(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { ok, out } = await call('POST', '/api/admin/invoices', { ...form, email: undefined });
    if (!ok) { setMsg({ tone: 'bad', text: out.error || 'Could not create the invoice.' }); setBusy(false); return; }
    let text = `Invoice ${out.invoice.invoice_number} created. The client can see it in their Billing page.`;
    if (form.email) {
      const mail = await call('POST', '/api/notify/invoice', { invoiceId: out.invoice.id });
      text += mail.out.sent ? ' They were emailed.' : ` No email was sent${mail.out.reason ? ` (${mail.out.reason})` : ''}.`;
    }
    setMsg({ tone: 'ok', text });
    setCreating(false);
    setForm({ client_id: '', order_id: '', amount: '', due_date: in30(), venmo_link: '', zelle_info: '', email: true });
    await inv.reload();
    setBusy(false);
  }

  async function setPaid(i, paid) {
    const { ok, out } = await call('PATCH', '/api/admin/invoices', { id: i.id, paid });
    setMsg(ok ? { tone: 'ok', text: `${i.invoice_number} marked ${paid ? 'paid' : 'unpaid'}.` } : { tone: 'bad', text: out.error || 'Could not update.' });
    inv.reload();
  }

  async function remove(i) {
    if (!window.confirm(`Delete ${i.invoice_number}? The client will no longer see it.`)) return;
    const { ok, out } = await call('DELETE', `/api/admin/invoices?id=${encodeURIComponent(i.id)}`);
    setMsg(ok ? { tone: 'ok', text: `${i.invoice_number} deleted.` } : { tone: 'bad', text: out.error || 'Could not delete.' });
    inv.reload();
  }

  return (
    <div className="ad">
      <PageHead title="Billing" sub="Invoices your clients see and pay from their portal.">
        <button className="ad-btn" disabled={invoices.length === 0}
          onClick={() => downloadCsv('invoices.csv', [
            { label: 'Invoice', get: (i) => i.invoice_number }, { label: 'Client', get: (i) => clientName(i.client) }, { label: 'Amount', get: (i) => i.amount },
            { label: 'Due', get: (i) => i.due_date }, { label: 'Status', get: statusOf }, { label: 'Paid on', get: (i) => i.paid_at || '' }, { label: 'Created', get: (i) => i.created_at },
          ], shown)}>Export CSV</button>
        <button className="ad-btn ad-btn--primary" onClick={() => { setCreating(true); setMsg(null); }}>New invoice</button>
      </PageHead>

      {msg ? <div className={`ad-notice ad-notice--${msg.tone}`}>{msg.text}</div> : null}
      {inv.error ? <div className="ad-notice ad-notice--bad">{inv.error}</div> : null}

      <div className="ad-stats">
        <Stat label="Outstanding" value={money(totals.outstanding)} tone={totals.outstanding ? 'warn' : undefined} />
        <Stat label="Overdue" value={money(totals.overdue)} tone={totals.overdue ? 'bad' : undefined} />
        <Stat label="Paid" value={money(totals.paid)} tone="ok" />
        <Stat label="Total billed" value={money(totals.billed)} />
      </div>

      <div className="ad-toolbar">
        <input className="ad-input" style={{ minWidth: 240 }} placeholder="Search invoice or client" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="ad-chips">
          {[['open', 'Open'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['all', 'All']].map(([k, l]) => (
            <button key={k} className={`ad-chipbtn${filter === k ? ' on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="ad-card">
        {inv.loading ? <Empty title="Loading…" /> : invoices.length === 0 ? (
          <Empty title="No invoices yet">Create an invoice for a client and it appears in their Billing page.</Empty>
        ) : shown.length === 0 ? <Empty title="No invoices match">Try another filter or search.</Empty> : (
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead><tr><th>Invoice</th><th>Client</th><th className="ad-right">Amount</th><th>Due</th><th>Status</th><th /></tr></thead>
              <tbody>
                {shown.map((i) => {
                  const s = statusOf(i);
                  return (
                    <tr key={i.id}>
                      <td className="ad-strong">{i.invoice_number}</td>
                      <td>{clientName(i.client)}</td>
                      <td className="ad-right">{money(i.amount)}</td>
                      <td className="ad-muted">{fmtDate(i.due_date)}</td>
                      <td><Badge tone={TONE[s]}>{s === 'open' ? 'Open' : s === 'overdue' ? 'Overdue' : 'Paid'}</Badge></td>
                      <td className="ad-right" style={{ whiteSpace: 'nowrap' }}>
                        <button className="ad-btn ad-btn--sm" onClick={() => setViewing(i)}>View</button>{' '}
                        {s === 'paid'
                          ? <button className="ad-btn ad-btn--sm" onClick={() => setPaid(i, false)}>Mark unpaid</button>
                          : <button className="ad-btn ad-btn--sm" onClick={() => setPaid(i, true)}>Mark paid</button>}{' '}
                        <button className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => remove(i)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {byMonth.length > 0 ? (
        <>
          <h2 className="ad-section-title">Paid by month</h2>
          <div className="ad-card"><div className="ad-tablewrap"><table className="ad-table"><tbody>
            {byMonth.map(([k, v]) => (
              <tr key={k}><td className="ad-strong">{new Date(k + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td><td className="ad-right">{money(v)}</td></tr>
            ))}
          </tbody></table></div></div>
        </>
      ) : null}

      {creating ? (
        <div className="ad-overlay ad-overlay--center" onClick={() => !busy && setCreating(false)}>
          <form className="ad-modal" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <div className="ad-drawer-head"><h2>New invoice</h2><button type="button" className="ad-btn ad-btn--sm" onClick={() => setCreating(false)}>Close</button></div>
            <div className="ad-form">
              <div className="ad-field" style={{ gridColumn: '1 / -1' }}><label>Client</label>
                <select className="ad-select" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, order_id: '' })} required>
                  <option value="">Choose a client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{clientName(c)}</option>)}
                </select>
              </div>
              <div className="ad-field" style={{ gridColumn: '1 / -1' }}><label>For order (optional)</label>
                <select className="ad-select" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} disabled={!form.client_id}>
                  <option value="">Not tied to an order</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.order_number}</option>)}
                </select>
              </div>
              <div className="ad-field"><label>Amount ($)</label><input className="ad-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="ad-field"><label>Due date</label><input className="ad-input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required /></div>
              <div className="ad-field"><label>Venmo link (optional)</label><input className="ad-input" value={form.venmo_link} onChange={(e) => setForm({ ...form, venmo_link: e.target.value })} placeholder="https://venmo.com/…" /></div>
              <div className="ad-field"><label>Zelle email or phone (optional)</label><input className="ad-input" value={form.zelle_info} onChange={(e) => setForm({ ...form, zelle_info: e.target.value })} /></div>
              <label style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                <input type="checkbox" checked={form.email} onChange={(e) => setForm({ ...form, email: e.target.checked })} /> Email the client that this invoice is ready
              </label>
            </div>
            <div className="ad-actions" style={{ marginTop: 22 }}><button className="ad-btn ad-btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create invoice'}</button></div>
          </form>
        </div>
      ) : null}

      {viewing ? (
        <div className="ad-overlay ad-overlay--center" onClick={() => setViewing(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-print" style={{ color: '#111' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                <div><div style={{ fontSize: 20, fontWeight: 800 }}>{BUSINESS.name}</div><div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{BUSINESS.address}<br />{BUSINESS.phone} · {BUSINESS.email}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 22, fontWeight: 800 }}>INVOICE</div><div style={{ fontWeight: 700 }}>{viewing.invoice_number}</div></div>
              </div>
              <div style={{ margin: '22px 0', fontSize: 14, lineHeight: 1.7 }}>
                <b>Bill to</b><br />{clientName(viewing.client)}{viewing.client?.email ? <><br />{viewing.client.email}</> : null}
                <br /><br /><b>Issued</b> {fmtDate(viewing.created_at)} · <b>Due</b> {fmtDate(viewing.due_date)}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, margin: '8px 0 18px' }}>{money(viewing.amount)}</div>
              {viewing.paid ? <div style={{ fontWeight: 700 }}>PAID{viewing.paid_at ? ` on ${fmtDate(viewing.paid_at)}` : ''}</div> : (
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <b>How to pay</b><br />
                  {viewing.venmo_link ? <>Venmo: {viewing.venmo_link}<br /></> : null}
                  {viewing.zelle_info ? <>Zelle: {viewing.zelle_info}<br /></> : null}
                  {!viewing.venmo_link && !viewing.zelle_info ? <>Call {BUSINESS.phone} or email {BUSINESS.email} to arrange payment.</> : null}
                </div>
              )}
            </div>
            <div className="ad-actions" style={{ marginTop: 22 }}>
              <button className="ad-btn ad-btn--primary" onClick={() => window.print()}>Print</button>
              <button className="ad-btn" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
