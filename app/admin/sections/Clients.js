'use client';
import { useMemo, useState } from 'react';
import { PageHead, Empty, fmtDate, clientName, useApi } from './ui';

const BLANK = { email: '', password: '', business_name: '', contact_name: '', phone: '' };

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function Clients() {
  const { data, error, loading, reload } = useApi('/api/profiles/list');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [resetting, setResetting] = useState(null); // a client
  const [newPw, setNewPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { tone, text }

  const clients = data?.profiles || [];
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) => [c.business_name, c.contact_name, c.email, c.phone].some((v) => String(v || '').toLowerCase().includes(t)));
  }, [clients, q]);

  async function createClient(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/create-client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ tone: 'bad', text: body.error || 'Could not create the account.' });
      else {
        setMsg({ tone: 'ok', text: `Account created for ${form.email}. Send them their email and temporary password; they can change it in Settings.` });
        setForm(BLANK); setCreating(false); reload();
      }
    } catch { setMsg({ tone: 'bad', text: 'Network error. Try again.' }); }
    setBusy(false);
  }

  async function resetPassword(e) {
    e.preventDefault();
    if (newPw.length < 8) { setMsg({ tone: 'bad', text: 'Use at least 8 characters.' }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/reset-client-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: resetting.id, newPassword: newPw }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ tone: 'bad', text: body.error || 'Could not reset the password.' });
      else { setMsg({ tone: 'ok', text: `Password changed for ${clientName(resetting)}.` }); setResetting(null); setNewPw(''); }
    } catch { setMsg({ tone: 'bad', text: 'Network error. Try again.' }); }
    setBusy(false);
  }

  return (
    <div className="ad">
      <PageHead title="Clients" sub={loading ? 'Loading…' : `${clients.length} client account${clients.length === 1 ? '' : 's'}`}>
        <button className="ad-btn ad-btn--primary" onClick={() => { setCreating(true); setMsg(null); }}>New client</button>
      </PageHead>

      {msg ? <div className={`ad-notice ad-notice--${msg.tone}`}>{msg.text}</div> : null}
      {error ? <div className="ad-notice ad-notice--bad">{error}</div> : null}

      <div className="ad-toolbar">
        <input className="ad-input" style={{ minWidth: 260 }} placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="ad-card">
        {loading ? (
          <Empty title="Loading…" />
        ) : clients.length === 0 ? (
          <Empty title="No clients yet">Create the first client account and they can sign in to the portal.</Empty>
        ) : shown.length === 0 ? (
          <Empty title="No matches">Try a different search.</Empty>
        ) : (
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead><tr><th>Business</th><th>Contact</th><th>Email</th><th>Phone</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td className="ad-strong">{c.business_name || '—'}</td>
                    <td>{c.contact_name || '—'}</td>
                    <td className="ad-muted">{c.email}</td>
                    <td className="ad-muted">{c.phone || '—'}</td>
                    <td className="ad-muted">{fmtDate(c.created_at)}</td>
                    <td className="ad-right"><button className="ad-btn ad-btn--sm" onClick={() => { setResetting(c); setNewPw(''); setMsg(null); }}>Reset password</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating ? (
        <div className="ad-overlay ad-overlay--center" onClick={() => !busy && setCreating(false)}>
          <form className="ad-modal" onClick={(e) => e.stopPropagation()} onSubmit={createClient}>
            <div className="ad-drawer-head"><h2>New client</h2><button type="button" className="ad-btn ad-btn--sm" onClick={() => setCreating(false)}>Close</button></div>
            <div className="ad-form">
              <div className="ad-field"><label>Business name</label><input className="ad-input" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required /></div>
              <div className="ad-field"><label>Contact name</label><input className="ad-input" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required /></div>
              <div className="ad-field"><label>Email</label><input className="ad-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="ad-field"><label>Phone</label><input className="ad-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="ad-field" style={{ gridColumn: '1 / -1' }}>
                <label>Temporary password</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="ad-input" style={{ flex: 1 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                  <button type="button" className="ad-btn" onClick={() => setForm({ ...form, password: randomPassword() })}>Generate</button>
                </div>
              </div>
            </div>
            <div className="ad-actions" style={{ marginTop: 22 }}>
              <button className="ad-btn ad-btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            </div>
          </form>
        </div>
      ) : null}

      {resetting ? (
        <div className="ad-overlay ad-overlay--center" onClick={() => !busy && setResetting(null)}>
          <form className="ad-modal" onClick={(e) => e.stopPropagation()} onSubmit={resetPassword}>
            <div className="ad-drawer-head"><h2>Reset password</h2><button type="button" className="ad-btn ad-btn--sm" onClick={() => setResetting(null)}>Close</button></div>
            <p className="ad-muted" style={{ marginTop: 0 }}>Set a new password for <b style={{ color: 'var(--ad-text)' }}>{clientName(resetting)}</b>. Share it with them privately.</p>
            <div className="ad-field">
              <label>New password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="ad-input" style={{ flex: 1 }} value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={8} required />
                <button type="button" className="ad-btn" onClick={() => setNewPw(randomPassword())}>Generate</button>
              </div>
            </div>
            <div className="ad-actions" style={{ marginTop: 22 }}>
              <button className="ad-btn ad-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
