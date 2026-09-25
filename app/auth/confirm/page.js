'use client';
import { useEffect, useState } from 'react';

export default function ConfirmPage() {
  const [params, setParams] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams({ token_hash: p.get('token_hash'), type: p.get('type'), next: p.get('next') || '/dashboard' });
  }, []);

  async function go() {
    setBusy(true); setError('');
    const res = await fetch('/api/auth/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
    if (res.ok) { window.location.href = params.next.startsWith('/') ? params.next : '/dashboard'; return; }
    const d = await res.json().catch(() => ({}));
    setError(d.error || 'Something went wrong.'); setBusy(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0d', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#111113', border: '1px solid #2a2a30', borderTop: '4px solid #e8a020', padding: '36px 32px', textAlign: 'center' }}>
        <img src="/logo.png" alt="S&A" style={{ height: 64, marginBottom: 20 }} />
        <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 8px' }}>Continue to your portal</h1>
        <p style={{ color: '#9a9aa3', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>Select the button below to confirm and choose your new password.</p>
        {error && <div style={{ color: '#ff9a9a', fontSize: 13, margin: '0 0 16px' }}>{error} <a href="/" style={{ color: '#e8a020' }}>Back to sign in</a></div>}
        <button onClick={go} disabled={!params?.token_hash || busy}
          style={{ width: '100%', padding: '14px 0', background: '#e8a020', color: '#0b0b0d', border: 'none', fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>
          {busy ? 'One moment…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
