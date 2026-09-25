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
  const [show, setShow] = useState(false);

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
        <img src="/logo.png" alt="S&A" style={{ height: 64, display: 'block', margin: '0 auto 20px' }} />

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
            {[
              [pw, setPw, 'New password', true],
              [pw2, setPw2, 'Confirm new password', false],
            ].map(([val, set, ph, first]) => (
              <div key={ph} style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                  autoComplete="new-password" autoFocus={first} style={{ ...input, paddingRight: 46 }} />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
                  style={{ position: 'absolute', right: 0, top: 0, width: 46, height: 46, background: 'transparent', border: 'none', color: show ? '#ffc800' : '#8a8a93', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {show
                      ? <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" /><path d="M1 1l22 22" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
            ))}
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
