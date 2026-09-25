'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const STATUS_COLORS = { Submitted: '#ffc800', Approved: '#a3e635', Denied: '#f87171', 'In Setup': '#60a5fa', Live: '#34d399' };

export default function DesignsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [designs, setDesigns] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      const res = await fetch('/api/designs/list', { cache: 'no-store' });
      const out = res.ok ? await res.json() : { designs: [] };
      setDesigns(out.designs);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  return (
    <PortalShell active="designs" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Your POD profile</div>
          <h1>Designs</h1>
          <p>Everything you have created in the Design Studio.</p>
        </div>
        <a href="/studio" className="sp-btn sp-in" style={{ '--i': 1 }}>
          New design
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </header>

      {designs === null ? (
        <div className="sp-card"><div className="sp-empty">Loading…</div></div>
      ) : designs.length === 0 ? (
        <div className="sp-card sp-in">
          <div className="sp-empty">
            <b>No designs yet</b>
            Create one in the Design Studio and it will show up here.
            <div><a href="/studio" className="sp-btn">Open Design Studio</a></div>
          </div>
        </div>
      ) : (
        <div className="sp-dgrid">
          {designs.map((d, k) => {
            const status = d.product?.status || 'Submitted';
            return (
              <a key={d.id} href={`/designs/${d.id}`} className="sp-card sp-lift sp-dcard sp-in" style={{ '--i': k % 8 }}>
                <div className="sp-dthumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {d.thumbnail && <img src={d.thumbnail} alt="" />}
                </div>
                <div className="sp-dbody">
                  <div className="sp-dnum">{d.name}</div>
                  <div className="sp-dprod">{d.product?.productTitle}{d.product?.variantTitle ? ` · ${d.product.variantTitle}` : ''}</div>
                  <div className="sp-dmeta">
                    <span className="sp-chip" style={{ '--c': STATUS_COLORS[status] || '#9ca3af' }}><i />{status}</span>
                    <span>{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
