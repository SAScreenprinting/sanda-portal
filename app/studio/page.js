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
  {
    id:'screenprint', label:'Screen Print', icon:'🖨',
    description:'Best for bold, vibrant designs. Price per color/screen.',
    pricing: (colors) => `$30 × ${colors} color${colors!==1?'s':''} = $${30*colors}/setup`,
    priceNote:'$30 per screen (color)',
  },
  {
    id:'dtf', label:'DTF', icon:'🖨',
    description:'Direct to Film. Full color, no minimums, great for photos.',
    pricing: () => 'Flat rate — full color included',
    priceNote:'Flat rate pricing',
  },
  {
    id:'embroidery', label:'Embroidery', icon:'🧵',
    description:'Premium stitched look. Priced by stitch count.',
    pricing: (stitches) => `~${stitches.toLocaleString()} stitches`,
    priceNote:'Priced by stitch count',
  },
  {
    id:'laser', label:'Laser Engraving', icon:'🔴',
    description:'Precise laser etching for hard goods and leather.',
    pricing: () => 'Priced by engraving area',
    priceNote:'Priced by area',
  },
];

const PLACEHOLDER_GARMENTS = [
  { id:'placeholder-tshirt',   name:'T-Shirt (Generic)',    category:'T-Shirts',   colors:['White','Black','Navy','Red','Gray'], printAreas:['Front Left Chest','Full Front','Full Back','Left Sleeve'], decorationMethods:['screenprint','dtf','embroidery'], imagePreview:null },
  { id:'placeholder-hoodie',   name:'Hoodie (Generic)',     category:'Hoodies',    colors:['Black','Navy','Gray','Forest Green'], printAreas:['Full Front','Full Back','Left Sleeve','Hood'], decorationMethods:['screenprint','dtf','embroidery'], imagePreview:null },
  { id:'placeholder-hat',      name:'Hat (Generic)',        category:'Hats',       colors:['Black','Navy','Gray','Red','White'], printAreas:['Front Left Chest'], decorationMethods:['embroidery','screenprint'], imagePreview:null },
  { id:'placeholder-bag',      name:'Tote Bag (Generic)',   category:'Bags',       colors:['Natural','Black','Navy'], printAreas:['Full Front','Full Back'], decorationMethods:['screenprint','dtf'], imagePreview:null },
  { id:'placeholder-laser',    name:'Laser Item (Generic)', category:'Laser Engraving', colors:['Natural'], printAreas:['Laser Front','Laser Back'], decorationMethods:['laser'], imagePreview:null },
];

const COLOR_HEX = {
  'White':'#ffffff','Black':'#1a1a1a','Navy':'#1e3a5f','Red':'#8b0000',
  'Royal Blue':'#2554c7','Forest Green':'#2d4a1e','Purple':'#4a2d6b',
  'Gold':'#c8a951','Gray':'#6b7280','Maroon':'#6b2737','Orange':'#c2620a',
  'Pink':'#db7093','Light Blue':'#6baed6','Olive':'#6b6b2a','Brown':'#6b3a2a',
  'Heather Gray':'#9ca3af','Charcoal':'#374151','Natural':'#f5f0e8',
};

const CATEGORIES = ['All','T-Shirts','Hoodies','Sweatshirts','Polos','Tanks',
  'Hats','Beanies','Bags','Jackets','Accessories','Youth','Laser Engraving'];

export default function StudioPage() {
  const [garments, setGarments]         = useState([]);
  const [catFilter, setCatFilter]       = useState('All');
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [garmentColor, setGarmentColor] = useState('');
  const [printArea, setPrintArea]       = useState('');
  const [decoMethod, setDecoMethod]     = useState('');
  const [screenColors, setScreenColors] = useState(1);
  const [stitchCount, setStitchCount]   = useState(8000);
  const [design, setDesign]             = useState(null);
  const [designPos, setDesignPos]       = useState({ x:0.32, y:0.28, w:0.36, h:0.32 });
  const [isDragging, setIsDragging]     = useState(false);
  const [isResizing, setIsResizing]     = useState(false);
  const [dragOffset, setDragOffset]     = useState({ ox:0, oy:0 });
  const [selected, setSelected]         = useState(false);
  const [zoom, setZoom]                 = useState(100);
  const [saved, setSaved]               = useState(false);
  const [showGarmentPicker, setShowGarmentPicker] = useState(true);
  const canvasRef = useRef();
  const fileRef   = useRef();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sa_garments');
      const custom = stored ? JSON.parse(stored) : [];
      setGarments([...custom, ...PLACEHOLDER_GARMENTS]);
    } catch(e) {
      setGarments(PLACEHOLDER_GARMENTS);
    }
  }, []);

  function selectGarment(g) {
    setSelectedGarment(g);
    setGarmentColor(g.colors?.[0] || '');
    setPrintArea(g.printAreas?.[0] || '');
    setDecoMethod(g.decorationMethods?.[0] || '');
    setDesign(null);
    setSelected(false);
    setShowGarmentPicker(false);
  }

  function handleUpload(file) {
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setDesign(url);
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

  const filteredGarments = catFilter==='All' ? garments : garments.filter(g => g.category===catFilter);
  const currentDeco = DECORATION_METHODS.find(m => m.id===decoMethod);
  const isDark = !['#ffffff','#c8a951','#f5f0e8','#f3f4f6'].includes(COLOR_HEX[garmentColor]||'#ffffff');
  const isLaser = selectedGarment?.category === 'Laser Engraving' || decoMethod === 'laser';

  const canvasW = Math.round(320 * zoom / 100);
  const canvasH = Math.round(360 * zoom / 100);

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
          style={{ width:38,height:38,background:'transparent',border:'none',color:'#777',cursor:'pointer',borderRadius:8,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>
          ⬆
        </button>
        <button onClick={() => setShowGarmentPicker(true)} title="Change Garment"
          style={{ width:38,height:38,background:'transparent',border:'none',color:'#777',cursor:'pointer',borderRadius:8,fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>
          👕
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
          <button onClick={() => setShowGarmentPicker(true)}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #333', background:'#1a1a1a', color:'#ccc', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            👕 {selectedGarment ? selectedGarment.name : 'Select Garment'}
          </button>
          {selectedGarment && (
            <span style={{ fontSize:12, color:'#666', borderLeft:'1px solid #333', paddingLeft:12 }}>
              {selectedGarment.category}
            </span>
          )}
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={() => setZoom(z=>Math.max(50,z-10))} style={{ width:22,height:22,background:'#2a2a2a',border:'none',color:'#ccc',borderRadius:4,cursor:'pointer',fontSize:14 }}>−</button>
            <span style={{ fontSize:12, color:'#777', minWidth:36, textAlign:'center' }}>{zoom}%</span>
            <button onClick={() => setZoom(z=>Math.min(200,z+10))} style={{ width:22,height:22,background:'#2a2a2a',border:'none',color:'#ccc',borderRadius:4,cursor:'pointer',fontSize:14 }}>+</button>
          </div>
          <button onClick={()=>setSaved(true)}
            style={{ padding:'6px 18px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saved ? '✓ Saved!' : 'Save Design'}
          </button>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#242424', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-conic-gradient(#2a2a2a 0% 25%,#242424 0% 50%)', backgroundSize:'24px 24px', opacity:0.5 }}/>

          {!selectedGarment ? (
            <div style={{ textAlign:'center', color:'#555' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>👕</div>
              <p style={{ fontSize:16, fontWeight:600, color:'#777' }}>Select a garment to get started</p>
              <button onClick={() => setShowGarmentPicker(true)}
                style={{ marginTop:12, padding:'10px 24px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Browse Garments
              </button>
            </div>
          ) : (
            <div ref={canvasRef}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              style={{ position:'relative', width:canvasW, height:canvasH, cursor:isDragging?'grabbing':'default', userSelect:'none', flexShrink:0 }}>

              {/* Garment image or color block */}
              <div style={{ position:'absolute', inset:0, borderRadius:8, overflow:'hidden', filter:'drop-shadow(0 8px 32px rgba(0,0,0,0.6))' }}>
                {selectedGarment.imagePreview ? (
                  <img src={selectedGarment.imagePreview} alt={selectedGarment.name}
                    style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                ) : (
                  <div style={{ width:'100%', height:'100%', background:COLOR_HEX[garmentColor]||'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                    <div style={{ fontSize:72, opacity:0.15 }}>👕</div>
                    <span style={{ fontSize:13, color:isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.2)', fontWeight:600 }}>{selectedGarment.name}</span>
                    <span style={{ fontSize:11, color:isDark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.15)' }}>Upload garment photo in admin to preview</span>
                  </div>
                )}
              </div>

              {/* Print area guides */}
              {printArea && (
                <div style={{ position:'absolute', left:'20%', top:'20%', width:'60%', height:'55%', border:`1.5px dashed ${isLaser?'#ef4444':'#e8a020'}`, borderRadius:4, pointerEvents:'none', display:'flex', alignItems:'flex-start', justifyContent:'center' }}>
                  <span style={{ fontSize:10, color:isLaser?'#ef4444':'#e8a020', background:'rgba(0,0,0,0.5)', padding:'2px 8px', borderRadius:20, marginTop:-10 }}>{printArea}</span>
                </div>
              )}

              {/* Uploaded design */}
              {design && (
                <div style={{ position:'absolute', left:`${designPos.x*100}%`, top:`${designPos.y*100}%`, width:`${designPos.w*100}%`, height:`${designPos.h*100}%`, cursor:isDragging?'grabbing':'move' }}>
                  <img src={design} alt="design" draggable={false} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', pointerEvents:'none', ...(isLaser?{ filter:'grayscale(1) opacity(0.8)' }:{}) }}/>
                  {selected && <>
                    <div style={{ position:'absolute', inset:-1, border:`1.5px solid ${isLaser?'#ef4444':'#e8a020'}`, borderRadius:2, pointerEvents:'none' }}/>
                    {[[0,0],[100,0],[0,100],[100,100]].map(([lx,ly],i) => (
                      <div key={i} style={{ position:'absolute', left:`${lx}%`, top:`${ly}%`, transform:'translate(-50%,-50%)', width:8, height:8, background:isLaser?'#ef4444':'#e8a020', border:'1.5px solid #111', borderRadius:2, cursor:'nwse-resize' }}/>
                    ))}
                    <button onClick={() => { setDesign(null); setSelected(false); }}
                      style={{ position:'absolute', top:-10, right:-10, width:18, height:18, background:'#dc2626', border:'none', borderRadius:'50%', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>×</button>
                  </>}
                </div>
              )}

              {/* Upload prompt */}
              {!design && (
                <div onClick={() => fileRef.current?.click()}
                  style={{ position:'absolute', left:'25%', top:'25%', width:'50%', height:'45%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(232,160,32,0.05)', border:`1.5px dashed ${isLaser?'rgba(239,68,68,0.4)':'rgba(232,160,32,0.35)'}`, borderRadius:4, cursor:'pointer' }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>+</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center' }}>Click to upload design</div>
                </div>
              )}
            </div>
          )}

          <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#555', whiteSpace:'nowrap' }}>
            {design ? 'Drag to reposition · Corner handles to resize' : selectedGarment ? 'Upload your design to get started' : 'Select a garment first'}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width:268, background:'#111', borderLeft:'1px solid #2a2a2a', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>

        {/* Upload */}
        <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
          <button onClick={() => fileRef.current?.click()} disabled={!selectedGarment}
            style={{ width:'100%', padding:'10px 0', background:selectedGarment?'#e8a020':'#2a2a2a', color:selectedGarment?'#1a1a1a':'#555', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:selectedGarment?'pointer':'not-allowed' }}>
            ⬆ Upload Design
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>

          {/* Garment color */}
          {selectedGarment && (
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={RP.label}>Garment Color</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                {(selectedGarment.colors || []).map(c => (
                  <button key={c} onClick={() => setGarmentColor(c)} title={c}
                    style={{ width:28, height:28, borderRadius:6, background:COLOR_HEX[c]||'#ccc', border:garmentColor===c?'2.5px solid #e8a020':'2px solid #2a2a2a', cursor:'pointer', position:'relative', flexShrink:0 }}>
                    {garmentColor===c && <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:['White','Natural','Gold'].includes(c)?'#333':'white' }}>✓</span>}
                  </button>
                ))}
              </div>
              {garmentColor && <div style={{ fontSize:11, color:'#666', marginTop:6 }}>{garmentColor}</div>}
            </div>
          )}

          {/* Print area */}
          {selectedGarment && (
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={RP.label}>Print Area</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
                {(selectedGarment.printAreas || []).map(area => (
                  <button key={area} onClick={() => setPrintArea(area)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:6, border:`1px solid ${printArea===area?'#e8a020':'#232323'}`, background:printArea===area?'rgba(232,160,32,0.08)':'transparent', color:printArea===area?'#e8a020':'#666', fontSize:12, cursor:'pointer', textAlign:'left' }}>
                    <div style={{ width:6, height:6, borderRadius:1, background:printArea===area?'#e8a020':'#444', flexShrink:0 }}/>
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Decoration method */}
          {selectedGarment && (
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={RP.label}>Decoration Method</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                {DECORATION_METHODS.filter(m => selectedGarment.decorationMethods?.includes(m.id)).map(m => (
                  <button key={m.id} onClick={() => setDecoMethod(m.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:6, border:`1px solid ${decoMethod===m.id?'#e8a020':'#232323'}`, background:decoMethod===m.id?'rgba(232,160,32,0.08)':'transparent', color:decoMethod===m.id?'#e8a020':'#777', fontSize:12, cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:16 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight:600 }}>{m.label}</div>
                      <div style={{ fontSize:10, opacity:0.7, marginTop:1 }}>{m.priceNote}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pricing detail */}
              {decoMethod === 'screenprint' && (
                <div style={{ marginTop:10, padding:10, background:'#1a1a1a', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'#999', marginBottom:6 }}>Number of colors/screens:</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button onClick={() => setScreenColors(c=>Math.max(1,c-1))} style={{ width:24, height:24, background:'#333', border:'none', color:'#fff', borderRadius:4, cursor:'pointer', fontSize:14 }}>−</button>
                    <span style={{ fontSize:18, fontWeight:700, color:'#e8a020', minWidth:24, textAlign:'center' }}>{screenColors}</span>
                    <button onClick={() => setScreenColors(c=>Math.min(8,c+1))} style={{ width:24, height:24, background:'#333', border:'none', color:'#fff', borderRadius:4, cursor:'pointer', fontSize:14 }}>+</button>
                    <span style={{ fontSize:12, color:'#666', marginLeft:4 }}>color{screenColors!==1?'s':''}</span>
                  </div>
                  <div style={{ marginTop:8, fontSize:13, color:'#e8a020', fontWeight:600 }}>Setup: ${30*screenColors} <span style={{ fontSize:11, color:'#666', fontWeight:400 }}>($30 × {screenColors} screen{screenColors!==1?'s':''})</span></div>
                </div>
              )}

              {decoMethod === 'embroidery' && (
                <div style={{ marginTop:10, padding:10, background:'#1a1a1a', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'#999', marginBottom:6 }}>Estimated stitch count:</div>
                  <input type="range" min="1000" max="30000" step="1000" value={stitchCount}
                    onChange={e => setStitchCount(parseInt(e.target.value))}
                    style={{ width:'100%', marginBottom:6 }}/>
                  <div style={{ fontSize:13, color:'#e8a020', fontWeight:600 }}>{stitchCount.toLocaleString()} stitches</div>
                  <div style={{ fontSize:11, color:'#666', marginTop:2 }}>Pricing provided in your quote</div>
                </div>
              )}

              {decoMethod === 'dtf' && (
                <div style={{ marginTop:10, padding:10, background:'#1a1a1a', borderRadius:8 }}>
                  <div style={{ fontSize:12, color:'#999', lineHeight:1.5 }}>Full color print. No screen fees. Great for photos, gradients, and detailed artwork.</div>
                </div>
              )}

              {decoMethod === 'laser' && (
                <div style={{ marginTop:10, padding:10, background:'rgba(239,68,68,0.08)', borderRadius:8, border:'1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize:12, color:'#f87171', lineHeight:1.5 }}>🔴 Laser Engraving mode. Design will be etched — no color, permanent mark.</div>
                </div>
              )}
            </div>
          )}

          {/* Design size */}
          {design && (
            <div style={{ padding:14, borderBottom:'1px solid #1e1e1e' }}>
              <div style={RP.label}>Design Size</div>
              <div style={{ marginTop:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'#666' }}>Width</span>
                  <span style={{ fontSize:11, color:'#e8a020' }}>{Math.round(designPos.w*100)}%</span>
                </div>
                <input type="range" min="5" max="85" value={Math.round(designPos.w*100)}
                  onChange={e => setDesignPos(p=>({...p,w:parseInt(e.target.value)/100}))} style={{ width:'100%', marginBottom:10 }}/>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'#666' }}>Height</span>
                  <span style={{ fontSize:11, color:'#e8a020' }}>{Math.round(designPos.h*100)}%</span>
                </div>
                <input type="range" min="5" max="85" value={Math.round(designPos.h*100)}
                  onChange={e => setDesignPos(p=>({...p,h:parseInt(e.target.value)/100}))} style={{ width:'100%' }}/>
              </div>
              <button onClick={() => { setDesign(null); setSelected(false); }}
                style={{ width:'100%', marginTop:10, padding:'6px 0', background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:6, color:'#f87171', fontSize:12, cursor:'pointer' }}>
                Remove Design
              </button>
            </div>
          )}
        </div>

        {/* Request quote */}
        {selectedGarment && (
          <div style={{ padding:14, borderTop:'1px solid #1e1e1e' }}>
            <a href="/billing"
              style={{ display:'block', width:'100%', padding:'10px 0', background:'#1a1a2e', color:'#e8a020', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'center', textDecoration:'none' }}>
              Request a Quote →
            </a>
            {decoMethod === 'screenprint' && (
              <div style={{ fontSize:11, color:'#555', textAlign:'center', marginTop:6 }}>
                Setup fee: ${30*screenColors} ({screenColors} screen{screenColors!==1?'s':''})
              </div>
            )}
          </div>
        )}
      </div>

      {/* GARMENT PICKER MODAL */}
      {showGarmentPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:100, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ background:'#111', borderBottom:'1px solid #2a2a2a', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h2 style={{ color:'#fff', fontSize:18, fontWeight:700, margin:0 }}>Select a Garment</h2>
            {selectedGarment && (
              <button onClick={() => setShowGarmentPicker(false)}
                style={{ padding:'6px 16px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Done
              </button>
            )}
          </div>

          {/* Category filter */}
          <div style={{ background:'#111', padding:'12px 24px', borderBottom:'1px solid #2a2a2a', display:'flex', gap:6, overflowX:'auto', flexShrink:0 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                style={{ padding:'5px 14px', borderRadius:20, border:'none', background:catFilter===cat?'#e8a020':'#2a2a2a', color:catFilter===cat?'#1a1a1a':'#999', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontWeight:catFilter===cat?'700':'400' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Garment grid */}
          <div style={{ flex:1, overflow:'auto', padding:24 }}>
            {filteredGarments.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#555' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👕</div>
                <p style={{ fontSize:15, color:'#777' }}>No garments in this category yet.</p>
                <p style={{ fontSize:13, color:'#555' }}>Ask your admin to upload garments for this category.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
                {filteredGarments.map(g => (
                  <button key={g.id} onClick={() => selectGarment(g)}
                    style={{ background:selectedGarment?.id===g.id?'#1a1500':'#1a1a1a', border:`2px solid ${selectedGarment?.id===g.id?'#e8a020':'#2a2a2a'}`, borderRadius:10, padding:14, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                    <div style={{ height:140, background:'#222', borderRadius:6, marginBottom:10, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {g.imagePreview
                        ? <img src={g.imagePreview} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                        : <div style={{ fontSize:48, opacity:0.2 }}>
                            {g.category==='Hats'||g.category==='Beanies'?'🧢':g.category==='Bags'?'👜':g.category==='Laser Engraving'?'🔴':'👕'}
                          </div>
                      }
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>{g.name}</div>
                    <div style={{ fontSize:11, color:'#666', marginBottom:6 }}>{g.brand || g.category}</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {(g.decorationMethods||[]).slice(0,3).map(id => {
                        const m = DECORATION_METHODS.find(m=>m.id===id);
                        return <span key={id} style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:10, background:'#2a2a2a', color:'#888' }}>{m?.label}</span>;
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const RP = {
  label: { fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1 },
};
