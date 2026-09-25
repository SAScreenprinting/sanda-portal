'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const COLORS = { Submitted: '#ffc800', Approved: '#a3e635', Denied: '#f87171', 'In Setup': '#60a5fa', Live: '#34d399' };
const STEPS = [
  { key: 'Submitted', title: 'Submitted', note: 'Your design and print files are saved to your POD profile.' },
  { key: 'Approved', title: 'Approved', note: 'S&A reviewed your design and approved it.' },
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
  const [viewer, setViewer] = useState(null);
  const [bg, setBg] = useState('checker');
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

          {status === 'Denied' && (
            <div className="sp-msg err" style={{ marginBottom: 14 }}>
              <b>This design was sent back.</b> {p.reviewNote || 'Please review it and submit a new version.'}
              <div style={{ marginTop: 10 }}><a href="/studio" className="sp-link">Create a revised design</a></div>
            </div>
          )}

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
                    <button key={f.url} onClick={() => setViewer({ url: f.url, label: `${f.viewName} · ${f.printAreaLabel}` })} className="sp-file" style={{ width: '100%', background: 'none', border: 0, borderTop: '1px solid var(--line)', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
                      <span>{f.viewName} · {f.printAreaLabel}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {viewer && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setViewer(null)}>
          <div className="sp-dialog" style={{ maxWidth: 820 }}>
            <button className="sp-x" onClick={() => setViewer(null)} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            <h2 style={{ fontSize: 18 }}>{viewer.label}</h2>
            <div className="sp-tabs" style={{ margin: '12px 0' }}>
              {[['checker', 'Checker'], ['white', 'White'], ['black', 'Black']].map(([k, l]) => <button key={k} className={`sp-tab${bg === k ? ' on' : ''}`} onClick={() => setBg(k)}>{l}</button>)}
            </div>
            <div style={{ display: 'grid', placeItems: 'center', minHeight: 360, padding: 12, border: '1px solid var(--line2)',
              ...(bg === 'checker' ? { backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%),linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,10px 10px' } : { background: bg === 'black' ? '#000' : '#fff' }) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewer.url} alt="" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
