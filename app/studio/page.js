'use client';
import { useState, useRef, useEffect } from 'react';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
];

const DECORATION_METHODS = [
  { id:'screenprint', label:'Screen Print',    icon:'🖨', note:'$30 per screen/color setup' },
  { id:'dtf',         label:'DTF',             icon:'🖨', note:'Full color, no setup fee' },
  { id:'embroidery',  label:'Embroidery',      icon:'🧵', note:'Priced by stitch count' },
  { id:'laser',       label:'Laser Engraving', icon:'🔴', note:'For hard goods & leather' },
];

const QTY_TIERS = [12, 24, 48, 72, 144, 288];

const COLOR_HEX = {
  'White':'#ffffff','Black':'#1a1a1a','Navy':'#1e3a5f','Red':'#8b0000',
  'Royal Blue':'#2554c7','Forest Green':'#2d4a1e','Purple':'#4a2d6b',
  'Gold':'#c8a951','Gray':'#6b7280','Maroon':'#6b2737','Orange':'#c2620a',
  'Pink':'#db7093','Light Blue':'#6baed6','Olive':'#6b6b2a','Brown':'#6b3a2a',
  'Heather Gray':'#9ca3af','Charcoal':'#374151','Natural':'#f5f0e8',
  'Silver':'#c0c0c0',
};

const CATEGORIES = ['All','T-Shirts','Hoodies','Sweatshirts','Polos','Tanks',
  'Hats','Beanies','Bags','Jackets','Accessories','Youth','Laser Engraving'];

const DEMO_PRODUCTS = [
  { id:'demo-1', name:'Port & Company PC54 Tee', brand:'Port & Company', sku:'PC54',
    category:'T-Shirts', colors:'White, Black, Navy, Red, Gray, Royal Blue, Forest Green',
    printAreas:'Front Left Chest, Full Front, Full Back, Left Sleeve, Right Sleeve',
    decorationMethods:['screenprint','dtf','embroidery'], imagePreview:null },
  { id:'demo-2', name:'Port & Company PC78H Hoodie', brand:'Port & Company', sku:'PC78H',
    category:'Hoodies', colors:'Black, Navy, Gray, Maroon, Forest Green',
    printAreas:'Full Front, Full Back, Left Sleeve, Hood',
    decorationMethods:['screenprint','dtf','embroidery'], imagePreview:null },
  { id:'demo-3', name:'New Era Snapback', brand:'New Era', sku:'NE1000',
    category:'Hats', colors:'Black, Navy, Gray, Red, White',
    printAreas:'Front Left Chest',
    decorationMethods:['embroidery','screenprint'], imagePreview:null },
  { id:'demo-4', name:'Canvas Tote Bag', brand:'Liberty Bags', sku:'LB8501',
    category:'Bags', colors:'Natural, Black, Navy',
    printAreas:'Full Front, Full Back',
    decorationMethods:['screenprint','dtf'], imagePreview:null },
  { id:'demo-5', name:'Laser Tumbler', brand:'Generic', sku:'LAS-TUM',
    category:'Laser Engraving', colors:'Silver, Black, Gold',
    printAreas:'Laser Front, Laser Side',
    decorationMethods:['laser'], imagePreview:null },
];

export default function StudioPage() {
  const [products, setProducts]             = useState([]);
  const [catFilter, setCatFilter]           = useState('All');
  const [showPicker, setShowPicker]         = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Order configuration
  const [orderType, setOrderType]           = useState(''); // 'bulk' | 'pod'
  const [fulfillment, setFulfillment]       = useState(''); // 'ship-all' | 'hold-fulfill'
  const [quantity, setQuantity]             = useState(24);
  const [customQty, setCustomQty]           = useState('');
  const [garmentColor, setGarmentColor]     = useState('');
  const [printArea, setPrintArea]           = useState('');
  const [decoMethod, setDecoMethod]         = useState('');
  const [screenColors, setScreenColors]     = useState(1);
  const [notes, setNotes]                   = useState('');

  // Design canvas
  const [design, setDesign]                 = useState(null);
  const [designPos, setDesignPos]           = useState({ x:0.25, y:0.25, w:0.50, h:0.45 });
  const [isDragging, setIsDragging]         = useState(false);
  const [isResizing, setIsResizing]         = useState(false);
  const [dragOffset, setDragOffset]         = useState({ ox:0, oy:0 });
  const [selected, setSelected]             = useState(false);
  const [zoom, setZoom]                     = useState(100);
  const [submitted, setSubmitted]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const canvasRef = useRef();
  const fileRef   = useRef();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sa_products');
      const saved = stored ? JSON.parse(stored) : [];
      setProducts(saved.length > 0 ? saved : DEMO_PRODUCTS);
    } catch(e) {
      setProducts(DEMO_PRODUCTS);
    }
  }, []);

  function selectProduct(p) {
    setSelectedProduct(p);
    const colors = typeof p.colors === 'string' ? p.colors.split(',').map(s=>s.trim()) : (p.colors||[]);
    const areas  = typeof p.printAreas === 'string' ? p.printAreas.split(',').map(s=>s.trim()) : (p.printAreas||[]);
    const methods = p.decorationMethods || ['screenprint'];
    setGarmentColor(colors[0] || '');
    setPrintArea(areas[0] || '');
    setDecoMethod(methods[0] || '');
    setOrderType('');
    setFulfillment('');
    setDesign(null);
    setSelected(false);
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
    if (mx>=x && mx<=x+w && my>=y && my<=y+h) {
      setIsDragging(true); setDragOffset({ ox:mx-x, oy:my-y }); setSelected(true); return;
    }
    setSelected(false);
  }

  function onMouseMove(e) {
    if (!isDragging && !isResizing) return;
    const { mx, my } = getRelPos(e);
    if (isDragging) setDesignPos(p => ({
      ...p, x:Math.max(0,Math.min(0.95-p.w,mx-dragOffset.ox)), y:Math.max(0,Math.min(0.95-p.h,my-dragOffset.oy))
    }));
    if (isResizing) setDesignPos(p => ({
      ...p, w:Math.max(0.05,Math.min(0.9-p.x,mx-p.x)), h:Math.max(0.05,Math.min(0.9-p.y,my-p.y))
    }));
  }

  function onMouseUp() { setIsDragging(false); setIsResizing(false); }

  function submitQuote() {
    if (!selectedProduct || !orderType || !decoMethod) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1500);
  }

  const filteredProducts = catFilter==='All' ? products : products.filter(p => p.category===catFilter);
  const productColors = selectedProduct ? (typeof selectedProduct.colors==='string' ? selectedProduct.colors.split(',').map(s=>s.trim()) : (selectedProduct.colors||[])) : [];
  const productAreas  = selectedProduct ? (typeof selectedProduct.printAreas==='string' ? selectedProduct.printAreas.split(',').map(s=>s.trim()) : (selectedProduct.printAreas||[])) : [];
  const productMethods = selectedProduct?.decorationMethods || [];
  const isLaser = decoMethod === 'laser';
  const isDark = !['#ffffff','#c8a951','#f5f0e8','#f3f4f6'].includes(COLOR_HEX[garmentColor]||'#ffffff');
  const finalQty = customQty ? parseInt(customQty) : quantity;
  const canSubmit = selectedProduct && orderType && decoMethod && (orderType==='pod' || (orderType==='bulk' && fulfillment));

  const canvasW = Math.round(320 * zoom / 100);
  const canvasH = Math.round(360 * zoom / 100);

  return (
    <div style={{ display:'flex', height:'100vh', background:'#1c1c1c', fontFamily:'Inter,sans-serif', overflow:'hidden' }}>
      <style>{`* { box-sizing:border-box; } input[type=range]{ accent-color:#e8a020; } input[type=number]::-webkit-inner-spin-button{ opacity:1; }`}</style>

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
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleUpload(e.target.files[0])}/>
        <div style={{ flex:1 }}/>
        {NAV.filter(n=>n.id!=='studio').map(n => (
          <a key={n.id} href={n.href} title={n.label}
            style={{ width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',color:'#555',textDecoration:'none',borderRadius:8,fontSize:16 }}>
            {n.icon}
          </a>
        ))}
      </div>

      {/* CENTER CANVAS */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <div style={{ height:48, background:'#111', borderBottom:'1px solid #2a2a2a', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
          <button onClick={() => setShowPicker(true)}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #333', background:'#1a1a1a', color:'#ccc', fontSize:12, cursor:'pointer' }}>
            👕 {selectedProduct ? selectedProduct.name : 'Select Product'}
          </button>
          {selectedProduct && <span style={{ fontSize:12, color:'#555', borderLeft:'1px solid #333', paddingLeft:12 }}>{selectedProduct.category}</span>}
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={()=>setZoom(z=>Math.max(50,z-10))} style={{ width:22,height:22,background:'#2a2a2a',border:'none',color:'#ccc',borderRadius:4,cursor:'pointer',fontSize:14 }}>−</button>
            <span style={{ fontSize:12, color:'#777', minWidth:36, textAlign:'center' }}>{zoom}%</span>
            <button onClick={()=>setZoom(z=>Math.min(200,z+10))} style={{ width:22,height:22,background:'#2a2a2a',border:'none',color:'#ccc',borderRadius:4,cursor:'pointer',fontSize:14 }}>+</button>
          </div>
          <a href="/dashboard"
            style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:8, color:'#999', textDecoration:'none', fontSize:18, fontWeight:300, marginLeft:8, flexShrink:0 }}
            title="Exit to Dashboard">
            ✕
          </a>
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

              {/* Garment */}
              <div style={{ position:'absolute', inset:0, borderRadius:8, overflow:'hidden', filter:'drop-shadow(0 8px 32px rgba(0,0,0,0.6))' }}>
                {selectedProduct.imagePreview ? (
                  <img src={selectedProduct.imagePreview} alt={selectedProduct.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                ) : (
                  <div style={{ width:'100%', height:'100%', background:COLOR_HEX[garmentColor]||'#ffffff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <div style={{ fontSize:80, opacity:0.1 }}>
                      {selectedProduct.category==='Hats'||selectedProduct.category==='Beanies'?'🧢':selectedProduct.category==='Bags'?'👜':selectedProduct.category==='Laser Engraving'?'🔴':'👕'}
                    </div>
                    <span style={{ fontSize:12, color:isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.2)', fontWeight:500, textAlign:'center', padding:'0 16px' }}>{selectedProduct.name}</span>
                    <span style={{ fontSize:10, color:isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.12)', textAlign:'center', padding:'0 16px' }}>Upload garment photo in admin to preview</span>
                  </div>
                )}
              </div>

              {/* Print area guide */}
              {printArea && (
                <div style={{ position:'absolute', left:'18%', top:'18%', width:'64%', height:'58%', border:`1.5px dashed ${isLaser?'#ef4444':'#e8a020'}`, borderRadius:4, pointerEvents:'none' }}>
                  <span style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:9, color:isLaser?'#ef4444':'#e8a020', background:'rgba(0,0,0,0.6)', padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>{printArea}</span>
                </div>
              )}

              {/* Uploaded design */}
              {design && (
                <div style={{ position:'absolute', left:`${designPos.x*100}%`, top:`${designPos.y*100}%`, width:`${designPos.w*100}%`, height:`${designPos.h*100}%`, cursor:isDragging?'grabbing':'move' }}>
                  <img src={design} alt="design" draggable={false}
                    style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', pointerEvents:'none', ...(isLaser?{filter:'grayscale(1) opacity(0.7)'}:{}) }}/>
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

              {/* Upload prompt */}
              {!design && (
                <div onClick={() => fileRef.current?.click()}
                  style={{ position:'absolute', left:'22%', top:'22%', width:'56%', height:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`rgba(${isLaser?'239,68,68':'232,160,32'},0.04)`, border:`1.5px dashed rgba(${isLaser?'239,68,68':'232,160,32'},0.3)`, borderRadius:4, cursor:'pointer' }}>
                  <div style={{ fontSize:28, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>+</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>Upload your design</div>
                </div>
              )}
            </div>
          )}

          <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#555', whiteSpace:'nowrap' }}>
            {design ? 'Drag to reposition · Corner handles to resize' : selectedProduct ? 'Upload your design to preview it on the garment' : ''}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width:272, background:'#111', borderLeft:'1px solid #2a2a2a', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>

        <div style={{ flex:1, overflowY:'auto' }}>

          {/* Upload design */}
          <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
            <button onClick={() => fileRef.current?.click()} disabled={!selectedProduct}
              style={{ width:'100%', padding:'10px 0', background:selectedProduct?'#e8a020':'#2a2a2a', color:selectedProduct?'#1a1a1a':'#555', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:selectedProduct?'pointer':'not-allowed' }}>
              ⬆ Upload Your Design
            </button>
            <p style={{ fontSize:10, color:'#555', textAlign:'center', margin:'6px 0 0' }}>PNG · SVG · JPG · PDF · AI</p>
          </div>

          {selectedProduct && <>

            {/* ORDER TYPE */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Order Type</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>

                <button onClick={() => { setOrderType('bulk'); setFulfillment(''); }}
                  style={{ ...rp.optBtn, ...(orderType==='bulk' ? rp.optBtnActive : {}) }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>📦</span>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>Bulk Order</div>
                      <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>Large quantity, one print run</div>
                    </div>
                  </div>
                  {orderType==='bulk' && <span style={{ fontSize:14, color:'#e8a020' }}>✓</span>}
                </button>

                <button onClick={() => { setOrderType('pod'); setFulfillment(''); }}
                  style={{ ...rp.optBtn, ...(orderType==='pod' ? rp.optBtnActive : {}) }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>🔁</span>
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>Print on Demand</div>
                      <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>We print & ship per order</div>
                    </div>
                  </div>
                  {orderType==='pod' && <span style={{ fontSize:14, color:'#e8a020' }}>✓</span>}
                </button>
              </div>
            </div>

            {/* BULK OPTIONS */}
            {orderType === 'bulk' && (
              <>
                {/* Fulfillment */}
                <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
                  <div style={rp.label}>Fulfillment</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>

                    <button onClick={() => setFulfillment('ship-all')}
                      style={{ ...rp.optBtn, ...(fulfillment==='ship-all' ? rp.optBtnActive : {}) }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>🚚</span>
                        <div style={{ textAlign:'left' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>Ship all at once</div>
                          <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>Full order shipped to you</div>
                        </div>
                      </div>
                      {fulfillment==='ship-all' && <span style={{ fontSize:14, color:'#e8a020' }}>✓</span>}
                    </button>

                    <button onClick={() => setFulfillment('hold-fulfill')}
                      style={{ ...rp.optBtn, ...(fulfillment==='hold-fulfill' ? rp.optBtnActive : {}) }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>🏭</span>
                        <div style={{ textAlign:'left' }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>Hold & fulfill</div>
                          <div style={{ fontSize:11, opacity:0.6, marginTop:1 }}>We store & ship as orders come in</div>
                        </div>
                      </div>
                      {fulfillment==='hold-fulfill' && <span style={{ fontSize:14, color:'#e8a020' }}>✓</span>}
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
                  <div style={rp.label}>Quantity</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginTop:10 }}>
                    {QTY_TIERS.map(q => (
                      <button key={q} onClick={() => { setQuantity(q); setCustomQty(''); }}
                        style={{ padding:'8px 0', borderRadius:6, border:`1px solid ${quantity===q&&!customQty?'#e8a020':'#2a2a2a'}`, background:quantity===q&&!customQty?'rgba(232,160,32,0.1)':'transparent', color:quantity===q&&!customQty?'#e8a020':'#777', fontSize:13, fontWeight:quantity===q&&!customQty?'700':'400', cursor:'pointer' }}>
                        {q}{q===288?'+':''}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop:8 }}>
                    <input type="number" value={customQty} onChange={e=>setCustomQty(e.target.value)}
                      placeholder="Custom qty…" min="1"
                      style={{ width:'100%', padding:'7px 10px', background:'#1a1a1a', border:`1px solid ${customQty?'#e8a020':'#2a2a2a'}`, borderRadius:6, color:customQty?'#e8a020':'#777', fontSize:13, fontFamily:'inherit' }}/>
                  </div>
                  {(customQty || quantity) && (
                    <div style={{ fontSize:12, color:'#666', marginTop:6 }}>
                      Quantity: <strong style={{ color:'#e8a020' }}>{customQty || quantity} pieces</strong>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Garment color */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Garment Color</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
                {productColors.map(c => (
                  <button key={c} onClick={() => setGarmentColor(c)} title={c}
                    style={{ width:28, height:28, borderRadius:6, background:COLOR_HEX[c]||'#888', border:garmentColor===c?'2.5px solid #e8a020':'2px solid #2a2a2a', cursor:'pointer', position:'relative', flexShrink:0 }}>
                    {garmentColor===c && <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:['White','Natural','Gold','Silver'].includes(c)?'#333':'white' }}>✓</span>}
                  </button>
                ))}
              </div>
              {garmentColor && <div style={{ fontSize:11, color:'#666', marginTop:6 }}>{garmentColor}</div>}
            </div>

            {/* Print area */}
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={rp.label}>Print Area</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
                {productAreas.map(area => (
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
                {DECORATION_METHODS.filter(m => productMethods.includes(m.id)).map(m => (
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

              {/* Screen color counter */}
              {decoMethod === 'screenprint' && (
                <div style={{ marginTop:10, padding:10, background:'#1a1a1a', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'#888', marginBottom:8 }}>How many colors in your design?</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => setScreenColors(c=>Math.max(1,c-1))} style={{ width:28, height:28, background:'#2a2a2a', border:'none', color:'#fff', borderRadius:6, cursor:'pointer', fontSize:16, fontWeight:700 }}>−</button>
                    <span style={{ fontSize:22, fontWeight:700, color:'#e8a020', minWidth:28, textAlign:'center' }}>{screenColors}</span>
                    <button onClick={() => setScreenColors(c=>Math.min(8,c+1))} style={{ width:28, height:28, background:'#2a2a2a', border:'none', color:'#fff', borderRadius:6, cursor:'pointer', fontSize:16, fontWeight:700 }}>+</button>
                    <span style={{ fontSize:12, color:'#666' }}>color{screenColors!==1?'s':''}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#e8a020', fontWeight:600, marginTop:8 }}>
                    Setup fee: ${30*screenColors}
                    <span style={{ fontSize:11, color:'#666', fontWeight:400 }}> ($30 × {screenColors} screen{screenColors!==1?'s':''})</span>
                  </div>
                </div>
              )}

              {decoMethod === 'laser' && (
                <div style={{ marginTop:10, padding:10, background:'rgba(239,68,68,0.07)', borderRadius:8, border:'1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize:11, color:'#f87171', lineHeight:1.5 }}>🔴 Laser mode — design previewed in grayscale. Final result will be etched.</div>
                </div>
              )}
            </div>

            {/* Design size controls */}
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
                placeholder="Anything else we should know? Special instructions, deadline, sizes needed…"
                style={{ width:'100%', marginTop:8, padding:'8px 10px', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, color:'#ccc', fontSize:12, fontFamily:'inherit', resize:'vertical', minHeight:70, lineHeight:1.5 }}/>
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
              <button onClick={()=>{setSubmitted(false);setShowPicker(true);setSelectedProduct(null);setOrderType('');setFulfillment('');setDesign(null);setNotes('');}}
                style={{ marginTop:10, padding:'6px 16px', background:'#2a2a2a', border:'none', borderRadius:6, color:'#ccc', fontSize:12, cursor:'pointer' }}>
                Start New Design
              </button>
            </div>
          ) : (
            <>
              {/* Order summary */}
              {canSubmit && (
                <div style={{ marginBottom:12, padding:10, background:'#1a1a1a', borderRadius:8, fontSize:11, color:'#888', lineHeight:1.8 }}>
                  <div><span style={{ color:'#666' }}>Product:</span> <span style={{ color:'#ccc' }}>{selectedProduct?.name}</span></div>
                  <div><span style={{ color:'#666' }}>Type:</span> <span style={{ color:'#ccc' }}>{orderType==='bulk'?`Bulk Order — ${customQty||quantity} pcs`:'Print on Demand'}</span></div>
                  {orderType==='bulk' && <div><span style={{ color:'#666' }}>Fulfillment:</span> <span style={{ color:'#ccc' }}>{fulfillment==='ship-all'?'Ship all at once':'Hold & fulfill'}</span></div>}
                  <div><span style={{ color:'#666' }}>Method:</span> <span style={{ color:'#ccc' }}>{DECORATION_METHODS.find(m=>m.id===decoMethod)?.label}</span></div>
                  {decoMethod==='screenprint' && <div><span style={{ color:'#666' }}>Setup:</span> <span style={{ color:'#e8a020' }}>${30*screenColors} ({screenColors} screen{screenColors!==1?'s':''})</span></div>}
                </div>
              )}
              <button onClick={submitQuote} disabled={!canSubmit || submitting}
                style={{ width:'100%', padding:'11px 0', background:canSubmit?'#e8a020':'#2a2a2a', color:canSubmit?'#1a1a1a':'#555', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:canSubmit?'pointer':'not-allowed', transition:'all 0.15s' }}>
                {submitting ? 'Submitting…' : 'Submit for Quote →'}
              </button>
              {!canSubmit && (
                <div style={{ fontSize:11, color:'#555', textAlign:'center', marginTop:6 }}>
                  {!selectedProduct ? 'Select a product first' : !orderType ? 'Choose an order type' : !fulfillment && orderType==='bulk' ? 'Choose fulfillment method' : 'Choose a decoration method'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* PRODUCT PICKER MODAL */}
      {showPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:100, display:'flex', flexDirection:'column' }}>
          <div style={{ background:'#111', borderBottom:'1px solid #2a2a2a', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>Select a Product</h2>
            {selectedProduct && (
              <button onClick={() => setShowPicker(false)}
                style={{ padding:'6px 16px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Done
              </button>
            )}
          </div>

          {/* Category filter */}
          <div style={{ background:'#111', padding:'10px 24px', borderBottom:'1px solid #2a2a2a', display:'flex', gap:6, overflowX:'auto', flexShrink:0 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                style={{ padding:'5px 14px', borderRadius:20, border:'none', background:catFilter===cat?'#e8a020':'#2a2a2a', color:catFilter===cat?'#1a1a1a':'#888', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontWeight:catFilter===cat?'700':'400' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex:1, overflow:'auto', padding:24 }}>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#555' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👕</div>
                <p style={{ fontSize:15, color:'#666' }}>No products in this category yet.</p>
                <p style={{ fontSize:13, color:'#555' }}>Upload products in the admin panel to make them available here.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:14 }}>
                {filteredProducts.map(p => {
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => selectProduct(p)}
                      style={{ background:isSelected?'#1a1400':'#1a1a1a', border:`2px solid ${isSelected?'#e8a020':'#2a2a2a'}`, borderRadius:10, padding:14, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                      <div style={{ height:140, background:'#222', borderRadius:6, marginBottom:10, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {p.imagePreview
                          ? <img src={p.imagePreview} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                          : <div style={{ fontSize:52, opacity:0.15 }}>
                              {p.category==='Hats'||p.category==='Beanies'?'🧢':p.category==='Bags'?'👜':p.category==='Laser Engraving'?'🔴':'👕'}
                            </div>
                        }
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>{p.brand || ''} {p.sku ? `· ${p.sku}` : ''}</div>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:10, background:'#252525', color:'#777' }}>{p.category}</span>
                        {(p.decorationMethods||[]).slice(0,2).map(id => {
                          const m = DECORATION_METHODS.find(m=>m.id===id);
                          return <span key={id} style={{ fontSize:10, padding:'2px 6px', borderRadius:10, background:'#1e2a1e', color:'#4ade80' }}>{m?.label}</span>;
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const rp = {
  label:   { fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1 },
  optBtn:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, border:'1px solid #2a2a2a', background:'transparent', color:'#888', cursor:'pointer', width:'100%', textAlign:'left', transition:'all 0.15s' },
  optBtnActive: { border:'1px solid #e8a020', background:'rgba(232,160,32,0.08)', color:'#e8a020' },
};
