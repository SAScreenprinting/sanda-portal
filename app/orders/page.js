'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const STATUS = {
  'Awaiting Artwork': { color: '#a78bfa', step: 1, live: true },
  'Art Approved':     { color: '#60a5fa', step: 2, live: false },
  'In Production':    { color: '#ffc800', step: 3, live: true },
  'Quality Check':    { color: '#fb923c', step: 4, live: true },
  'Shipped':          { color: '#34d399', step: 5, live: false },
  'Delivered':        { color: '#9ca3af', step: 6, live: false },
};
const FILTERS = ['All', 'In Production', 'Awaiting Artwork', 'Shipped', 'Delivered'];
const BLANK_ORDER = { garment: '', quantity: '24', colors: '', decoration: 'Screen Print', notes: '' };
const DECO_OPTIONS = ['Screen Print', 'Embroidery', 'DTF', 'Sublimation', 'Heat Transfer', 'Vinyl'];

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(BLANK_ORDER);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [newNum, setNewNum] = useState('');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUserId(user.id);
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) setProfile(prof);

    const { data: dbOrders } = await supabase
      .from('orders').select('id, order_number, status, total_amount, created_at, notes')
      .eq('client_id', user.id).order('created_at', { ascending: false });

    if (dbOrders?.length) {
      const { data: items } = await supabase.from('order_items').select('order_id, description, quantity, decoration').in('order_id', dbOrders.map((o) => o.id));
      setOrders(dbOrders.map((o) => {
        const it = (items || []).filter((i) => i.order_id === o.id);
        const desc = it.length ? `${it[0].quantity}x ${it[0].description}${it[0].decoration ? ', ' + it[0].decoration : ''}` : 'Order items';
        return {
          id: o.id, number: o.order_number, product: desc, status: o.status,
          date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          total: o.total_amount ? `$${parseFloat(o.total_amount).toFixed(2)}` : '',
        };
      }));
    } else {
      setOrders([]);
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]); // eslint-disable-line react-hooks/set-state-in-effect

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  async function submitNewOrder(e) {
    e.preventDefault();
    setSubmitting(true); setMsg('');
    const res = await fetch('/api/orders/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: userId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || 'Something went wrong.'); setSubmitting(false); return; }
    setNewNum(data.orderNumber); setMsg('success');
    setTimeout(() => { setShowNew(false); setMsg(''); setNewNum(''); setForm(BLANK_ORDER); loadData(); }, 3000);
    setSubmitting(false);
  }

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <PortalShell active="orders" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Production</div>
          <h1>Orders</h1>
          <p>{loading ? 'Loading…' : `${orders.length} order${orders.length === 1 ? '' : 's'} total`}</p>
        </div>
        <button className="sp-btn sp-in" style={{ '--i': 1 }} onClick={() => setShowNew(true)}>New order <Arrow /></button>
      </header>

      <div className="sp-tabs sp-in" style={{ '--i': 2 }}>
        {FILTERS.map((f) => <button key={f} className={`sp-tab${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>

      <div className="sp-card sp-in" style={{ '--i': 3 }}>
        {loading ? <div className="sp-empty">Loading…</div>
          : filtered.length === 0 ? (
            <div className="sp-empty">
              <b>{orders.length === 0 ? 'No orders yet' : 'Nothing matches this filter'}</b>
              {orders.length === 0 ? 'When you place an order it will show up here.' : 'Try another status.'}
            </div>
          ) : filtered.map((o) => {
            const st = STATUS[o.status] || { color: '#9ca3af', step: 1, live: false };
            return (
              <a key={o.id} href={`/orders/${o.id}`} className="sp-order" style={{ gridTemplateColumns: '92px 1fr auto' }}>
                <span className="sp-order-no">{o.number}</span>
                <div>
                  <div className="sp-order-desc">{o.product}</div>
                  <div className="sp-order-date">{o.date}{o.total ? ` · ${o.total}` : ''}</div>
                  <div className="sp-steps" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className={k < st.step ? 'on' : ''} style={{ '--c': st.color, '--k': k }} />)}
                  </div>
                </div>
                <span className={`sp-chip${st.live ? ' live' : ''}`} style={{ '--c': st.color }}><i />{o.status}</span>
              </a>
            );
          })}
      </div>

      {showNew && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <div className="sp-dialog" style={{ maxWidth: 500 }}>
            <button className="sp-x" onClick={() => setShowNew(false)} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            {msg === 'success' ? (
              <div style={{ textAlign: 'center', padding: '14px 0 8px' }}>
                <h2>Order {newNum} created</h2>
                <p style={{ margin: 0 }}>We will reach out shortly to confirm details. Upload your artwork in the Artwork Library.</p>
              </div>
            ) : (
              <>
                <h2>New order</h2>
                <p>Tell us what you need and we will get back to you with a quote.</p>
                <form onSubmit={submitNewOrder}>
                  <div className="sp-field"><label>Garment / product *</label>
                    <input required value={form.garment} onChange={(e) => setForm((f) => ({ ...f, garment: e.target.value }))} placeholder="Gildan 5000 t-shirts, Bella Canvas 3001" /></div>
                  <div className="sp-two">
                    <div className="sp-field"><label>Quantity *</label>
                      <input required type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} /></div>
                    <div className="sp-field"><label>Decoration</label>
                      <select className="sp-select" value={form.decoration} onChange={(e) => setForm((f) => ({ ...f, decoration: e.target.value }))}>
                        {DECO_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                      </select></div>
                  </div>
                  <div className="sp-field"><label>Colors needed</label>
                    <input value={form.colors} onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))} placeholder="White, black, navy" /></div>
                  <div className="sp-field"><label>Notes / special instructions</label>
                    <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Rush order, deadline, print location, size breakdown" /></div>
                  {msg && msg !== 'success' && <div className="sp-msg err">{msg}</div>}
                  <button type="submit" disabled={submitting} className="sp-btn" style={{ width: '100%', justifyContent: 'center' }}>{submitting ? 'Submitting…' : 'Submit order request'} <Arrow /></button>
                  <p style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', margin: '14px 0 0' }}>We will confirm details and send a quote within 1 business day.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
