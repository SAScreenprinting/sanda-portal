'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { DEFAULT_PRODUCTS, toStudioFormat } from '@/lib/products';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];


const DECORATION_METHODS = [
  { id:'screenprint', label:'Screen Print',    icon:'🖨', note:'$30 per screen/color setup' },
  { id:'dtf',         label:'DTF',             icon:'🖨', note:'Full color, no setup fee' },
  { id:'embroidery',  label:'Embroidery',      icon:'🧵', note:'Priced by stitch count' },
  { id:'laser',       label:'Laser Engraving', icon:'🔴', note:'For hard goods & leather' },
];

const QTY_TIERS = [12, 24, 48, 72, 144, 288];
const CATEGORIES = ['All','T-Shirts','Hoodies','Sweatshirts','Polos','Hats','Beanies','Bags','Jackets'];

const SIZE_CHARTS = {
  'T-Shirts':    { headers:['Size','Chest (in)','Length','Sleeve'], rows:[['S','36–38','27','33'],['M','39–41','28','34'],['L','42–44','29','35'],['XL','45–47','30','36'],['2XL','48–50','31','37'],['3XL','51–53','32','38']] },
  'Hoodies':     { headers:['Size','Chest (in)','Length','Sleeve'], rows:[['S','36–38','27','33'],['M','39–41','28','34'],['L','42–44','29','35'],['XL','45–47','30','36'],['2XL','48–50','31','37'],['3XL','51–53','32','38']] },
  'Sweatshirts': { headers:['Size','Chest (in)','Length','Sleeve'], rows:[['S','36–38','27','33'],['M','39–41','28','34'],['L','42–44','29','35'],['XL','45–47','30','36'],['2XL','48–50','31','37'],['3XL','51–53','32','38']] },
  'Polos':       { headers:['Size','Chest (in)','Length','Sleeve'], rows:[['S','36–38','27','33'],['M','39–41','28','34'],['L','42–44','29','35'],['XL','45–47','30','36'],['2XL','48–50','31','37'],['3XL','51–53','32','38']] },
  'Jackets':     { headers:['Size','Chest (in)','Length','Sleeve'], rows:[['S','38–40','28','34'],['M','41–43','29','35'],['L','44–46','30','36'],['XL','47–49','31','37'],['2XL','50–52','32','38'],['3XL','53–55','33','39']] },
  'Hats':        { headers:['Size','Head Circumference','Fitted Size'], rows:[['S/M','21–22"','6⅝–6⅞'],['L/XL','22–23"','7–7¼'],['One Size','21–23"','Adjustable']] },
  'Beanies':     { headers:['Size','Head Circumference','Notes'], rows:[['One Size','21–24"','Stretches to fit all']] },
  'Bags':        { headers:['Item','Width','Height','Depth'], rows:[['Tote Bag','14"','16"','4"'],['Backpack','12"','18"','6"']] },
};

const SAVED_KEY = 'sanda_saved_designs';

export default function StudioPage() {
  const [catFilter, setCatFilter]           = useState('All');
  const [showPicker, setShowPicker]         = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView]                     = useState('front');
  const [orderType, setOrderType]           = useState('');
  const [fulfillment, setFulfillment]       = useState('');
  const [quantity, setQuantity]             = useState(24);
  const [customQty, setCustomQty]           = useState('');
  const [printArea, setPrintArea]           = useState('');
  const [decoMethod, setDecoMethod]         = useState('');
  const [screenColors, setScreenColors]     = useState(1);
  const [notes, setNotes]                   = useState('');
  const [design, setDesign]                 = useState(null);
  const [designPos, setDesignPos]           = useState({ x:0.25, y:0.25, w:0.50, h:0.45 });
  const [isDragging, setIsDragging]         = useState(false);
  const [isResizing, setIsResizing]         = useState(false);
  const [dragOffset, setDragOffset]         = useState({ ox:0, oy:0 });
  const [selected, setSelected]             = useState(false);
  const [zoom, setZoom]                     = useState(100);
  const [submitted, setSubmitted]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  // Size chart
  const [showSizeChart, setShowSizeChart]   = useState(false);

  // Saved designs
  const [savedDesigns, setSavedDesigns]     = useState([]);
  const [showSaved, setShowSaved]           = useState(false);
  const [saveNameInput, setSaveNameInput]   = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveSuccess, setSaveSuccess]       = useState(false);

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);

  const canvasRef = useRef();
  const fileRef   = useRef();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      setSavedDesigns(stored);
    } catch {}

    try {
      const adminRaw = JSON.parse(localStorage.getItem('sanda_products') || '[]');
      if (adminRaw.length > 0) {
        const adminProducts = adminRaw.map(toStudioFormat);
        const adminSkus = new Set(adminProducts.map(p => p.sku));
        setProducts([...adminProducts, ...DEFAULT_PRODUCTS.filter(p => !adminSkus.has(p.sku))]);
      }
    } catch {}
  }, []);

  function selectProduct(p) {
    setSelectedProduct(p);
    setPrintArea(p.printAreas[0] || '');
    setDecoMethod(p.decorationMethods[0] || '');
    setView('front');
    setDesign(null);
    setSelected(false);
    setOrderType('');
    setFulfillment('');
    setShowPicker(false);
  }

  function handleUpload(file) {
    if (!file?.type.startsWith('image/')) return;
    setDesign(URL.createObjectURL(file));
    setSelected(true);
  }

  function getRelPos(e) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { mx:0, my:0 };
    return { mx:(e.clientX-rect.left)/rect.width, my:(e.clientY-rect.top)/rect.height };
  }

  function onMouseDown(e) {
    if (!design) return;
    const { mx, my } = getRelPos(e);
    const { x, y, w, h } = designPos;
    if (Math.abs(mx-(x+w)) < 0.05 && Math.abs(my-(y+h)) < 0.05) { setIsResizing(true); return; }
    if (mx>=x && mx<=x+w && my>=y && my<=y+h) { setIsDragging(true); setDragOffset({ ox:mx-x, oy:my-y }); setSelected(true); return; }
    setSelected(false);
  }

  function onMouseMove(e) {
    if (!isDragging && !isResizing) return;
    const { mx, my } = getRelPos(e);
    if (isDragging) setDesignPos(p => ({ ...p, x:Math.max(0,Math.min(0.95-p.w,mx-dragOffset.ox)), y:Math.max(0,Math.min(0.95-p.h,my-dragOffset.oy)) }));
    if (isResizing) setDesignPos(p => ({ ...p, w:Math.max(0.05,Math.min(0.9-p.x,mx-p.x)), h:Math.max(0.05,Math.min(0.9-p.y,my-p.y)) }));
  }

  function onMouseUp() { setIsDragging(false); setIsResizing(false); }

  function submitQuote() {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1500);
  }

  function saveDesign() {
    if (!selectedProduct || !saveNameInput.trim()) return;
    const entry = {
      id: Date.now(),
      name: saveNameInput.trim(),
      savedAt: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      printArea,
      decoMethod,
      orderType,
      fulfillment,
      quantity,
      screenColors,
      notes,
    };
    const updated = [entry, ...savedDesigns].slice(0, 20);
    setSavedDesigns(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    setSaveNameInput('');
    setShowSavePrompt(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function loadSavedDesign(d) {
    const product = products.find(p => p.id === d.productId);
    if (!product) return;
    selectProduct(product);
    setPrintArea(d.printArea || product.printAreas[0]);
    setDecoMethod(d.decoMethod || product.decorationMethods[0]);
    setOrderType(d.orderType || '');
    setFulfillment(d.fulfillment || '');
    setQuantity(d.quantity || 24);
    setScreenColors(d.screenColors || 1);
    setNotes(d.notes || '');
    setShowSaved(false);
  }

  function deleteSavedDesign(id) {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  }

  const filtered = catFilter==='All' ? products : products.filter(p => p.category===catFilter);
  const canSubmit = selectedProduct && orderType && decoMethod && (orderType==='pod' || (orderType==='bulk' && fulfillment));
  const isLaser = decoMethod === 'laser';
  const garmentImage = selectedProduct ? (view==='front' ? selectedProduct.frontImage : selectedProduct.backImage) : null;
  const canvasW = Math.round(340 * zoom / 100);
  const canvasH = Math.round(380 * zoom / 100);
  const sizeChart = selectedProduct ? SIZE_CHARTS[selectedProduct.category] : null;

  return (
    <div style={{ display:'flex', height:'100vh', background:'#1c1c1c', fontFamily:'Inter,sans-serif', overflow:'hidden' }}>
      <style>{`* { box-sizing:border-box; } input[type=range]{ accent-color:#e8a020; }`}</style>

      {/* LEFT RAIL */}
      <div style={{ width:56, background:'#111', borderRight:'1px solid #2a2a2a', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:4, flexShrink:0 }}>
        <a href="/dashboard" style={{ display:'block', marginBottom:12, textDecoration:'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#2a2a2a"/>
            <path d="M5 14h18M14 5v18" stroke="#e8a020" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </a>
        <button onClick={() => fileRef.current?.click()} title="Upload Design"
          style={{ width:38,height:38,background:'transparent',border:'none',color:'#777',cursor:'pointer',borderRadius:8,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>⬆</button>
        <button onClick={() => setShowPicker(true)} title="Change Product"
          style={{ width:38,height:38,background:'transparent',border:'none',color:'#777',cursor:'pointer',borderRadius:8,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>👕</button>
        <button onClick={() => setShowSaved(true)} title="Saved Designs"
          style={{ width:38,height:38,background:'transparent',border:'none',color:savedDesigns.length>0?'#e8a020':'#555',cursor:'pointer',borderRadius:8,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center', position:'relative' }}>
          📂
          {savedDesigns.length > 0 && <span style={{ position:'absolute', top:4, right:4, width:8, height:8, background:'#e8a020', borderRadius:'50%' }}/>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleUpload(e.target.files[0])}/>
        <div style={{ flex:1 }}/>
        {NAV.filter(n=>n.id!=='studio').map(n => (
          <a key={n.id} href={n.href} title={n.label}
            style={{ width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',color:'#555',textDecoration:'none',borderRadius:8,fontSize:16 }}>
            {n.icon}
          </a>
        ))}
      </div>

      {/* CENTER */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <div style={{ height:48, background:'#111', borderBottom:'1px solid #2a2a2a', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
          <button onClick={() => setShowPicker(true)}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #333', background:'#1a1a1a', color:'#ccc', fontSize:12, cursor:'pointer' }}>
            👕 {selectedProduct ? selectedProduct.name : 'Select Product'}
          </button>
          {selectedProduct && (
            <div style={{ display:'flex', background:'#1a1a1a', borderRadius:6, padding:2, gap:1 }}>
              {['front','back'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding:'3px 12px', borderRadius:4, border:'none', background:view===v?'#333':'transparent', color:view===v?'#fff':'#555', fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>
                  {v}
                </button>
              ))}
            </div>
          )}
          {sizeChart && (
            <button onClick={() => setShowSizeChart(true)}
              style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #333', background:'#1a1a1a', color:'#888', fontSize:12, cursor:'pointer' }}>
              📏 Size Chart
            </button>
          )}
          <div style={{ flex:1 }}/>
          {saveSuccess && <span style={{ fontSize:12, color:'#e8a020', fontWeight:600 }}>✓ Design saved!</span>}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={()=>setZoom(z=>Math.max(50,z-10))} style={{ width:22,height:22,background:'#2a2a2a',border:'none',color:'#ccc',borderRadius:4,cursor:'pointer',fontSize:14 }}>−</button>
            <span style={{ fontSize:12, color:'#777', minWidth:36, textAlign:'center' }}>{zoom}%</span>
            <button onClick={()=>setZoom(z=>Math.min(200,z+10))} style={{ width:22,height:22,background:'#2a2a2a',border:'none',color:'#ccc',borderRadius:4,cursor:'pointer',fontSize:14 }}>+</button>
          </div>
          <a href="/dashboard"
            style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',background:'#2a2a2a',border:'1px solid #3a3a3a',borderRadius:8,color:'#999',textDecoration:'none',fontSize:18,fontWeight:300,marginLeft:8,flexShrink:0 }}
            title="Exit to Dashboard">✕</a>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#242424', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-conic-gradient(#2a2a2a 0% 25%,#242424 0% 50%)', backgroundSize:'24px 24px', opacity:0.5 }}/>

          {!selectedProduct ? (
            <div style={{ textAlign:'center', color:'#555', position:'relative', zIndex:1 }}>
              <div style={{ fontSize:72, marginBottom:16 }}>👕</div>
              <p style={{ fontSize:16, fontWeight:600, color:'#777', margin:'0 0 12px' }}>Select a product to get started</p>
              <button onClick={() => setShowPicker(true)}
                style={{ padding:'10px 24px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Browse Products
              </button>
            </div>
          ) : (
            <div ref={canvasRef}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              style={{ position:'relative', width:canvasW, height:canvasH, cursor:isDragging?'grabbing':'default', userSelect:'none', flexShrink:0 }}>

              <div style={{ position:'absolute', inset:0, filter:'drop-shadow(0 8px 32px rgba(0,0,0,0.6))', borderRadius:8, overflow:'hidden' }}>
                <Image src={garmentImage} alt={selectedProduct.name} fill style={{ objectFit:'contain' }} unoptimized/>
              </div>

              {printArea && (
                <div style={{ position:'absolute', left:'18%', top:'15%', width:'64%', height:'62%', border:`1.5px dashed ${isLaser?'#ef4444':'#e8a020'}`, borderRadius:4, pointerEvents:'none' }}>
                  <span style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:9, color:isLaser?'#ef4444':'#e8a020', background:'rgba(0,0,0,0.7)', padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>{printArea}</span>
                </div>
              )}

              {design && (
                <div style={{ position:'absolute', left:`${designPos.x*100}%`, top:`${designPos.y*100}%`, width:`${designPos.w*100}%`, height:`${designPos.h*100}%`, cursor:isDragging?'grabbing':'move' }}>
                  <img src={design} alt="design" draggable={false}
                    style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', pointerEvents:'none', ...(isLaser?{filter:'grayscale(1) opacity(0.75)'}:{}) }}/>
                  {selected && <>
                    <div style={{ position:'absolute', inset:-1, border:`1.5px solid ${isLaser?'#ef4444':'#e8a020'}`, borderRadius:2, pointerEvents:'none' }}/>
                    {[[0,0],[100,0],[0,100],[100,100]].map(([lx,ly],i) => (
                      <div key={i} style={{ position:'absolute', left:`${lx}%`, top:`${ly}%`, transform:'translate(-50%,-50%)', width:8, height:8, background:isLaser?'#ef4444':'#e8a020', border:'1.5px solid #111', borderRadius:2, cursor:'nwse-resize' }}/>
                    ))}
                    <button onClick={()=>{setDesign(null);setSelected(false);}}
                      style={{ position:'absolute', top:-10, right:-10, width:18, height:18, background:'#dc2626', border:'none', borderRadius:'50%', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>×</button>
                  </>}
                </div>
              )}

              {!design && (
                <div onClick={() => fileRef.current?.click()}
                  style={{ position:'absolute', left:'22%', top:'20%', width:'56%', height:'55%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`rgba(${isLaser?'239,68,68':'232,160,32'},0.04)`, border:`1.5px dashed rgba(${isLaser?'239,68,68':'232,160,32'},0.3)`, borderRadius:4, cursor:'pointer' }}>
                  <div style={{ fontSize:28, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>+</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center' }}>Click to upload your design</div>
                </div>
              )}
            </div>
          )}

          <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#555', whiteSpace:'nowrap' }}>
            {design ? 'Drag to reposition · Corner handles to resize' : selectedProduct ? 'Upload your design to preview on the garment' : ''}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width:272, background:'#111', borderLeft:'1px solid #2a2a2a', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* Upload */}
          <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
            <button onClick={() => fileRef.current?.click()} disabled={!selectedProduct}
              style={{ width:'100%', padding:'10px 0', background:selectedProduct?'#e8a020':'#2a2a2a', color:selectedProduct?'#1a1a1a':'#555', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:selectedProduct?'pointer':'not-allowed' }}>
              ⬆ Upload Your Design
            </button>
            <p style={{ fontSize:10, color:'#555', textAlign:'center', margin:'6px 0 0' }}>PNG · SVG · JPG · PDF · AI</p>
          </div>

          {selectedProduct && <>

            {/* Order Type */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Order Type</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                {[
                  { id:'bulk', icon:'📦', title:'Bulk Order', sub:'Large qty, one print run' },
                  { id:'pod',  icon:'🔁', title:'Print on Demand', sub:'We print & ship per order' },
                ].map(ot => (
                  <button key={ot.id} onClick={() => { setOrderType(ot.id); setFulfillment(''); }}
                    style={{ ...rp.optBtn, ...(orderType===ot.id ? rp.optBtnActive : {}) }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{ot.icon}</span>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{ot.title}</div>
                        <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>{ot.sub}</div>
                      </div>
                    </div>
                    {orderType===ot.id && <span style={{ fontSize:14, color:'#e8a020' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk options */}
            {orderType === 'bulk' && <>
              <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
                <div style={rp.label}>Fulfillment</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {[
                    { id:'ship-all',     icon:'🚚', title:'Ship all at once',   sub:'Full order shipped to you' },
                    { id:'hold-fulfill', icon:'🏭', title:'Hold & fulfill',      sub:'We store & ship per order' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setFulfillment(f.id)}
                      style={{ ...rp.optBtn, ...(fulfillment===f.id ? rp.optBtnActive : {}) }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>{f.icon}</span>
                        <div style={{ textAlign:'left' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{f.title}</div>
                          <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>{f.sub}</div>
                        </div>
                      </div>
                      {fulfillment===f.id && <span style={{ fontSize:14, color:'#e8a020' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
                <div style={rp.label}>Quantity</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginTop:10 }}>
                  {QTY_TIERS.map(q => (
                    <button key={q} onClick={() => { setQuantity(q); setCustomQty(''); }}
                      style={{ padding:'8px 0', borderRadius:6, border:`1px solid ${quantity===q&&!customQty?'#e8a020':'#2a2a2a'}`, background:quantity===q&&!customQty?'rgba(232,160,32,0.1)':'transparent', color:quantity===q&&!customQty?'#e8a020':'#777', fontSize:13, fontWeight:quantity===q&&!customQty?700:400, cursor:'pointer' }}>
                      {q}{q===288?'+':''}
                    </button>
                  ))}
                </div>
                <input type="number" value={customQty} onChange={e=>setCustomQty(e.target.value)}
                  placeholder="Custom qty…" min="1"
                  style={{ width:'100%', marginTop:8, padding:'7px 10px', background:'#1a1a1a', border:`1px solid ${customQty?'#e8a020':'#2a2a2a'}`, borderRadius:6, color:customQty?'#e8a020':'#777', fontSize:13, fontFamily:'inherit' }}/>
              </div>
            </>}

            {/* Print area */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Print Area</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
                {selectedProduct.printAreas.map(area => (
                  <button key={area} onClick={() => setPrintArea(area)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:6, border:`1px solid ${printArea===area?'#e8a020':'#232323'}`, background:printArea===area?'rgba(232,160,32,0.08)':'transparent', color:printArea===area?'#e8a020':'#666', fontSize:12, cursor:'pointer', textAlign:'left' }}>
                    <div style={{ width:6, height:6, borderRadius:1, background:printArea===area?'#e8a020':'#444', flexShrink:0 }}/>
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Decoration method */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Decoration Method</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10 }}>
                {DECORATION_METHODS.filter(m => selectedProduct.decorationMethods.includes(m.id)).map(m => (
                  <button key={m.id} onClick={() => setDecoMethod(m.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:6, border:`1px solid ${decoMethod===m.id?'#e8a020':'#232323'}`, background:decoMethod===m.id?'rgba(232,160,32,0.08)':'transparent', color:decoMethod===m.id?'#e8a020':'#777', fontSize:12, cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:16 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight:600 }}>{m.label}</div>
                      <div style={{ fontSize:10, opacity:0.6, marginTop:1 }}>{m.note}</div>
                    </div>
                    {decoMethod===m.id && <span style={{ marginLeft:'auto', fontSize:12 }}>✓</span>}
                  </button>
                ))}
              </div>

              {decoMethod === 'screenprint' && (
                <div style={{ marginTop:10, padding:10, background:'#1a1a1a', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'#888', marginBottom:8 }}>Number of colors in your design:</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => setScreenColors(c=>Math.max(1,c-1))} style={{ width:28,height:28,background:'#2a2a2a',border:'none',color:'#fff',borderRadius:6,cursor:'pointer',fontSize:16,fontWeight:700 }}>−</button>
                    <span style={{ fontSize:22, fontWeight:700, color:'#e8a020', minWidth:28, textAlign:'center' }}>{screenColors}</span>
                    <button onClick={() => setScreenColors(c=>Math.min(8,c+1))} style={{ width:28,height:28,background:'#2a2a2a',border:'none',color:'#fff',borderRadius:6,cursor:'pointer',fontSize:16,fontWeight:700 }}>+</button>
                    <span style={{ fontSize:12, color:'#666' }}>color{screenColors!==1?'s':''}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#e8a020', fontWeight:600, marginTop:8 }}>
                    Setup: ${30*screenColors} <span style={{ fontSize:11, color:'#666', fontWeight:400 }}>($30 × {screenColors} screen{screenColors!==1?'s':''})</span>
                  </div>
                </div>
              )}
              {decoMethod === 'laser' && (
                <div style={{ marginTop:10, padding:10, background:'rgba(239,68,68,0.07)', borderRadius:8, border:'1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize:11, color:'#f87171', lineHeight:1.5 }}>🔴 Laser mode — design shown in grayscale. Final result will be etched.</div>
                </div>
              )}
            </div>

            {/* Design size */}
            {design && (
              <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
                <div style={rp.label}>Design Size</div>
                <div style={{ marginTop:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#666' }}>Width</span>
                    <span style={{ fontSize:11, color:'#e8a020' }}>{Math.round(designPos.w*100)}%</span>
                  </div>
                  <input type="range" min="5" max="90" value={Math.round(designPos.w*100)}
                    onChange={e=>setDesignPos(p=>({...p,w:parseInt(e.target.value)/100}))} style={{ width:'100%', marginBottom:10 }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#666' }}>Height</span>
                    <span style={{ fontSize:11, color:'#e8a020' }}>{Math.round(designPos.h*100)}%</span>
                  </div>
                  <input type="range" min="5" max="90" value={Math.round(designPos.h*100)}
                    onChange={e=>setDesignPos(p=>({...p,h:parseInt(e.target.value)/100}))} style={{ width:'100%' }}/>
                </div>
                <button onClick={()=>{setDesign(null);setSelected(false);}}
                  style={{ width:'100%', marginTop:10, padding:'6px 0', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:6, color:'#f87171', fontSize:12, cursor:'pointer' }}>
                  Remove Design
                </button>
              </div>
            )}

            {/* Notes */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Additional Notes</div>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Special instructions, deadline, sizes breakdown…"
                style={{ width:'100%', marginTop:8, padding:'8px 10px', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, color:'#ccc', fontSize:12, fontFamily:'inherit', resize:'vertical', minHeight:70, lineHeight:1.5 }}/>
            </div>

            {/* Save design */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              {showSavePrompt ? (
                <div>
                  <input
                    value={saveNameInput}
                    onChange={e => setSaveNameInput(e.target.value)}
                    placeholder="Name this design…"
                    onKeyDown={e => e.key === 'Enter' && saveDesign()}
                    style={{ width:'100%', padding:'7px 10px', background:'#1a1a1a', border:'1px solid #e8a020', borderRadius:6, color:'#e8a020', fontSize:12, fontFamily:'inherit', marginBottom:8 }}
                    autoFocus
                  />
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={saveDesign} disabled={!saveNameInput.trim()}
                      style={{ flex:2, padding:'7px 0', background:saveNameInput.trim()?'#e8a020':'#2a2a2a', color:saveNameInput.trim()?'#1a1a1a':'#555', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      Save
                    </button>
                    <button onClick={() => { setShowSavePrompt(false); setSaveNameInput(''); }}
                      style={{ flex:1, padding:'7px 0', background:'#2a2a2a', border:'none', borderRadius:6, fontSize:12, color:'#777', cursor:'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowSavePrompt(true)}
                  style={{ width:'100%', padding:'8px 0', background:'transparent', border:'1px solid #333', borderRadius:6, color:'#888', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  💾 Save Design
                </button>
              )}
            </div>
          </>}
        </div>

        {/* Submit */}
        <div style={{ padding:14, borderTop:'1px solid #1e1e1e', flexShrink:0 }}>
          {submitted ? (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>✓</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#e8a020', marginBottom:4 }}>Quote Request Sent!</div>
              <div style={{ fontSize:12, color:'#666' }}>We'll be in touch shortly.</div>
              <button onClick={()=>{ setSubmitted(false); setShowPicker(true); setSelectedProduct(null); setOrderType(''); setFulfillment(''); setDesign(null); setNotes(''); }}
                style={{ marginTop:10, padding:'6px 16px', background:'#2a2a2a', border:'none', borderRadius:6, color:'#ccc', fontSize:12, cursor:'pointer' }}>
                Start New Design
              </button>
            </div>
          ) : (
            <>
              {canSubmit && (
                <div style={{ marginBottom:12, padding:10, background:'#1a1a1a', borderRadius:8, fontSize:11, color:'#888', lineHeight:1.8 }}>
                  <div><span style={{ color:'#666' }}>Product:</span> <span style={{ color:'#ccc' }}>{selectedProduct?.name}</span></div>
                  <div><span style={{ color:'#666' }}>Type:</span> <span style={{ color:'#ccc' }}>{orderType==='bulk'?`Bulk — ${customQty||quantity} pcs`:'Print on Demand'}</span></div>
                  {orderType==='bulk' && <div><span style={{ color:'#666' }}>Fulfillment:</span> <span style={{ color:'#ccc' }}>{fulfillment==='ship-all'?'Ship all at once':'Hold & fulfill'}</span></div>}
                  <div><span style={{ color:'#666' }}>Method:</span> <span style={{ color:'#ccc' }}>{DECORATION_METHODS.find(m=>m.id===decoMethod)?.label}</span></div>
                  {decoMethod==='screenprint' && <div><span style={{ color:'#666' }}>Setup fee:</span> <span style={{ color:'#e8a020' }}>${30*screenColors}</span></div>}
                </div>
              )}
              <button onClick={submitQuote} disabled={!canSubmit||submitting}
                style={{ width:'100%', padding:'11px 0', background:canSubmit?'#e8a020':'#2a2a2a', color:canSubmit?'#1a1a1a':'#555', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:canSubmit?'pointer':'not-allowed' }}>
                {submitting ? 'Submitting…' : 'Submit for Quote →'}
              </button>
              {!canSubmit && (
                <div style={{ fontSize:11, color:'#555', textAlign:'center', marginTop:6 }}>
                  {!selectedProduct?'Select a product first':!orderType?'Choose an order type':!fulfillment&&orderType==='bulk'?'Choose fulfillment method':'Choose a decoration method'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* PRODUCT PICKER MODAL */}
      {showPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:100, display:'flex', flexDirection:'column' }}>
          <div style={{ background:'#111', borderBottom:'1px solid #2a2a2a', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>Select a Product</h2>
            {selectedProduct && (
              <button onClick={() => setShowPicker(false)}
                style={{ padding:'6px 16px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Done
              </button>
            )}
          </div>
          <div style={{ background:'#111', padding:'10px 24px', borderBottom:'1px solid #2a2a2a', display:'flex', gap:6, overflowX:'auto', flexShrink:0 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                style={{ padding:'5px 14px', borderRadius:20, border:'none', background:catFilter===cat?'#e8a020':'#2a2a2a', color:catFilter===cat?'#1a1a1a':'#888', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontWeight:catFilter===cat?700:400 }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ flex:1, overflow:'auto', padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
              {filtered.map(p => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button key={p.id} onClick={() => selectProduct(p)}
                    style={{ background:isSelected?'#1a1400':'#1a1a1a', border:`2px solid ${isSelected?'#e8a020':'#2a2a2a'}`, borderRadius:10, padding:14, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                    <div style={{ height:160, background:'#111', borderRadius:6, marginBottom:10, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                      <Image src={p.frontImage} alt={p.name} fill style={{ objectFit:'contain' }} unoptimized/>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>{p.brand} · {p.sku}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:10, background:'#252525', color:'#777' }}>{p.category}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'#e8a020' }}>${p.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SIZE CHART MODAL */}
      {showSizeChart && sizeChart && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#1a1a1a', borderRadius:14, padding:28, maxWidth:520, width:'100%', border:'1px solid #2a2a2a' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h3 style={{ color:'white', fontSize:16, fontWeight:700, margin:'0 0 3px' }}>📏 Size Chart</h3>
                <div style={{ fontSize:12, color:'#666' }}>{selectedProduct?.name} · {selectedProduct?.category}</div>
              </div>
              <button onClick={() => setShowSizeChart(false)}
                style={{ width:28, height:28, background:'#2a2a2a', border:'none', borderRadius:6, color:'#999', cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {sizeChart.headers.map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'#e8a020', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid #2a2a2a', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.rows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding:'10px 14px', color:j===0?'white':'#aaa', fontWeight:j===0?700:400, borderBottom:'1px solid #1e1e1e', whiteSpace:'nowrap' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:16, padding:'10px 14px', background:'rgba(232,160,32,0.07)', borderRadius:8, fontSize:11, color:'#888', lineHeight:1.6 }}>
              All measurements in inches unless noted. Sizes may vary slightly by brand — when in doubt, size up.
            </div>
          </div>
        </div>
      )}

      {/* SAVED DESIGNS MODAL */}
      {showSaved && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:150, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#1a1a1a', borderRadius:14, padding:28, maxWidth:520, width:'100%', border:'1px solid #2a2a2a', maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexShrink:0 }}>
              <div>
                <h3 style={{ color:'white', fontSize:16, fontWeight:700, margin:'0 0 3px' }}>📂 Saved Designs</h3>
                <div style={{ fontSize:12, color:'#666' }}>{savedDesigns.length} saved · stored on this device</div>
              </div>
              <button onClick={() => setShowSaved(false)}
                style={{ width:28, height:28, background:'#2a2a2a', border:'none', borderRadius:6, color:'#999', cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {savedDesigns.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#555' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>💾</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#777' }}>No saved designs yet</div>
                  <div style={{ fontSize:12, color:'#555', marginTop:4 }}>Configure a design and click "Save Design" to save it here.</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {savedDesigns.map(d => (
                    <div key={d.id} style={{ background:'#111', borderRadius:10, padding:'14px 16px', border:'1px solid #2a2a2a', display:'flex', alignItems:'center', gap:'14px' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                        <div style={{ fontSize:11, color:'#666', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.productName}</div>
                        <div style={{ fontSize:11, color:'#555', marginTop:2 }}>{d.savedAt} · {d.decoMethod}</div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => loadSavedDesign(d)}
                          style={{ padding:'6px 12px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Load
                        </button>
                        <button onClick={() => deleteSavedDesign(d.id)}
                          style={{ padding:'6px 10px', background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:6, fontSize:12, color:'#f87171', cursor:'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const rp = {
  label:       { fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1 },
  optBtn:      { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, border:'1px solid #2a2a2a', background:'transparent', color:'#888', cursor:'pointer', width:'100%', textAlign:'left' },
  optBtnActive:{ border:'1px solid #e8a020', background:'rgba(232,160,32,0.08)', color:'#e8a020' },
};
