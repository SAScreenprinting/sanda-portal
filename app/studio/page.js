'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

// The same design studio as the S&A storefront (built in the sa-product-designer app).
// Its bundle lives in /public/designer; the /apps/designer/* calls it makes are passed
// through by app/apps/designer/[...path]/route.js. Finishing a design creates a portal order.

const FONTS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Pacifico&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;700&display=swap';

function useDesignerAssets(active) {
  useEffect(() => {
    if (!active) return;
    const nodes = [];
    [['stylesheet', '/designer/designer.css'], ['stylesheet', FONTS]].forEach(([rel, href]) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement('link'); l.rel = rel; l.href = href; document.head.appendChild(l); nodes.push(l);
    });
    return () => nodes.forEach((n) => n.remove());
  }, [active]);
}

export default function StudioPage() {
  const [productId, setProductId] = useState(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState(null);
  const [category, setCategory] = useState('All');
  const [bootstrap, setBootstrap] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const mountRef = useRef(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    // the product comes from the address bar, which only exists in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductId(new URLSearchParams(window.location.search).get('product'));
    setReady(true);
  }, []);

  // Product picker
  useEffect(() => {
    if (!ready || productId) return;
    fetch('/apps/designer/portal/products', { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setProducts(d.products || []))
      .catch(() => setError('We could not load the product list. Please refresh and try again.'));
  }, [ready, productId]);

  // Editor data
  useEffect(() => {
    if (!ready || !productId) return;
    (async () => {
      try {
        const { data: { user } } = await createClient().auth.getUser();
        const res = await fetch(`/apps/designer/portal/products/${encodeURIComponent(productId)}/bootstrap`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBootstrap({ ...data, customerId: user ? `portal-${user.id}` : null, accountLoginUrl: '/', portal: true });
      } catch {
        setError('We could not load that product. Please pick another one.');
      }
    })();
  }, [ready, productId]);

  useDesignerAssets(!!bootstrap);

  // Load the studio once its data is on the page
  useEffect(() => {
    if (!bootstrap) return;
    window.SA_DESIGNER_UPLOAD = {
      url: '',
      getToken: async () => {
        const t = tokenRef.current;
        if (t && t.exp > Date.now() + 60000) { window.SA_DESIGNER_UPLOAD.url = t.url; return t.token; }
        const r = await fetch('/api/designer-token', { cache: 'no-store' });
        if (!r.ok) throw new Error('Upload is unavailable right now.');
        const d = await r.json();
        tokenRef.current = { token: d.token, url: d.url, exp: Number(d.token.split('.')[0]) };
        window.SA_DESIGNER_UPLOAD.url = d.url;
        return d.token;
      },
    };
    // the studio needs the upload URL up front, so fetch the first token now
    window.SA_DESIGNER_UPLOAD.getToken().catch(() => {});
    const s = document.createElement('script');
    s.src = '/designer/designer.js';
    s.async = true;
    document.body.appendChild(s);
    return () => { s.remove(); delete window.SA_DESIGNER_UPLOAD; };
  }, [bootstrap]);

  // Design finished
  useEffect(() => {
    if (!bootstrap) return;
    async function onComplete(e) {
      const d = e.detail || {};
      const variant = (bootstrap.variants || []).find((v) => v.id === d.variantId);
      setSaving(true);
      try {
        const res = await fetch('/api/designs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...d, variantTitle: variant?.title && variant.title !== 'Default Title' ? variant.title : null }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || 'Could not save your design.');
        setResult(out);
      } catch (err) {
        setError(err.message || 'Could not save your design.');
      } finally {
        setSaving(false);
      }
    }
    window.addEventListener('sa-designer-complete', onComplete);
    return () => window.removeEventListener('sa-designer-complete', onComplete);
  }, [bootstrap]);

  const categories = ['All', ...Array.from(new Set((products || []).map((p) => p.category).filter(Boolean)))];
  const shown = (products || []).filter((p) => category === 'All' || p.category === category);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#eee', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ height: 52, background: '#111', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/dashboard" style={{ color: '#aaa', textDecoration: 'none', fontSize: 13 }}>&larr; Dashboard</a>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Design Studio</span>
        <div style={{ flex: 1 }} />
        {productId && <a href="/studio" style={{ color: '#e8a020', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Change product</a>}
      </div>

      {error && <div style={{ margin: 20, padding: '12px 16px', background: '#3a1414', border: '1px solid #7a2a2a', borderRadius: 8, color: '#ffb4b4', fontSize: 14 }}>{error}</div>}

      {!productId && ready && (
        <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, margin: '0 0 6px', color: '#fff' }}>Pick a product to design</h1>
          <p style={{ margin: '0 0 20px', color: '#888', fontSize: 14 }}>The same design studio as sandascreenprinting.com.</p>
          {products === null && !error && <div style={{ color: '#888' }}>Loading products…</div>}
          {products && categories.length > 2 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: category === c ? 700 : 400, background: category === c ? '#e8a020' : '#2a2a2a', color: category === c ? '#1a1a1a' : '#999' }}>{c}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
            {shown.map((p) => (
              <a key={p.id} href={`/studio?product=${encodeURIComponent(p.id)}`}
                style={{ display: 'block', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', textDecoration: 'none', color: '#eee' }}>
                <div style={{ aspectRatio: '1', background: '#fff', display: 'grid', placeItems: 'center' }}>
                  {p.image && <img src={p.image} alt="" loading="lazy" decoding="async" width="240" height="240" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                </div>
                <div style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.35 }}>{p.title}</div>
              </a>
            ))}
          </div>
          {products && products.length === 0 && <div style={{ color: '#888' }}>No products are available yet.</div>}
        </div>
      )}

      {productId && !bootstrap && !error && <div style={{ padding: 40, color: '#888' }}>Loading the studio…</div>}

      {bootstrap && (
        <div ref={mountRef} style={{ background: '#fff', color: '#17171a' }}>
          <div data-sa-designer-root data-product-id={bootstrap.productId}>
            <script type="application/json" data-sa-designer-bootstrap dangerouslySetInnerHTML={{ __html: JSON.stringify(bootstrap).replace(/</g, '\\u003c') }} />
          </div>
        </div>
      )}

      {(saving || result) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '30px 32px', maxWidth: 420, textAlign: 'center' }}>
            {saving && !result && <div style={{ color: '#fff', fontSize: 16 }}>Saving your design…</div>}
            {result && (
              <>
                <div style={{ fontSize: 34, marginBottom: 8 }}>✓</div>
                <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: 20 }}>Design #{result.designNumber} saved</h2>
                <p style={{ margin: '0 0 20px', color: '#aaa', fontSize: 14, lineHeight: 1.5 }}>Your design and print files are saved to your POD profile. S&A will set it up with your stores.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href={`/designs/${result.id}`} style={{ padding: '10px 18px', background: '#ffc800', color: '#000', textDecoration: 'none', fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>View design</a>
                  <a href="/studio" style={{ padding: '10px 18px', background: '#2a2a2a', color: '#ddd', textDecoration: 'none', fontSize: 13 }}>Design another</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
