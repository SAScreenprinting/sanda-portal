'use client';
import { useState, useRef, useEffect } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sanda2024admin';

const CATEGORIES = [
  'T-Shirts','Hoodies','Sweatshirts','Polos','Button-Downs',
  'Tanks','Hats','Beanies','Bags','Jackets',
  'Accessories','Youth','Laser Engraving',
];

const ALL_COLORS = [
  'White','Black','Navy','Red','Royal Blue','Forest Green',
  'Purple','Gold','Gray','Maroon','Orange','Pink',
  'Light Blue','Olive','Brown','Heather Gray','Charcoal',
];

const PRINT_AREAS = [
  'Front Left Chest','Full Front','Full Back',
  'Left Sleeve','Right Sleeve','Hood','Bottom Hem',
  'Laser Front','Laser Back','Laser Side',
];

const DECORATION_METHODS = [
  { id:'screenprint',  label:'Screen Print',     priceLabel:'$30/screen' },
  { id:'dtf',          label:'DTF',              priceLabel:'Flat rate' },
  { id:'embroidery',   label:'Embroidery',       priceLabel:'By stitch count' },
  { id:'laser',        label:'Laser Engraving',  priceLabel:'By area' },
];

const EMPTY_FORM = {
  name:'', brand:'', category:'', sku:'', description:'',
  colors:[], printAreas:[], decorationMethods:[],
  isLaser:false, imagePreview:null,
};

export default function AdminGarmentsPage() {
  const [authed, setAuthed]     = useState(false);
  const [pw, setPw]             = useState('');
  const [pwErr, setPwErr]       = useState('');
  const [garments, setGarments] = useState([]);
  const [tab, setTab]           = useState('upload');
  const [form, setForm]         = useState(EMPTY_FORM);
  const [dragOver, setDragOver] = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [deleting, setDeleting] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sa_garments');
      if (stored) setGarments(JSON.parse(stored));
    } catch(e) {}
  }, []);

  function login(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) setAuthed(true);
    else { setPwErr('Incorrect password.'); setPw(''); }
  }

  function loadImage(file) {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setForm(f => ({ ...f, imagePreview: e.target.result }));
    reader.readAsDataURL(file);
  }

  function toggleArr(key, val) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  }

  function saveGarment() {
    if (!form.name || !form.category) { setSaveMsg('⚠ Name and category are required.'); return; }
    const newGarment = {
      ...form,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isLaser: form.category === 'Laser Engraving',
    };
    const updated = [newGarment, ...garments];
    setGarments(updated);
    localStorage.setItem('sa_garments', JSON.stringify(updated));
    setSaveMsg('✓ Garment saved to studio!');
    setForm(EMPTY_FORM);
    setTimeout(() => setSaveMsg(''), 3500);
  }

  function deleteGarment(id) {
    const updated = garments.filter(g => g.id !== id);
    setGarments(updated);
    localStorage.setItem('sa_garments', JSON.stringify(updated));
    setDeleting(null);
  }

  if (!authed) return (
    <div style={s.loginBg}>
      <div style={s.loginCard}>
        <div style={{ fontSize:36, marginBottom:12 }}>👕</div>
        <h1 style={s.loginTitle}>Garment Manager</h1>
        <p style={s.loginSub}>S&A Admin · Staff Only</p>
        <form onSubmit={login} style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <input type="password" placeholder="Admin password" value={pw}
            onChange={e => setPw(e.target.value)} style={s.loginInput} autoFocus/>
          {pwErr && <p style={{ color:'#f87171', fontSize:13, margin:0 }}>{pwErr}</p>}
          <button type="submit" style={s.loginBtn}>Enter</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`* { box-sizing: border-box; } input:focus,select:focus,textarea:focus { outline: 2px solid #e8a020; outline-offset: -1px; }`}</style>

      <header style={s.header}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={s.badge}>ADMIN</span>
          <span style={{ fontSize:15, fontWeight:600, color:'#fff' }}>Garment Manager</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <a href="/admin" style={{ color:'#9ca3af', fontSize:13, textDecoration:'none' }}>← Admin Panel</a>
          <a href="/dashboard" style={{ color:'#9ca3af', fontSize:13, textDecoration:'none' }}>Client Portal</a>
          <button onClick={() => setAuthed(false)} style={s.signOut}>Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:24 }}>

        {/* Tabs */}
        <div style={s.tabs}>
          {[['upload','➕ Upload Garment'],['library',`📚 Library (${garments.length})`]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ ...s.tab, ...(tab===id ? s.tabActive : {}) }}>
              {label}
            </button>
          ))}
        </div>

        {/* UPLOAD TAB */}
        {tab === 'upload' && (
          <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:24 }}>

            {/* Left — photo upload */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={s.card}>
                <h2 style={s.cardTitle}>Garment Photo</h2>
                <div
                  style={{ ...s.drop, ...(dragOver ? { borderColor:'#e8a020', background:'#fffbeb' } : {}) }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); loadImage(e.dataTransfer.files[0]); }}>
                  {form.imagePreview
                    ? <img src={form.imagePreview} alt="garment" style={{ width:'100%', maxHeight:260, objectFit:'contain' }}/>
                    : <div style={{ textAlign:'center', padding:24 }}>
                        <div style={{ fontSize:40, marginBottom:8 }}>👕</div>
                        <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 4px' }}>Drag & drop or click</p>
                        <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>PNG · JPG · WEBP</p>
                      </div>
                  }
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                    onChange={e => loadImage(e.target.files[0])}/>
                </div>
                {form.imagePreview && (
                  <button onClick={() => setForm(f => ({ ...f, imagePreview:null }))}
                    style={{ marginTop:8, fontSize:12, color:'#dc2626', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Remove photo
                  </button>
                )}
              </div>

              {/* Decoration methods */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>Decoration Methods</h2>
                <p style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Select all methods available for this garment</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {DECORATION_METHODS.map(m => (
                    <label key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, border:`1px solid ${form.decorationMethods.includes(m.id)?'#e8a020':'#e5e7eb'}`, background:form.decorationMethods.includes(m.id)?'#fffbeb':'#f9fafb', cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <input type="checkbox" checked={form.decorationMethods.includes(m.id)}
                          onChange={() => toggleArr('decorationMethods', m.id)} style={{ width:16, height:16 }}/>
                        <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{m.label}</span>
                      </div>
                      <span style={{ fontSize:11, color:'#6b7280', background:'#f3f4f6', padding:'2px 8px', borderRadius:20 }}>{m.priceLabel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — details */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Garment Details</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

                <F label="Garment Name" span={2}>
                  <input style={s.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} placeholder="e.g. Port & Company Core Cotton Tee"/>
                </F>

                <F label="Brand">
                  <input style={s.inp} value={form.brand} onChange={e => setForm(f => ({ ...f, brand:e.target.value }))} placeholder="Port & Company"/>
                </F>

                <F label="SKU">
                  <input style={s.inp} value={form.sku} onChange={e => setForm(f => ({ ...f, sku:e.target.value }))} placeholder="PC54"/>
                </F>

                <F label="Category" span={2}>
                  <select style={s.inp} value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </F>

                <F label="Description" span={2}>
                  <textarea style={{ ...s.inp, height:70, resize:'vertical' }} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description:e.target.value }))}
                    placeholder="Brief description shown to clients in the studio…"/>
                </F>

                {/* Available Colors */}
                <F label="Available Colors" span={2}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                    {ALL_COLORS.map(c => (
                      <button key={c} onClick={() => toggleArr('colors', c)}
                        style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${form.colors.includes(c)?'#e8a020':'#d1d5db'}`, background:form.colors.includes(c)?'#fffbeb':'white', color:form.colors.includes(c)?'#92400e':'#374151', fontSize:12, cursor:'pointer', fontWeight:form.colors.includes(c)?'600':'400' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </F>

                {/* Print Areas */}
                <F label="Available Print Areas" span={2}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                    {PRINT_AREAS.map(a => (
                      <button key={a} onClick={() => toggleArr('printAreas', a)}
                        style={{ padding:'4px 10px', borderRadius:20, border:`1px solid ${form.printAreas.includes(a)?'#1e40af':'#d1d5db'}`, background:form.printAreas.includes(a)?'#dbeafe':'white', color:form.printAreas.includes(a)?'#1e40af':'#374151', fontSize:12, cursor:'pointer', fontWeight:form.printAreas.includes(a)?'600':'400' }}>
                        {a}
                      </button>
                    ))}
                  </div>
                </F>

              </div>

              {/* Summary */}
              {(form.colors.length > 0 || form.decorationMethods.length > 0) && (
                <div style={{ marginTop:16, padding:14, background:'#f9fafb', borderRadius:8, fontSize:13 }}>
                  {form.colors.length > 0 && <div style={{ marginBottom:6 }}><strong>Colors:</strong> {form.colors.join(', ')}</div>}
                  {form.printAreas.length > 0 && <div style={{ marginBottom:6 }}><strong>Print Areas:</strong> {form.printAreas.join(', ')}</div>}
                  {form.decorationMethods.length > 0 && <div><strong>Methods:</strong> {form.decorationMethods.map(id => DECORATION_METHODS.find(m=>m.id===id)?.label).join(', ')}</div>}
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20, paddingTop:16, borderTop:'1px solid #f3f4f6' }}>
                <button onClick={saveGarment} disabled={!form.name || !form.category}
                  style={{ ...s.saveBtn, ...(!form.name||!form.category?{ opacity:0.4, cursor:'not-allowed' }:{}) }}>
                  Save to Studio Library
                </button>
                <button onClick={() => setForm(EMPTY_FORM)} style={s.resetBtn}>Reset</button>
                {saveMsg && <span style={{ fontSize:13, fontWeight:500, color:saveMsg.startsWith('✓')?'#059669':'#dc2626' }}>{saveMsg}</span>}
              </div>
            </div>
          </div>
        )}

        {/* LIBRARY TAB */}
        {tab === 'library' && (
          <div>
            {garments.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👕</div>
                <p style={{ fontSize:16, fontWeight:600 }}>No garments yet</p>
                <p style={{ fontSize:14 }}>Upload your first garment to make it available in the Design Studio</p>
                <button onClick={() => setTab('upload')} style={{ ...s.saveBtn, marginTop:12 }}>Upload First Garment</button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
                {garments.map(g => (
                  <div key={g.id} style={s.garmentCard}>
                    <div style={{ height:180, background:'#f9fafb', borderRadius:8, overflow:'hidden', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {g.imagePreview
                        ? <img src={g.imagePreview} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                        : <div style={{ fontSize:48, opacity:0.3 }}>👕</div>
                      }
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{g.name}</div>
                        <div style={{ fontSize:12, color:'#6b7280' }}>{g.brand} · {g.sku}</div>
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'#dbeafe', color:'#1e40af' }}>{g.category}</span>
                    </div>
                    {g.colors?.length > 0 && (
                      <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>
                        <strong>Colors:</strong> {g.colors.slice(0,4).join(', ')}{g.colors.length>4?` +${g.colors.length-4} more`:''}
                      </div>
                    )}
                    {g.decorationMethods?.length > 0 && (
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                        {g.decorationMethods.map(id => {
                          const m = DECORATION_METHODS.find(m=>m.id===id);
                          return <span key={id} style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:20, background:'#f0fdf4', color:'#166534', border:'1px solid #bbf7d0' }}>{m?.label}</span>;
                        })}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                      <button onClick={() => setDeleting(g.id)}
                        style={{ flex:1, padding:'7px 0', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, color:'#dc2626', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Delete
                      </button>
                    </div>
                    {deleting === g.id && (
                      <div style={{ marginTop:8, padding:10, background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca' }}>
                        <p style={{ fontSize:12, color:'#991b1b', margin:'0 0 8px' }}>Delete this garment from the studio?</p>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => deleteGarment(g.id)} style={{ flex:1, padding:'5px 0', background:'#dc2626', border:'none', borderRadius:5, color:'white', fontSize:12, fontWeight:600, cursor:'pointer' }}>Yes, Delete</button>
                          <button onClick={() => setDeleting(null)} style={{ flex:1, padding:'5px 0', background:'white', border:'1px solid #d1d5db', borderRadius:5, color:'#374151', fontSize:12, cursor:'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function F({ label, children, span=1 }) {
  return (
    <div style={{ gridColumn:`span ${span}` }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.4, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  loginBg:    { minHeight:'100vh', background:'#0f0f1a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" },
  loginCard:  { background:'#1a1a2e', border:'1px solid rgba(232,160,32,0.2)', borderRadius:16, padding:'44px 40px', width:320, textAlign:'center' },
  loginTitle: { color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 4px' },
  loginSub:   { color:'#6b7280', fontSize:13, marginBottom:28 },
  loginInput: { width:'100%', padding:'11px 14px', background:'#0f0f1a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:14, textAlign:'center', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  loginBtn:   { width:'100%', padding:'12px 0', background:'#e8a020', color:'#1a1a2e', border:'none', borderRadius:8, fontSize:15, fontWeight:700, cursor:'pointer' },
  page:       { minHeight:'100vh', background:'#f3f4f6', fontFamily:"'Inter',sans-serif" },
  header:     { background:'#1a1a2e', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:50 },
  badge:      { background:'#e8a020', color:'#1a1a2e', fontSize:10, fontWeight:800, letterSpacing:1.5, padding:'3px 8px', borderRadius:4 },
  signOut:    { background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'4px 12px', borderRadius:6, fontSize:12, cursor:'pointer' },
  tabs:       { display:'flex', gap:4, marginBottom:24, background:'#e5e7eb', padding:4, borderRadius:10, width:'fit-content' },
  tab:        { padding:'8px 20px', background:'transparent', border:'none', borderRadius:8, fontSize:13, fontWeight:500, color:'#6b7280', cursor:'pointer' },
  tabActive:  { background:'#fff', color:'#111827', fontWeight:600, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' },
  card:       { background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:22 },
  cardTitle:  { fontSize:15, fontWeight:600, color:'#111827', marginBottom:16, marginTop:0 },
  drop:       { border:'2px dashed #d1d5db', borderRadius:8, minHeight:180, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', transition:'all 0.15s' },
  inp:        { width:'100%', padding:'7px 9px', border:'1px solid #d1d5db', borderRadius:6, fontSize:13, color:'#111827', background:'#fff', fontFamily:'inherit' },
  saveBtn:    { padding:'10px 24px', background:'#1a1a2e', color:'#e8a020', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' },
  resetBtn:   { padding:'10px 18px', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, color:'#6b7280', cursor:'pointer' },
  garmentCard:{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', padding:18, display:'flex', flexDirection:'column' },
};
