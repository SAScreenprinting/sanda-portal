'use client';
import { useState, useRef } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sanda2024admin';

const EMPTY = {
  name:'', sku:'', brand:'', category:'', subcategory:'',
  description:'', colors:'', sizes:'', material:'', weight:'',
  printAreas:'', basePrice:'', msrp:'', minQty:'12',
  tags:'', features:'', careInstructions:'', countryOfOrigin:'', inStock:true,
};

export default function AdminProductsPage() {
  const [authed, setAuthed]         = useState(false);
  const [password, setPassword]     = useState('');
  const [authError, setAuthError]   = useState('');
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setPreview]  = useState(null);
  const [product, setProduct]       = useState(EMPTY);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiStatus, setAiStatus]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef();

  /* Auth */
  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { setAuthed(true); }
    else { setAuthError('Incorrect password.'); setPassword(''); }
  }

  /* Image */
  function loadImage(file) {
    if (!file?.type.startsWith('image/')) return;
    setImageFile(file);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target.result);
    r.readAsDataURL(file);
  }

  /* AI Fill */
  async function runAiFill() {
    if (!imagePreview) return;
    setAiLoading(true);
    setAiStatus('Sending image to Claude…');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: imageFile.type, data: imagePreview.split(',')[1] } },
              { type: 'text', text: `You are a product specialist for S&A Screen Printing, a POD screen printing company. Analyze this garment photo and return ONLY a valid JSON object with no markdown, no explanation, no code fences.

Return exactly:
{"name":"","sku":"","brand":"","category":"T-Shirts|Hoodies|Sweatshirts|Polos|Hats|Bags|Jackets|Accessories","subcategory":"","description":"2-3 sentence marketing description","colors":"comma separated","sizes":"comma separated","material":"","weight":"e.g. 5.3 oz","printAreas":"comma separated print locations","basePrice":"wholesale e.g. 4.50","msrp":"retail e.g. 14.99","minQty":"12","tags":"comma separated","features":"comma separated","careInstructions":"","countryOfOrigin":"","inStock":true}` },
            ],
          }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(b => b.text||'').join('') || '';
      const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
      setProduct(p => ({ ...p, ...parsed }));
      setAiStatus('✓ Done! Review and adjust the fields below.');
    } catch(err) {
      console.error(err);
      setAiStatus('⚠ AI fill failed — try again or fill in manually.');
    }
    setAiLoading(false);
  }

  const set = (k,v) => setProduct(p => ({...p,[k]:v}));

  /* Save */
  async function handleSave() {
    if (!product.name) return;
    setSaving(true);
    const existing = JSON.parse(localStorage.getItem('sa_products')||'[]');
    localStorage.setItem('sa_products', JSON.stringify([
      { ...product, id: Date.now().toString(), createdAt: new Date().toISOString(), imagePreview },
      ...existing,
    ]));
    setSaving(false);
    setSaveMsg('✓ Product saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  /* ── LOGIN ── */
  if (!authed) return (
    <div style={css.loginBg}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={css.loginCard}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{marginBottom:16}}>
          <rect width="40" height="40" rx="9" fill="#1a1a2e"/>
          <path d="M8 20h24M20 8v24" stroke="#e8a020" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="20" cy="20" r="6" stroke="#e8a020" strokeWidth="2"/>
        </svg>
        <h1 style={css.loginTitle}>Admin Panel</h1>
        <p style={css.loginSub}>S&A Screen Printing · Staff Only</p>
        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:10}}>
          <input type="password" placeholder="Admin password" value={password}
            onChange={e=>setPassword(e.target.value)} style={css.loginInput} autoFocus/>
          {authError && <p style={{color:'#f87171',fontSize:13,margin:0}}>{authError}</p>}
          <button type="submit" style={css.loginBtn}>Enter Admin</button>
        </form>
      </div>
    </div>
  );

  /* ── ADMIN UI ── */
  return (
    <div style={css.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus,textarea:focus{outline:2px solid #e8a020;outline-offset:-1px;}`}</style>

      <header style={css.header}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={css.badge}>ADMIN</span>
          <span style={{fontSize:15,fontWeight:600,color:'#fff'}}>Product Upload</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <a href="/dashboard" style={{color:'#9ca3af',fontSize:13,textDecoration:'none'}}>← Client Portal</a>
          <button onClick={()=>setAuthed(false)} style={css.signOut}>Sign Out</button>
        </div>
      </header>

      <div style={css.layout}>

        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* Step 1 */}
          <div style={css.card}>
            <SectionTitle num="1">Upload Photo</SectionTitle>
            <div
              style={{...css.drop,...(dragOver?{borderColor:'#e8a020',background:'#fffbeb'}:{})}}
              onClick={()=>fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);loadImage(e.dataTransfer.files[0])}}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{width:'100%',maxHeight:250,objectFit:'contain'}}/>
                : <div style={{textAlign:'center',padding:24}}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-5-5L5 21"/>
                    </svg>
                    <p style={{fontSize:13,color:'#6b7280',margin:'10px 0 4px'}}>Drag & drop or click</p>
                    <p style={{fontSize:11,color:'#9ca3af',margin:0}}>PNG · JPG · WEBP</p>
                  </div>
              }
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>loadImage(e.target.files[0])}/>
            </div>
            {imagePreview && (
              <button onClick={()=>{setPreview(null);setImageFile(null)}}
                style={{marginTop:8,fontSize:12,color:'#dc2626',background:'none',border:'none',cursor:'pointer',padding:0}}>
                Remove image
              </button>
            )}
          </div>

          {/* Step 2 */}
          <div style={css.card}>
            <SectionTitle num="2">AI Auto-Fill</SectionTitle>
            <p style={{fontSize:13,color:'#6b7280',lineHeight:1.6,marginBottom:14}}>
              Upload a garment photo above, then click below. Claude analyzes the image and fills in all product details automatically.
            </p>
            <button onClick={runAiFill} disabled={!imagePreview||aiLoading}
              style={{...css.aiBtn,...(!imagePreview||aiLoading?{opacity:0.4,cursor:'not-allowed'}:{})}}>
              {aiLoading
                ? <><span style={css.spinner}/>Analyzing image…</>
                : '✦ Fill with AI'}
            </button>
            {aiStatus && (
              <p style={{fontSize:12,marginTop:10,lineHeight:1.5,
                color:aiStatus.startsWith('✓')?'#16a34a':aiStatus.startsWith('⚠')?'#dc2626':'#6b7280'}}>
                {aiStatus}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT – Form */}
        <div style={css.card}>
          <SectionTitle num="3">Product Details</SectionTitle>

          <div style={css.grid}>
            <F label="Product Name" span={2}>
              <input style={css.inp} value={product.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Port & Company Core Cotton Tee"/>
            </F>
            <F label="SKU">
              <input style={css.inp} value={product.sku} onChange={e=>set('sku',e.target.value)} placeholder="PC54"/>
            </F>
            <F label="Brand">
              <input style={css.inp} value={product.brand} onChange={e=>set('brand',e.target.value)} placeholder="Port & Company"/>
            </F>
            <F label="Category">
              <select style={css.inp} value={product.category} onChange={e=>set('category',e.target.value)}>
                <option value="">Select…</option>
                {['T-Shirts','Hoodies','Sweatshirts','Polos','Button-Downs','Tanks','Hats','Beanies','Bags','Jackets','Youth','Accessories'].map(c=>(
                  <option key={c}>{c}</option>
                ))}
              </select>
            </F>
            <F label="Subcategory">
              <input style={css.inp} value={product.subcategory} onChange={e=>set('subcategory',e.target.value)} placeholder="Short Sleeve, Pullover…"/>
            </F>
            <F label="Description" span={2}>
              <textarea style={{...css.inp,height:76,resize:'vertical'}} value={product.description}
                onChange={e=>set('description',e.target.value)} placeholder="Marketing description for clients…"/>
            </F>
            <F label="Material">
              <input style={css.inp} value={product.material} onChange={e=>set('material',e.target.value)} placeholder="100% Cotton"/>
            </F>
            <F label="Weight">
              <input style={css.inp} value={product.weight} onChange={e=>set('weight',e.target.value)} placeholder="5.3 oz"/>
            </F>
            <F label="Base Price ($)">
              <input style={css.inp} type="number" step="0.01" value={product.basePrice} onChange={e=>set('basePrice',e.target.value)} placeholder="4.50"/>
            </F>
            <F label="MSRP ($)">
              <input style={css.inp} type="number" step="0.01" value={product.msrp} onChange={e=>set('msrp',e.target.value)} placeholder="14.99"/>
            </F>
            <F label="Min Qty">
              <input style={css.inp} type="number" value={product.minQty} onChange={e=>set('minQty',e.target.value)} placeholder="12"/>
            </F>
            <F label="Country of Origin">
              <input style={css.inp} value={product.countryOfOrigin} onChange={e=>set('countryOfOrigin',e.target.value)} placeholder="Honduras"/>
            </F>
            <F label="Colors (comma-separated)" span={2}>
              <input style={css.inp} value={product.colors} onChange={e=>set('colors',e.target.value)} placeholder="White, Black, Navy, Red…"/>
            </F>
            <F label="Sizes (comma-separated)" span={2}>
              <input style={css.inp} value={product.sizes} onChange={e=>set('sizes',e.target.value)} placeholder="XS, S, M, L, XL, 2XL, 3XL"/>
            </F>
            <F label="Print Areas (comma-separated)" span={2}>
              <input style={css.inp} value={product.printAreas} onChange={e=>set('printAreas',e.target.value)} placeholder="Front Left Chest, Full Back, Left Sleeve…"/>
            </F>
            <F label="Features (comma-separated)" span={2}>
              <input style={css.inp} value={product.features} onChange={e=>set('features',e.target.value)} placeholder="Preshrunk, Tearaway label, Side-seamed…"/>
            </F>
            <F label="Tags (comma-separated)" span={2}>
              <input style={css.inp} value={product.tags} onChange={e=>set('tags',e.target.value)} placeholder="bestseller, basic, unisex…"/>
            </F>
            <F label="Care Instructions" span={2}>
              <input style={css.inp} value={product.careInstructions} onChange={e=>set('careInstructions',e.target.value)} placeholder="Machine wash cold, tumble dry low"/>
            </F>
            <F label="In Stock" span={2}>
              <label style={{display:'flex',alignItems:'center',fontSize:13,color:'#374151',cursor:'pointer',gap:8}}>
                <input type="checkbox" checked={product.inStock} onChange={e=>set('inStock',e.target.checked)}/>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </label>
            </F>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:20,paddingTop:16,borderTop:'1px solid #f3f4f6'}}>
            <button onClick={handleSave} disabled={saving||!product.name}
              style={{...css.saveBtn,...(saving||!product.name?{opacity:0.4,cursor:'not-allowed'}:{})}}>
              {saving?'Saving…':'Save Product'}
            </button>
            <button onClick={()=>{setProduct(EMPTY);setPreview(null);setImageFile(null);setAiStatus('');}}
              style={css.resetBtn}>
              Reset
            </button>
            {saveMsg && <span style={{fontSize:13,color:'#16a34a',fontWeight:500}}>{saveMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ num, children }) {
  return (
    <h2 style={{fontSize:14,fontWeight:600,color:'#111827',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
      <span style={{width:22,height:22,background:'#1a1a2e',color:'#e8a020',borderRadius:'50%',
        display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
        {num}
      </span>
      {children}
    </h2>
  );
}

function F({ label, children, span=1 }) {
  return (
    <div style={{gridColumn:`span ${span}`}}>
      <label style={{display:'block',fontSize:11,fontWeight:600,color:'#6b7280',
        textTransform:'uppercase',letterSpacing:0.4,marginBottom:5}}>
        {label}
      </label>
      {children}
    </div>
  );
}

const css = {
  loginBg:    { minHeight:'100vh',background:'#0f0f1a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif" },
  loginCard:  { background:'#1a1a2e',border:'1px solid rgba(232,160,32,0.2)',borderRadius:16,padding:'44px 40px',width:320,textAlign:'center' },
  loginTitle: { color:'#fff',fontSize:22,fontWeight:700,margin:'0 0 4px' },
  loginSub:   { color:'#6b7280',fontSize:13,marginBottom:28 },
  loginInput: { width:'100%',padding:'11px 14px',background:'#0f0f1a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff',fontSize:14,textAlign:'center',outline:'none',fontFamily:'inherit',boxSizing:'border-box' },
  loginBtn:   { width:'100%',padding:'12px 0',background:'#e8a020',color:'#1a1a2e',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer' },
  page:       { minHeight:'100vh',background:'#f3f4f6',fontFamily:"'Inter',sans-serif" },
  header:     { background:'#1a1a2e',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:50 },
  badge:      { background:'#e8a020',color:'#1a1a2e',fontSize:10,fontWeight:800,letterSpacing:1.5,padding:'3px 8px',borderRadius:4 },
  signOut:    { background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#fff',padding:'4px 12px',borderRadius:6,fontSize:12,cursor:'pointer' },
  layout:     { display:'grid',gridTemplateColumns:'310px 1fr',gap:20,padding:20,maxWidth:1280,margin:'0 auto' },
  card:       { background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',padding:22 },
  drop:       { border:'2px dashed #d1d5db',borderRadius:8,minHeight:180,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',transition:'all 0.15s' },
  aiBtn:      { width:'100%',padding:'11px 0',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 },
  spinner:    { width:13,height:13,border:'2px solid rgba(232,160,32,0.3)',borderTopColor:'#e8a020',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' },
  grid:       { display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 },
  inp:        { width:'100%',padding:'7px 9px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,color:'#111827',background:'#fff',boxSizing:'border-box',fontFamily:'inherit' },
  saveBtn:    { flex:1,padding:'11px 0',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer' },
  resetBtn:   { padding:'11px 18px',background:'transparent',border:'1px solid #d1d5db',borderRadius:8,fontSize:13,color:'#6b7280',cursor:'pointer' },
};
