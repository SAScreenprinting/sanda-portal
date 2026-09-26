'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

export default function StoresPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [stores, setStores] = useState(null);
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/stores', { cache: 'no-store' }).then((r) => r.json()).then((d) => setStores(d.stores || [])).catch(() => setStores([]));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      load();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  async function connect(e) {
    e.preventDefault(); setBusy(true); setMsg('');
    const res = await fetch('/api/stores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain, token }) });
    const out = await res.json();
    if (res.ok) { setMsg(`ok:Connected to ${out.name}.`); setDomain(''); setToken(''); load(); }
    else setMsg(`err:${out.error}`);
    setBusy(false);
  }

  async function disconnect(id) {
    if (!confirm('Disconnect this store? Products already published stay in your store.')) return;
    await fetch(`/api/stores?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <PortalShell active="stores" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Your POD profile</div>
          <h1>Stores</h1>
          <p>Connect your online store so approved designs can be published to it.</p>
        </div>
      </header>

      <div className="sp-cols">
        <div className="sp-card sp-in" style={{ '--i': 1 }}>
          <div className="sp-panel-head"><h2>Connected stores</h2></div>
          {stores === null ? <div className="sp-empty">Loading…</div>
            : stores.length === 0 ? <div className="sp-empty"><b>No store connected</b>Use the form to connect your Shopify store.</div>
            : stores.map((s) => (
              <div key={s.id} className="sp-file" style={{ cursor: 'default' }}>
                <span><b style={{ fontFamily: 'var(--font-sora)' }}>{s.store_domain}</b><br /><small style={{ color: 'var(--muted)' }}>Shopify · connected {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small></span>
                <button className="sp-btn sp-btn--ghost" style={{ padding: '9px 14px' }} onClick={() => disconnect(s.id)}>Disconnect</button>
              </div>
            ))}
        </div>

        <div className="sp-card sp-in" style={{ '--i': 2, alignSelf: 'start' }}>
          <div className="sp-panel-head"><h2>Connect Shopify</h2></div>
          <form className="sp-pad" onSubmit={connect}>
            <div className="sp-field"><label>Store address</label><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourstore.myshopify.com" required /></div>
            <div className="sp-field"><label>Admin API access token</label><input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="shpat_…" autoComplete="off" required /></div>
            {msg && <div className={`sp-msg ${msg.startsWith('ok:') ? 'ok' : 'err'}`}>{msg.slice(msg.indexOf(':') + 1)}</div>}
            <button className="sp-btn" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Connect store'}</button>
            <p style={{ color: 'var(--dim)', fontSize: 12.5, lineHeight: 1.6, margin: '16px 0 0' }}>Your token is encrypted and only used to add products you choose to publish.</p>
          </form>
        </div>
      </div>

      <div className="sp-card sp-in" style={{ '--i': 3, marginTop: 14 }}>
        <div className="sp-panel-head"><h2>How to get your access token</h2></div>
        <ol className="sp-pad" style={{ margin: 0, paddingLeft: 42, color: '#dcdce2', fontSize: 14.5, lineHeight: 1.9 }}>
          <li>In your Shopify admin, open <b>Settings → Apps and sales channels → Develop apps</b>.</li>
          <li>Click <b>Create an app</b> and give it a name like &quot;S&amp;A POD&quot;.</li>
          <li>Open <b>Configuration</b> and choose <b>Admin API integration</b>. Turn on <b>write_products</b> and <b>read_products</b>, then save.</li>
          <li>Click <b>Install app</b>, then <b>Reveal token once</b> and copy the token that starts with <b>shpat_</b>.</li>
          <li>Paste your store address and the token here.</li>
        </ol>
      </div>
    </PortalShell>
  );
}
