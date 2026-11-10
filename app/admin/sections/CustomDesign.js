'use client';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { buildVariantSkus } from '@/lib/designSku';
import './../../../components/admin.css';

// Build a POD product by hand: upload the artwork and a picture per color, type the blank's name, choose colors and sizes.
// Every color/size gets its own SKU (POD-<design number>-<color>-<size>) and the design lands approved in the client's account.

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const ACCEPT = 'image/png,image/jpeg,image/webp';
let nextId = 1;

// Shrinks a product photo so it uploads fast (print files are never touched).
async function shrinkImage(file, max = 1600) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

async function uploadImage(file, shrink) {
  const f = shrink ? await shrinkImage(file) : file;
  const res = await fetch('/api/designs/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: f.name }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'Could not start the upload.');
  const { error } = await createClient().storage.from('artwork').uploadToSignedUrl(j.path, j.token, f, { contentType: f.type });
  if (error) throw new Error(error.message || 'Upload failed.');
  return j.publicUrl;
}

function Picture({ url, size = 56 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, border: '1px solid var(--ad-line2)', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' }}>
      {url ? <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, color: '#999' }}>none</span>}
    </div>
  );
}

// A button that picks a file, uploads it and reports the link.
function UploadButton({ label, onDone, onError, shrink, busy, setBusy }) {
  return (
    <label className="ad-btn ad-btn--sm" style={{ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
      {busy ? 'Uploading…' : label}
      <input type="file" accept={ACCEPT} style={{ display: 'none' }} disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        try { onDone(await uploadImage(file, shrink), file); } catch (err) { onError(err.message || 'Upload failed.'); }
        setBusy(false);
      }} />
    </label>
  );
}

export default function CustomDesign({ clients, onClose }) {
  const [who, setWho] = useState('');
  const [title, setTitle] = useState('');
  const [blank, setBlank] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState(['S', 'M', 'L', 'XL', '2XL', '3XL']);
  const [off, setOff] = useState({}); // combinations switched off, keyed `${colorId}|${size}`
  const [colorText, setColorText] = useState('');
  const [sizeText, setSizeText] = useState('');
  const [cost, setCost] = useState('');
  const [suggested, setSuggested] = useState('');
  const [busy, setBusy] = useState({}); // which uploads are running
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [showSkus, setShowSkus] = useState(true);

  const setBusyKey = (k) => (v) => setBusy((b) => ({ ...b, [k]: v }));
  const uploading = Object.values(busy).some(Boolean);

  const addColors = () => {
    const names = colorText.split(/[,;\n]/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!names.length) return;
    setColors((cur) => {
      const have = new Set(cur.map((c) => c.name.toLowerCase()));
      const add = [];
      for (const n of names) if (!have.has(n.toLowerCase())) { have.add(n.toLowerCase()); add.push({ id: nextId++, name: n, image: null }); }
      return [...cur, ...add];
    });
    setColorText('');
  };
  const addSize = (s) => {
    const name = s.replace(/\s+/g, ' ').trim();
    if (!name) return;
    setSizes((cur) => (cur.some((x) => x.toLowerCase() === name.toLowerCase()) ? cur : [...cur, name]));
  };
  const toggleSize = (s) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const patchColor = (id, patch) => setColors((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const flip = (id, size) => setOff((o) => ({ ...o, [`${id}|${size}`]: !o[`${id}|${size}`] }));

  const variants = useMemo(() => colors.flatMap((c) => sizes.filter((s) => !off[`${c.id}|${s}`]).map((s) => [c.name, s])), [colors, sizes, off]);
  const skus = useMemo(() => (variants.length ? buildVariantSkus('######', ['Color', 'Size'], variants) : []), [variants]);
  const orderedSizes = useMemo(() => {
    // Keep the usual order for the standard sizes, then any custom ones in the order they were added.
    const known = PRESET_SIZES.filter((s) => sizes.includes(s));
    return [...known, ...sizes.filter((s) => !PRESET_SIZES.includes(s))];
  }, [sizes]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Enter a product name.');
    if (!blank.trim()) return setError('Enter the blank (the garment name, for example "Gildan 64000").');
    if (!front) return setError('Upload the artwork (the print file).');
    if (!variants.length) return setError('Choose at least one color and size.');
    setSaving(true);
    try {
      const res = await fetch('/api/designs/custom', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forClientId: who || undefined, title, blank, cost, suggested,
          artwork: { front: front.url, back: back?.url || null },
          colors: colors.map((c) => ({ name: c.name, image: c.image })),
          sizes: orderedSizes, variants,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error || 'Could not save this product.');
      else setDone(j);
    } catch { setError('Network error. Try again.'); }
    setSaving(false);
  };

  const modal = { width: 'min(940px, calc(100% - 24px))' };

  if (done) {
    return (
      <div className="ad-overlay ad-overlay--center" onClick={() => onClose(true)}>
        <div className="ad-modal" style={modal} onClick={(e) => e.stopPropagation()}>
          <div className="ad-drawer-head"><h2>Product created</h2><button type="button" className="ad-btn ad-btn--sm" onClick={() => onClose(true)}>Close</button></div>
          <div className="ad-notice ad-notice--ok">
            Design #{done.designNumber} was saved{done.forClient ? ` to ${done.forClient}` : ' to your own account'}, already approved with {done.variants.length} SKUs.
            {done.forClient ? (done.emailed ? ' They were emailed.' : ' (They could not be emailed.)') : ''}
            {done.forClient ? ' They can add it from the Add products screen in their S&A POD app.' : ''}
          </div>
          <div className="ad-tablewrap"><table className="ad-table"><thead><tr><th>SKU</th><th>Color</th><th>Size</th></tr></thead>
            <tbody>{done.variants.map((v) => <tr key={v.sku}><td style={{ fontFamily: 'monospace' }}>{v.sku}</td><td>{v.color}</td><td>{v.size}</td></tr>)}</tbody></table></div>
          <div className="ad-actions" style={{ marginTop: 18 }}><button className="ad-btn ad-btn--primary" onClick={() => onClose(true)}>Done</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-overlay ad-overlay--center">
      <form className="ad-modal" style={modal} onSubmit={save}>
        <div className="ad-drawer-head"><h2>Custom product</h2><button type="button" className="ad-btn ad-btn--sm" onClick={onClose}>Close</button></div>
        {error ? <div className="ad-notice ad-notice--bad">{error}</div> : null}

        <div className="ad-form">
          <div className="ad-field"><label>For client</label>
            <select className="ad-select" value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">S&amp;A (my own account)</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name || c.contact_name || c.email}</option>)}
            </select>
          </div>
          <div className="ad-field"><label>Product name</label><input className="ad-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Eagles Spirit Tee" /></div>
          <div className="ad-field"><label>Blank (the garment)</label><input className="ad-input" value={blank} onChange={(e) => setBlank(e.target.value)} placeholder="Gildan 64000 Softstyle" /></div>
        </div>

        <div className="ad-section-title" style={{ marginTop: 22 }}>Artwork</div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {[['Front print file (required)', front, setFront, 'front'], ['Back print file (optional)', back, setBack, 'back']].map(([label, val, setVal, key]) => (
            <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Picture url={val?.url} size={76} />
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="ad-muted" style={{ fontSize: 13 }}>{label}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <UploadButton label={val ? 'Replace' : 'Upload'} busy={!!busy[key]} setBusy={setBusyKey(key)} onDone={(url, file) => setVal({ url, name: file.name })} onError={setError} />
                  {val ? <button type="button" className="ad-btn ad-btn--sm" onClick={() => setVal(null)}>Remove</button> : null}
                </div>
                {val ? <div className="ad-muted" style={{ fontSize: 12 }}>{val.name}</div> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="ad-section-title" style={{ marginTop: 22 }}>Colors</div>
        <p className="ad-muted" style={{ margin: '0 0 10px', fontSize: 13 }}>Type a color (or paste several separated by commas), then add a picture of that color with your design on it. That picture shows when a shopper picks the color.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="ad-input" style={{ flex: 1 }} value={colorText} onChange={(e) => setColorText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColors(); } }} placeholder="Black, Navy, Sport Grey" />
          <button type="button" className="ad-btn" onClick={addColors}>Add colors</button>
        </div>
        {colors.length === 0 ? <div className="ad-muted" style={{ fontSize: 13 }}>No colors yet.</div> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {colors.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Picture url={c.image} />
                <input className="ad-input" style={{ flex: '1 1 160px', minWidth: 140 }} value={c.name} onChange={(e) => patchColor(c.id, { name: e.target.value })} />
                <UploadButton label={c.image ? 'Replace picture' : 'Add picture'} shrink busy={!!busy[`c${c.id}`]} setBusy={setBusyKey(`c${c.id}`)} onDone={(url) => patchColor(c.id, { image: url })} onError={setError} />
                {c.image ? <button type="button" className="ad-btn ad-btn--sm" onClick={() => patchColor(c.id, { image: null })}>Remove picture</button> : null}
                <button type="button" className="ad-btn ad-btn--sm ad-btn--danger" onClick={() => setColors((cur) => cur.filter((x) => x.id !== c.id))}>Delete color</button>
              </div>
            ))}
          </div>
        )}

        <div className="ad-section-title" style={{ marginTop: 22 }}>Sizes</div>
        <div className="ad-chips" style={{ marginBottom: 10 }}>
          {[...PRESET_SIZES, ...sizes.filter((s) => !PRESET_SIZES.includes(s))].map((s) => (
            <button type="button" key={s} className={`ad-chipbtn${sizes.includes(s) ? ' on' : ''}`} onClick={() => toggleSize(s)}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, maxWidth: 360 }}>
          <input className="ad-input" style={{ flex: 1 }} value={sizeText} onChange={(e) => setSizeText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(sizeText); setSizeText(''); } }} placeholder="Other size, e.g. Youth M" />
          <button type="button" className="ad-btn" onClick={() => { addSize(sizeText); setSizeText(''); }}>Add size</button>
        </div>

        {colors.length > 0 && orderedSizes.length > 0 ? (
          <>
            <div className="ad-section-title" style={{ marginTop: 22 }}>Variants <span className="ad-muted" style={{ fontWeight: 400 }}>({variants.length}) — untick any color and size that does not exist</span></div>
            <div className="ad-tablewrap"><table className="ad-table">
              <thead><tr><th>Color</th>{orderedSizes.map((s) => <th key={s} style={{ textAlign: 'center' }}>{s}</th>)}</tr></thead>
              <tbody>{colors.map((c) => (
                <tr key={c.id}><td>{c.name || '—'}</td>{orderedSizes.map((s) => (
                  <td key={s} style={{ textAlign: 'center' }}><input type="checkbox" checked={!off[`${c.id}|${s}`]} onChange={() => flip(c.id, s)} /></td>
                ))}</tr>
              ))}</tbody>
            </table></div>
          </>
        ) : null}

        {variants.length > 0 ? (
          <>
            <div className="ad-section-title" style={{ marginTop: 22, cursor: 'pointer' }} onClick={() => setShowSkus((v) => !v)}>SKUs {showSkus ? '▾' : '▸'} <span className="ad-muted" style={{ fontWeight: 400 }}>— the ###### becomes the design number when you save</span></div>
            {showSkus ? (
              <div className="ad-tablewrap" style={{ maxHeight: 220, overflowY: 'auto' }}><table className="ad-table"><thead><tr><th>SKU</th><th>Color</th><th>Size</th></tr></thead>
                <tbody>{variants.map((v, i) => <tr key={skus[i]}><td style={{ fontFamily: 'monospace' }}>{skus[i]}</td><td>{v[0]}</td><td>{v[1]}</td></tr>)}</tbody></table></div>
            ) : null}
          </>
        ) : null}

        <div className="ad-section-title" style={{ marginTop: 22 }}>Pricing hints <span className="ad-muted" style={{ fontWeight: 400 }}>(optional, shown to the client)</span></div>
        <div className="ad-form" style={{ maxWidth: 520 }}>
          <div className="ad-field"><label>Your cost per piece</label><input className="ad-input" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="12.50" /></div>
          <div className="ad-field"><label>Suggested retail price</label><input className="ad-input" inputMode="decimal" value={suggested} onChange={(e) => setSuggested(e.target.value)} placeholder="24.99" /></div>
        </div>

        <div className="ad-actions" style={{ marginTop: 26 }}>
          <button className="ad-btn ad-btn--primary" disabled={saving || uploading}>{saving ? 'Saving…' : uploading ? 'Waiting for uploads…' : `Create product${variants.length ? ` (${variants.length} variants)` : ''}`}</button>
          <button type="button" className="ad-btn" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
