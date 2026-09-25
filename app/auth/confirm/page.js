'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

// Landing page for emailed links. Step 1 confirms the link (a button click, so mail scanners
// that pre-open links can't use it up). For password resets, step 2 asks for the new password
// right here, then sends the person into the portal.
export default function ConfirmPage() {
  const [params, setParams] = useState(null);
  const [stage, setStage] = useState('confirm'); // confirm | password | done
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams({ token_hash: p.get('token_hash'), type: p.get('type') });
  }, []);

  async function verify() {
    setBusy(true); setError('');
    const res = await fetch('/api/auth/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Something went wrong.'); setBusy(false); return;
    }
    if (params.type === 'recovery') { setStage('password'); setBusy(false); return; }
    window.location.href = '/dashboard';
  }

  async function savePassword(e) {
    e.preventDefault();
    setError('');
    if (pw.length < 8) return setError('Use at least 8 characters.');
    if (pw !== pw2) return setError('The two passwords don’t match.');
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ password: pw });
    if (err) { setError(err.message || 'Could not save your password.'); setBusy(false); return; }
    setStage('done');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1200);
  }

  const input = { width: '100%', padding: '13px 14px', background: '#0b0b0b', border: '1px solid #2e2e2e', color: '#fff', fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none' };
  const btn = { width: '100%', padding: '14px 0', background: '#ffc800', color: '#000', border: 'none', fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#000', border: '1px solid #2e2e2e', borderTop: '4px solid #ffc800', padding: '36px 32px', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="S&A" style={{ height: 64, marginBottom: 20 }} />

        {stage === 'confirm' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>Continue to your portal</h1>
            <p style={{ color: '#9a9aa3', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              {params?.type === 'recovery' ? 'Select the button below to confirm it’s you, then choose a new password.' : 'Select the button below to continue.'}
            </p>
            {error && <div style={{ color: '#ff9a9a', fontSize: 13, margin: '0 0 16px' }}>{error} <a href="/" style={{ color: '#ffc800' }}>Back to sign in</a></div>}
            <button onClick={verify} disabled={!params?.token_hash || busy} style={btn}>{busy ? 'One moment…' : 'Continue'}</button>
          </>
        )}

        {stage === 'password' && (
          <form onSubmit={savePassword} style={{ textAlign: 'left' }}>
            <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>Choose a new password</h1>
            <p style={{ color: '#9a9aa3', fontSize: 14, lineHeight: 1.6, margin: '0 0 22px', textAlign: 'center' }}>Use at least 8 characters.</p>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" autoComplete="new-password" autoFocus style={input} />
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" style={input} />
            {error && <div style={{ color: '#ff9a9a', fontSize: 13, margin: '0 0 14px' }}>{error}</div>}
            <button type="submit" disabled={busy} style={btn}>{busy ? 'Saving…' : 'Save and go to my portal'}</button>
          </form>
        )}

        {stage === 'done' && (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>Password updated</h1>
            <p style={{ color: '#9a9aa3', fontSize: 14, margin: 0 }}>Taking you to your portal…</p>
          </>
        )}
      </div>
    </div>
  );
}
