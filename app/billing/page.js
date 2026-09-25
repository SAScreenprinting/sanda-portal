'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const STATUS = {
  pending: { label: 'Pending', color: '#ffc800' },
  overdue: { label: 'Overdue', color: '#f87171' },
  paid: { label: 'Paid', color: '#34d399' },
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function invoiceStatus(inv) {
  if (inv.paid) return 'paid';
  if (inv.due_date && new Date(inv.due_date) < new Date(new Date().toDateString())) return 'overdue';
  return 'pending';
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Close = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6L6 18" /></svg>;

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState({ description: '', qty: '', notes: '' });
  const [quoteState, setQuoteState] = useState(''); // '' | sending | sent | error
  const [copied, setCopied] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);
      const { data } = await supabase.from('invoices').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
      setInvoices(data || []);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  async function sendQuote(e) {
    e.preventDefault();
    setQuoteState('sending');
    const body = [`What I need: ${quote.description}`, quote.qty ? `Quantity: ${quote.qty}` : '', quote.notes ? `Notes: ${quote.notes}` : ''].filter(Boolean).join('\n');
    const res = await fetch('/api/inquiries/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: userId, title: 'Quote request', body }),
    });
    if (!res.ok) { setQuoteState('error'); return; }
    setQuoteState('sent');
    setTimeout(() => { setShowQuote(false); setQuoteState(''); setQuote({ description: '', qty: '', notes: '' }); }, 2500);
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); });
  }

  const list = invoices || [];
  const outstanding = list.filter((i) => !i.paid).reduce((s, i) => s + Number(i.amount || 0), 0);
  const paidTotal = list.filter((i) => i.paid).reduce((s, i) => s + Number(i.amount || 0), 0);
  const overdueCount = list.filter((i) => invoiceStatus(i) === 'overdue').length;

  return (
    <PortalShell active="billing" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Account</div>
          <h1>Billing</h1>
          <p>Invoices and payments for your account.</p>
        </div>
        <button className="sp-btn sp-in" style={{ '--i': 1 }} onClick={() => setShowQuote(true)}>Request a quote <Arrow /></button>
      </header>

      <section className="sp-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="sp-card sp-stat sp-in" style={{ '--i': 1 }}>
          <div className="sp-label">Outstanding</div>
          <div className={`sp-num${outstanding > 0 ? ' is-accent' : ''}`}>{money(outstanding)}</div>
          <div className="sp-sub">{overdueCount > 0 ? `${overdueCount} overdue` : 'Nothing overdue'}</div>
        </div>
        <div className="sp-card sp-stat sp-in" style={{ '--i': 2 }}>
          <div className="sp-label">Paid to date</div>
          <div className="sp-num">{money(paidTotal)}</div>
          <div className="sp-sub">All time</div>
        </div>
        <div className="sp-card sp-stat sp-in" style={{ '--i': 3 }}>
          <div className="sp-label">Invoices</div>
          <div className="sp-num">{list.length}</div>
          <div className="sp-sub">{list.filter((i) => !i.paid).length} open</div>
        </div>
      </section>

      <div className="sp-card sp-in" style={{ '--i': 4 }}>
        <div className="sp-panel-head"><h2>Invoices</h2></div>
        {invoices === null ? <div className="sp-empty">Loading…</div>
          : list.length === 0 ? <div className="sp-empty"><b>No invoices yet</b>When S&amp;A bills you for an order, the invoice will show up here.</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table className="sp-table">
                <thead><tr><th>Invoice</th><th>Due</th><th>Amount</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {list.map((inv) => {
                    const st = STATUS[invoiceStatus(inv)];
                    return (
                      <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => setViewing(inv)}>
                        <td className="sp-order-no">{inv.invoice_number}</td>
                        <td style={{ color: 'var(--muted)' }}>{fmtDate(inv.due_date)}</td>
                        <td className="sp-money">{money(inv.amount)}</td>
                        <td><span className="sp-chip" style={{ '--c': st.color }}><i />{st.label}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="sp-link">View <Arrow /></span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {viewing && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setViewing(null)}>
          <div className="sp-dialog">
            <button className="sp-x" onClick={() => setViewing(null)} aria-label="Close"><Close /></button>
            <div className="sp-eyebrow">Invoice</div>
            <h2>{viewing.invoice_number}</h2>
            <p style={{ marginBottom: 16 }}>Due {fmtDate(viewing.due_date)}</p>
            <div className="sp-num" style={{ margin: '0 0 22px', fontSize: 38 }}>{money(viewing.amount)}</div>
            {viewing.pdf_url && <a href={viewing.pdf_url} target="_blank" rel="noopener noreferrer" className="sp-link" style={{ marginBottom: 20, display: 'inline-flex' }}>Download invoice <Arrow /></a>}

            {viewing.paid ? (
              <div className="sp-msg ok">Paid{viewing.paid_at ? ` on ${fmtDate(viewing.paid_at)}` : ''}. Thank you.</div>
            ) : (
              <>
                <div className="sp-label" style={{ margin: '4px 0 12px' }}>How to pay</div>
                {viewing.venmo_link && <a href={viewing.venmo_link} target="_blank" rel="noopener noreferrer" className="sp-btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>Pay with Venmo <Arrow /></a>}
                {viewing.zelle_info && (
                  <button className="sp-btn sp-btn--ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={() => copy(viewing.zelle_info, 'zelle')}>
                    {copied === 'zelle' ? 'Copied' : `Zelle: ${viewing.zelle_info}`}
                  </button>
                )}
                {!viewing.venmo_link && !viewing.zelle_info && (
                  <p style={{ margin: 0 }}>To arrange payment, call <a href="tel:+12019498343" style={{ color: 'var(--y)' }}>(201) 949-8343</a> or email <a href="mailto:sascreenprinting@outlook.com" style={{ color: 'var(--y)' }}>sascreenprinting@outlook.com</a> and mention {viewing.invoice_number}.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showQuote && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setShowQuote(false)}>
          <div className="sp-dialog">
            <button className="sp-x" onClick={() => setShowQuote(false)} aria-label="Close"><Close /></button>
            {quoteState === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '14px 0 8px' }}><h2>Quote request sent</h2><p style={{ margin: 0 }}>We will get back to you shortly. You can follow up in Messages.</p></div>
            ) : (
              <>
                <h2>Request a quote</h2>
                <p>Tell us what you need and we will send you pricing.</p>
                <form onSubmit={sendQuote}>
                  <div className="sp-field"><label>What do you need? *</label>
                    <input required value={quote.description} onChange={(e) => setQuote((q) => ({ ...q, description: e.target.value }))} placeholder="Custom hoodies with a back print" /></div>
                  <div className="sp-field"><label>Quantity</label>
                    <input value={quote.qty} onChange={(e) => setQuote((q) => ({ ...q, qty: e.target.value }))} placeholder="48" /></div>
                  <div className="sp-field"><label>Notes</label>
                    <textarea rows={3} value={quote.notes} onChange={(e) => setQuote((q) => ({ ...q, notes: e.target.value }))} placeholder="Deadline, colors, print locations" /></div>
                  {quoteState === 'error' && <div className="sp-msg err">Could not send that. Please try again.</div>}
                  <button type="submit" disabled={quoteState === 'sending'} className="sp-btn" style={{ width: '100%', justifyContent: 'center' }}>{quoteState === 'sending' ? 'Sending…' : 'Send request'} <Arrow /></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
