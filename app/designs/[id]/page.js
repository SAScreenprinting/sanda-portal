'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';
import { downloadFile } from '@/lib/downloadFile';
import DesignTools from '@/components/DesignTools';

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

  const [zipping, setZipping] = useState(false);
  async function downloadZip() {
    if (!design) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const safe = (t) => String(t).replace(/[^a-zA-Z0-9._-]+/g, '-');
      const add = async (url, name) => { try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) zip.file(name, await r.blob()); } catch {} };
      await Promise.all([
        ...Object.entries(design.decorations?.previews || {}).map(([v, u]) => add(u, `mockups/${safe(design.name)}-${safe(v)}-mockup.png`)),
        ...(design.decorations?.printFiles || []).map((f) => add(f.url, `print-files/${safe(design.name)}-${safe(f.viewName)}-${safe(f.printAreaLabel)}.png`)),
      ]);
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `${safe(design.name)}-mockups.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } finally { setZipping(false); }
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  const p = design?.product || {};
  const status = p.status || 'Submitted';
  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.key === status));
  const [viewer, setViewer] = useState(null);
  const [bg, setBg] = useState('checker');
  const [zoom, setZoom] = useState(1);
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
              <div className="sp-panel-head"><h2>Preview</h2><button className="sp-btn sp-btn--ghost" style={{ padding: '9px 14px' }} onClick={downloadZip} disabled={zipping}>{zipping ? 'Preparing…' : 'Download all (.zip)'}</button></div>
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
                  {p.sku && <div><span className="k">SKU</span><span style={{ color: 'var(--y)', fontWeight: 700 }}>{p.sku}</span></div>}
                  <div><span className="k">Product</span><span style={{ textAlign: 'right' }}>{p.productTitle}</span></div>
                  {p.variantTitle && <div><span className="k">Variant</span><span>{p.variantTitle}</span></div>}
                  <div><span className="k">Created</span><span>{new Date(design.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                </dl>
              </div>

              {files.length > 0 && (
                <div className="sp-card sp-in" style={{ '--i': 5 }}>
                  <div className="sp-panel-head"><h2>Print files</h2></div>
                  {files.map((f) => (
                    <button key={f.url} onClick={() => { setZoom(1); setViewer({ url: f.url, label: `${f.viewName} · ${f.printAreaLabel}`, file: `${design.name}-${f.viewName}-${f.printAreaLabel}.png`.replace(/[^a-zA-Z0-9._-]+/g, '-') }); }} className="sp-file" style={{ width: '100%', background: 'none', border: 0, borderTop: '1px solid var(--line)', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
                      <span>{f.viewName} · {f.printAreaLabel}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  ))}
                </div>
              )}
              <DesignTools design={design} onChanged={(patch) => setDesign((x) => ({ ...x, product: { ...(x.product || {}), ...patch } }))} />
            </div>
          </div>
        </>
      )}
      {viewer && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setViewer(null)}>
          <div className="sp-dialog" style={{ maxWidth: 820 }}>
            <button className="sp-x" onClick={() => setViewer(null)} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            <h2 style={{ fontSize: 18 }}>{viewer.label}</h2>
            <div className="sp-tabs" style={{ margin: '12px 0', alignItems: 'center' }}>
              <button className="sp-tab" onClick={() => setZoom((z) => Math.max(1, +(z / 1.5).toFixed(2)))} disabled={zoom <= 1} aria-label="Zoom out">−</button>
              <button className="sp-tab" onClick={() => setZoom(1)} style={{ minWidth: 64 }}>{zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}</button>
              <button className="sp-tab" onClick={() => setZoom((z) => Math.min(12, +(z * 1.5).toFixed(2)))} aria-label="Zoom in">+</button>
              <span style={{ width: 10 }} />
              {[['checker', 'Checker'], ['white', 'White'], ['black', 'Black']].map(([k, l]) => <button key={k} className={`sp-tab${bg === k ? ' on' : ''}`} onClick={() => setBg(k)}>{l}</button>)}
            </div>
            <div style={{ height: '58vh', minHeight: 320, overflow: 'auto', display: 'flex', alignItems: zoom > 1 ? 'flex-start' : 'center', justifyContent: zoom > 1 ? 'flex-start' : 'center', padding: 12, border: '1px solid var(--line2)',
              ...(bg === 'checker' ? { backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%),linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,10px 10px' } : { background: bg === 'black' ? '#000' : '#fff' }) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewer.url} alt="" draggable={false} style={zoom === 1 ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' } : { width: `${zoom * 100}%`, maxWidth: 'none', height: 'auto', flex: 'none', imageRendering: zoom >= 4 ? 'pixelated' : 'auto' }} />
            </div>
            <button className="sp-btn" style={{ marginTop: 16 }} onClick={() => downloadFile(viewer.url, viewer.file)}>Download print file</button>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
