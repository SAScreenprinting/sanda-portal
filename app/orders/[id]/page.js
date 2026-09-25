'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const STEPS = ['Awaiting Artwork', 'Art Approved', 'In Production', 'Shipped'];
const STATUS_COLOR = {
  'Awaiting Artwork': '#a78bfa', 'Art Approved': '#60a5fa', 'In Production': '#ffc800',
  'Quality Check': '#fb923c', 'Shipped': '#34d399', 'Delivered': '#9ca3af',
};

// How far along the four-step tracker an order is (0 = first step active)
function stepIndex(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') || s.includes('ship')) return 3;
  if (s.includes('production') || s.includes('quality')) return 2;
  if (s.includes('art approved')) return 1;
  return 0;
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();
  const fileRef = useRef();

  const [order, setOrder] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [reorderMsg, setReorderMsg] = useState('');
  const [artUploading, setArtUploading] = useState(false);
  const [artLabel, setArtLabel] = useState('');
  const [artMsg, setArtMsg] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);

      // The link may carry the order's id or its number (like 1101)
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      let q = supabase.from('orders').select('*, order_items(*)').eq('client_id', user.id);
      q = isUuid ? q.eq('id', id) : q.eq('order_number', `#${id}`);
      const { data: dbOrder } = await q.maybeSingle();
      if (!dbOrder) { setOrder(null); return; }
      const items = dbOrder.order_items || [];
      setOrder({ ...dbOrder, items });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  async function uploadArtwork(fileList) {
    if (!userId || !fileList?.length) return;
    setArtUploading(true); setArtMsg('');
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', userId);
      if (artLabel.trim()) fd.append('label', artLabel.trim());
      if (order?.id) fd.append('orderId', order.id);
      const res = await fetch('/api/artwork/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setArtMsg(`err:${data.error || 'Upload failed'}`); setArtUploading(false); return; }
    }
    setArtMsg(`ok:${fileList.length} file${fileList.length > 1 ? 's' : ''} submitted. S&A will review and confirm.`);
    setArtLabel(''); setArtUploading(false);
    setTimeout(() => setArtMsg(''), 6000);
  }

  function handleReorder() {
    setReorderMsg('Reorder request sent. S&A will reach out to confirm details.');
    setTimeout(() => setReorderMsg(''), 4000);
  }

  const st = order ? stepIndex(order.status) : 0;
  const color = order ? (STATUS_COLOR[order.status] || '#9ca3af') : '#9ca3af';
  const dateStr = order?.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const summary = order?.items?.length ? `${order.items[0].quantity}x ${order.items[0].description}${order.items[0].decoration ? ', ' + order.items[0].decoration : ''}` : '';

  return (
    <PortalShell active="orders" profile={profile} loading={!profile} onSignOut={signOut}>
      <a href="/orders" className="sp-link" style={{ marginBottom: 22, display: 'inline-flex' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ transform: 'rotate(180deg)' }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        All orders
      </a>

      {order === undefined && <div className="sp-card"><div className="sp-empty">Loading…</div></div>}
      {order === null && (
        <div className="sp-card"><div className="sp-empty"><b>Order not found</b>It may have been removed, or it belongs to a different account.<div><a href="/orders" className="sp-btn">Back to orders</a></div></div></div>
      )}

      {order && (
        <>
          <header className="sp-head">
            <div className="sp-in">
              <div className="sp-eyebrow">Order</div>
              <h1>{order.order_number}</h1>
              <p>Placed {dateStr}{summary ? ` · ${summary}` : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }} className="sp-in">
              <button className="sp-btn sp-btn--ghost" onClick={handleReorder}>Reorder</button>
              <span className="sp-chip live" style={{ '--c': color, padding: '13px 16px' }}><i />{order.status}</span>
            </div>
          </header>
          {reorderMsg && <div className="sp-msg ok">{reorderMsg}</div>}

          <div className="sp-card sp-in" style={{ '--i': 1, marginBottom: 14 }}>
            <div className="sp-panel-head"><h2>Progress</h2></div>
            <div className="sp-track">
              <div className="sp-track-fill" style={{ width: `calc((100% - 96px) * ${st / (STEPS.length - 1)})` }} />
              {STEPS.map((label, i) => (
                <div key={label} className={`sp-tstep${i < st ? ' done' : i === st ? ' now' : ''}`}>
                  <div className="sp-tdot">
                    {i < st ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><path d="M4 12l5 5 11-11" /></svg> : i + 1}
                  </div>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </div>

          {order.status === 'Awaiting Artwork' && (
            <div className="sp-card sp-in" style={{ '--i': 2, marginBottom: 14, borderColor: 'rgba(167,139,250,0.5)' }}>
              <div className="sp-panel-head"><h2>Upload your artwork</h2></div>
              <div className="sp-pad">
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.6 }}>This order is waiting on your artwork. Upload your design files and S&amp;A will review and confirm before production starts.</p>
                <div className="sp-field"><label>Design label (optional)</label>
                  <input value={artLabel} onChange={(e) => setArtLabel(e.target.value)} placeholder="Front logo, jersey back" /></div>
                <div className={`sp-drop${dragging ? ' on' : ''}`}
                  onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); uploadArtwork(e.dataTransfer.files); }}
                  onClick={() => !artUploading && fileRef.current?.click()}>
                  <input ref={fileRef} type="file" multiple accept=".svg,.ai,.pdf,.png,.jpg,.jpeg,.eps,.gif,.webp" style={{ display: 'none' }} onChange={(e) => uploadArtwork(e.target.files)} />
                  <b>{artUploading ? 'Uploading…' : 'Drop files here or click to browse'}</b>
                  <span>SVG · AI · PDF · PNG · JPG · EPS · Max 20MB</span>
                </div>
                {artMsg && <div className={`sp-msg ${artMsg.startsWith('ok:') ? 'ok' : 'err'}`} style={{ marginTop: 14 }}>{artMsg.slice(artMsg.indexOf(':') + 1)}</div>}
              </div>
            </div>
          )}

          <div className="sp-cols">
            <div className="sp-card sp-in" style={{ '--i': 3 }}>
              <div className="sp-panel-head"><h2>Order details</h2></div>
              <div className="sp-pad">
                {order.items.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>No items listed yet.</div>}
                {order.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
                    <span>{it.description}{it.decoration ? ` · ${it.decoration}` : ''}</span>
                    <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>Qty {it.quantity}</span>
                  </div>
                ))}
                {order.notes ? (
                  <div className="sp-msg" style={{ marginTop: 20, whiteSpace: 'pre-line' }}>{order.notes}</div>
                ) : <div style={{ color: 'var(--dim)', fontSize: 13, marginTop: 18 }}>No special notes.</div>}
              </div>
            </div>
            <div className="sp-card sp-in" style={{ '--i': 4, alignSelf: 'start' }}>
              <div className="sp-panel-head"><h2>Summary</h2></div>
              <div className="sp-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: 'var(--muted)' }}>Order total</span>
                  <span className="sp-money">{order.total_amount ? `$${parseFloat(order.total_amount).toFixed(2)}` : '—'}</span>
                </div>
                {order.tracking_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 14 }}>
                    <span style={{ color: 'var(--muted)' }}>{order.tracking_carrier || 'Tracking'}</span>
                    <span>{order.tracking_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
