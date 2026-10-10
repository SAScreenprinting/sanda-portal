'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { BUSINESS } from '@/lib/business';
import { PageHead } from './ui';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []);

  async function changePassword(e) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 8) { setMsg({ tone: 'bad', text: 'Use at least 8 characters.' }); return; }
    if (pw !== pw2) { setMsg({ tone: 'bad', text: 'The two passwords do not match.' }); return; }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg({ tone: 'bad', text: error.message });
    else { setMsg({ tone: 'ok', text: 'Password changed. Use it the next time you sign in.' }); setPw(''); setPw2(''); }
  }

  return (
    <div className="ad">
      <PageHead title="Settings" sub="Your admin account and business details." />
      {msg ? <div className={`ad-notice ad-notice--${msg.tone}`}>{msg.text}</div> : null}

      <div className="ad-card ad-card-pad" style={{ maxWidth: 560, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, marginBottom: 4 }}>Account</h2>
        <p className="ad-muted" style={{ margin: '0 0 16px', fontSize: 14 }}>Signed in as <b style={{ color: 'var(--ad-text)' }}>{email || '…'}</b></p>
        <form onSubmit={changePassword} className="ad-form" style={{ gridTemplateColumns: '1fr' }}>
          <div className="ad-field"><label>New password</label><input className="ad-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
          <div className="ad-field"><label>Confirm new password</label><input className="ad-input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
          <div><button className="ad-btn ad-btn--primary" disabled={busy || !pw}>{busy ? 'Saving…' : 'Change password'}</button></div>
        </form>
      </div>

      <div className="ad-card ad-card-pad" style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: 17, marginBottom: 14 }}>Business details</h2>
        <dl className="ad-kv" style={{ marginBottom: 0 }}>
          <dt>Name</dt><dd>{BUSINESS.name}</dd>
          <dt>Address</dt><dd>{BUSINESS.address}</dd>
          <dt>Phone</dt><dd>{BUSINESS.phone}</dd>
          <dt>Email</dt><dd>{BUSINESS.email}</dd>
        </dl>
        <p className="ad-muted" style={{ fontSize: 13, margin: '14px 0 0' }}>These appear on invoices and in the emails clients receive.</p>
      </div>
    </div>
  );
}
