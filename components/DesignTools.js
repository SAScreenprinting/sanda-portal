'use client';
import { useEffect, useState } from 'react';

// Looks at a print file in the browser: size in pixels, how much of it is printed, and how many distinct colors it has.
async function inspectFile(url) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const w = 320, h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  let opaque = 0; const colors = new Set();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] > 24) { opaque++; colors.add(((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4)); }
  }
  return { width: img.naturalWidth, height: img.naturalHeight, covered: opaque / (w * h), colors: colors.size };
}

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const SAMPLE_LABEL = { requested: 'Requested', in_production: 'In production', shipped: 'Shipped' };
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

// Pricing and profit, sample orders and publishing to a connected store, for one design.
export default function DesignTools({ design, onChanged }) {
  const p = design.product || {};
  const approved = ['Approved', 'In Setup', 'Live'].includes(p.status);

  // ----- print file check -----
  const [checks, setChecks] = useState(null);
  useEffect(() => {
    const files = design.decorations?.printFiles || [];
    Promise.all(files.map(async (f) => { try { return { f, r: await inspectFile(f.url) }; } catch { return { f, r: null }; } })).then(setChecks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.id]);

  // ----- pricing -----
  const [pricing, setPricing] = useState(undefined);
  const [price, setPrice] = useState('');
  const [priceMsg, setPriceMsg] = useState('');
  useEffect(() => {
    fetch(`/api/pricing?productId=${encodeURIComponent(p.productId || '')}`, { cache: 'no-store' })
      .then((r) => r.json()).then((d) => {
        setPricing(d.pricing || null);
        setPrice(String(p.retailPrice ?? d.pricing?.suggested ?? ''));
      }).catch(() => setPricing(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.id]);
  const priceNum = Number.parseFloat(price);
  const profit = pricing && priceNum > 0 ? priceNum - pricing.cost : null;
  const margin = profit != null && priceNum > 0 ? (profit / priceNum) * 100 : null;
  async function savePrice() {
    setPriceMsg('');
    const res = await fetch(`/api/designs/${design.id}/price`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price }) });
    const out = await res.json();
    setPriceMsg(res.ok ? 'ok:Price saved.' : `err:${out.error}`);
    if (res.ok) onChanged?.({ retailPrice: out.price });
  }

  // ----- samples -----
  const [samples, setSamples] = useState([]);
  const [sQty, setSQty] = useState(1);
  const [sNote, setSNote] = useState('');
  const [sMsg, setSMsg] = useState('');
  const loadSamples = () => fetch(`/api/samples?designId=${design.id}`, { cache: 'no-store' }).then((r) => r.json()).then((d) => setSamples(d.samples || [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSamples(); }, [design.id]);
  async function orderSample(e) {
    e.preventDefault(); setSMsg('');
    const res = await fetch('/api/samples', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ designId: design.id, quantity: sQty, note: sNote }) });
    const out = await res.json();
    if (res.ok) { setSMsg('ok:Sample requested. We will confirm the cost and timing with you.'); setSNote(''); loadSamples(); }
    else setSMsg(`err:${out.error}`);
  }

  // ----- publish -----
  const [stores, setStores] = useState(null);
  const [connId, setConnId] = useState('');
  const [title, setTitle] = useState(p.productTitle || '');
  const [desc, setDesc] = useState('');
  const [pubPrice, setPubPrice] = useState('');
  const [draft, setDraft] = useState(true);
  const [pubMsg, setPubMsg] = useState('');
  const [pubBusy, setPubBusy] = useState(false);
  useEffect(() => {
    if (!approved) return;
    fetch('/api/stores', { cache: 'no-store' }).then((r) => r.json()).then((d) => { setStores(d.stores || []); setConnId(d.stores?.[0]?.id || ''); }).catch(() => setStores([]));
  }, [approved]);
  useEffect(() => { setPubPrice(price); }, [price]);
  async function publish(e) {
    e.preventDefault(); setPubMsg(''); setPubBusy(true);
    const res = await fetch(`/api/designs/${design.id}/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connectionId: connId, title, description: desc, price: pubPrice, draft }) });
    const out = await res.json();
    setPubMsg(res.ok ? `ok:Published${draft ? ' as a draft' : ''}. ${out.adminUrl}` : `err:${out.error}`);
    setPubBusy(false);
  }

  const msg = (m) => m && <div className={`sp-msg ${m.startsWith('ok:') ? 'ok' : 'err'}`} style={{ marginTop: 12 }}>{m.startsWith('ok:') && m.includes('http') ? <>{m.slice(3).split(' https')[0]} <a href={'https' + m.split(' https')[1]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--y)' }}>Open in your store</a></> : m.slice(m.indexOf(':') + 1)}</div>;

  return (
    <>
      {checks && checks.length > 0 && (
        <div className="sp-card sp-in" style={{ '--i': 5 }}>
          <div className="sp-panel-head"><h2>Print file check</h2></div>
          <div className="sp-pad">
            {checks.map(({ f, r }) => {
              const notes = [];
              if (!r) notes.push({ bad: true, t: 'Could not read this file.' });
              else {
                if (Math.min(r.width, r.height) < 1200) notes.push({ bad: true, t: 'The file is small. It may look soft when printed large.' });
                if (r.covered < 0.005) notes.push({ bad: true, t: 'This file looks empty.' });
                if (r.colors > 64) notes.push({ bad: false, t: 'Many colors. This works best as DTF or full-color printing, not screen printing.' });
                if (!notes.length) notes.push({ bad: false, ok: true, t: 'Looks good.' });
              }
              return (
                <div key={f.url} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <b style={{ fontWeight: 600 }}>{f.viewName} · {f.printAreaLabel}</b>
                    <span style={{ color: 'var(--muted)' }}>{r ? `${r.width} × ${r.height} px` : ''}</span>
                  </div>
                  {notes.map((n) => <div key={n.t} style={{ color: n.ok ? '#34d399' : n.bad ? '#f87171' : '#ffc800', marginTop: 4 }}>{n.t}</div>)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="sp-card sp-in" style={{ '--i': 6 }}>
        <div className="sp-panel-head"><h2>Pricing and profit</h2></div>
        <div className="sp-pad">
          {pricing === undefined ? <div style={{ color: 'var(--muted)' }}>Loading…</div>
            : pricing === null ? <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>Pricing for this product has not been set up yet. S&amp;A will add it soon.</div>
            : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Your cost per item</span><span className="sp-money">{money(pricing.cost)}</span>
                </div>
                <div className="sp-field"><label>Price you will sell it for</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={pricing.suggested ? String(pricing.suggested) : '29.99'} /></div>
                {profit != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div><div className="sp-label">Profit per sale</div><div className="sp-num" style={{ fontSize: 30, margin: '8px 0 0', color: profit > 0 ? '#34d399' : '#f87171' }}>{money(profit)}</div></div>
                    <div style={{ textAlign: 'right' }}><div className="sp-label">Margin</div><div className="sp-num" style={{ fontSize: 30, margin: '8px 0 0' }}>{margin.toFixed(0)}%</div></div>
                  </div>
                )}
                {pricing.suggested && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Suggested price: {money(pricing.suggested)}</div>}
                <button className="sp-btn sp-btn--ghost" type="button" onClick={savePrice} disabled={!(priceNum > 0)}>Save price</button>
                {msg(priceMsg)}
              </>
            )}
        </div>
      </div>

      {approved && (
        <div className="sp-card sp-in" style={{ '--i': 7 }}>
          <div className="sp-panel-head"><h2>Order a sample</h2></div>
          <div className="sp-pad">
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>See and feel the finished product before you sell it. S&amp;A will confirm the cost and timing.</p>
            <form onSubmit={orderSample}>
              <div className="sp-two">
                <div className="sp-field"><label>Quantity</label>
                  <select className="sp-select" value={sQty} onChange={(e) => setSQty(e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
                <div className="sp-field"><label>Size / notes</label><input value={sNote} onChange={(e) => setSNote(e.target.value)} placeholder="Medium" /></div>
              </div>
              <button className="sp-btn" type="submit">Request sample <Arrow /></button>
            </form>
            {msg(sMsg)}
            {samples.length > 0 && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {samples.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5, padding: '6px 0' }}>
                    <span>{s.quantity} sample{s.quantity > 1 ? 's' : ''}{s.size_note ? ` · ${s.size_note}` : ''}</span>
                    <span style={{ color: 'var(--y)' }}>{SAMPLE_LABEL[s.status] || s.status}{s.tracking_number ? ` · ${s.tracking_number}` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {approved && (
        <div className="sp-card sp-in" style={{ '--i': 8 }}>
          <div className="sp-panel-head"><h2>Publish to your store</h2></div>
          <div className="sp-pad">
            {stores === null ? <div style={{ color: 'var(--muted)' }}>Loading…</div>
              : stores.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Connect your Shopify store and this design can be added to it in one click. <a href="/stores" className="sp-link" style={{ marginLeft: 6 }}>Connect a store <Arrow /></a></p>
              ) : (
                <form onSubmit={publish}>
                  <div className="sp-field"><label>Store</label>
                    <select className="sp-select" value={connId} onChange={(e) => setConnId(e.target.value)}>{stores.map((s) => <option key={s.id} value={s.id}>{s.store_domain}</option>)}</select></div>
                  <div className="sp-field"><label>Product title</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                  <div className="sp-field"><label>Description</label><textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Tell shoppers about this product" /></div>
                  <div className="sp-field"><label>Price</label><input type="number" min="0" step="0.01" value={pubPrice} onChange={(e) => setPubPrice(e.target.value)} required /></div>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5, color: '#e4e4e7', margin: '0 0 16px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#ffc800' }} /> Save as a draft so I can review it in my store first
                  </label>
                  <button className="sp-btn" type="submit" disabled={pubBusy}>{pubBusy ? 'Publishing…' : 'Publish'} <Arrow /></button>
                </form>
              )}
            {msg(pubMsg)}
          </div>
        </div>
      )}
    </>
  );
}
