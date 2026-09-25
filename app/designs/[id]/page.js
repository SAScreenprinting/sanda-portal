'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const COLORS = { Submitted: '#ffc800', 'In Setup': '#60a5fa', Live: '#34d399' };
const STEPS = [
  { key: 'Submitted', title: 'Submitted', note: 'Your design and print files are saved to your POD profile.' },
  { key: 'In Setup', title: 'In setup', note: 'S&A is setting this item up with your profile and your online stores.' },
  { key: 'Live', title: 'Live', note: 'The item is ready to sell from your connected stores.' },
];

export default function DesignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [design, setDesign] = useState(undefined);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      const res = await fetch(`/api/designs/${id}`, { cache: 'no-store' });
      setDesign(res.ok ? (await res.json()).design : null);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  const p = design?.product || {};
  const status = p.status || 'Submitted';
  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.key === status));
  const previews = Object.entries(design?.decorations?.previews || {});
  const files = design?.decorations?.printFiles || [];

  return (
    <PortalShell active="designs" profile={profile} loading={!profile} onSignOut={signOut}>
      <a href="/designs" className="sp-link" style={{ marginBottom: 22, display: 'inline-flex' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ transform: 'rotate(180deg)' }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        All designs
      </a>

      {design === undefined && <div className="sp-card"><div className="sp-empty">Loading…</div></div>}
      {design === null && (
        <div className="sp-card">
          <div className="sp-empty">
            <b>Design not found</b>
            It may have been removed, or it belongs to a different account.
            <div><a href="/designs" className="sp-btn">Back to designs</a></div>
          </div>
        </div>
      )}

      {design && (
        <>
          <header className="sp-head">
            <div className="sp-in">
              <div className="sp-eyebrow">Design</div>
              <h1>{design.name}</h1>
              <p>{p.productTitle}{p.variantTitle ? ` · ${p.variantTitle}` : ''}</p>
            </div>
            <span className="sp-chip live sp-in" style={{ '--c': COLORS[status] || '#9ca3af', '--i': 1 }}><i />{status}</span>
          </header>

          <div className="sp-detail">
            <div className="sp-card sp-in" style={{ '--i': 2 }}>
              <div className="sp-panel-head"><h2>Preview</h2></div>
              <div className="sp-previews">
                {previews.map(([view, url]) => (
                  <figure key={view}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${view} preview`} />
                    <figcaption>{view}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <div className="sp-card sp-in" style={{ '--i': 3 }}>
                <div className="sp-panel-head"><h2>Progress</h2></div>
                <div className="sp-timeline">
                  {STEPS.map((s, k) => (
                    <div key={s.key} className={`sp-tl${k <= stepIdx ? ' on' : ''}`}><i /><div>{s.title}<small>{s.note}</small></div></div>
                  ))}
                </div>
              </div>

              <div className="sp-card sp-in" style={{ '--i': 4 }}>
                <div className="sp-panel-head"><h2>Details</h2></div>
                <dl className="sp-kv" style={{ margin: 0 }}>
                  <div><span className="k">Design number</span><span>{p.designNumber}</span></div>
                  <div><span className="k">Product</span><span style={{ textAlign: 'right' }}>{p.productTitle}</span></div>
                  {p.variantTitle && <div><span className="k">Variant</span><span>{p.variantTitle}</span></div>}
                  <div><span className="k">Created</span><span>{new Date(design.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                </dl>
              </div>

              {files.length > 0 && (
                <div className="sp-card sp-in" style={{ '--i': 5 }}>
                  <div className="sp-panel-head"><h2>Print files</h2></div>
                  {files.map((f) => (
                    <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="sp-file">
                      <span>{f.viewName} · {f.printAreaLabel}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 3v12M6 11l6 6 6-6M4 21h16" /></svg>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
