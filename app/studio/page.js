'use client';
import { useState, useRef } from 'react';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
];

const PRODUCTS = [
  { id:'tshirt', label:'T-Shirt',  icon:'👕' },
  { id:'hoodie', label:'Hoodie',   icon:'🧥' },
  { id:'polo',   label:'Polo',     icon:'👔' },
  { id:'tank',   label:'Tank Top', icon:'🎽' },
  { id:'hat',    label:'Hat',      icon:'🧢' },
];

const COLORS = [
  { name:'White',      hex:'#ffffff' },
  { name:'Black',      hex:'#1a1a1a' },
  { name:'Navy',       hex:'#1e3a5f' },
  { name:'Red',        hex:'#8b0000' },
  { name:'Forest',     hex:'#2d4a1e' },
  { name:'Royal Blue', hex:'#2554c7' },
  { name:'Purple',     hex:'#4a2d6b' },
  { name:'Gold',       hex:'#c8a951' },
  { name:'Gray',       hex:'#6b7280' },
  { name:'Maroon',     hex:'#6b2737' },
];

const PRINT_AREAS = [
  { id:'front-chest', label:'Front Left Chest', shortLabel:'F.Chest',   x:0.37, y:0.30, w:0.16, h:0.14 },
  { id:'full-front',  label:'Full Front',        shortLabel:'Full Front', x:0.28, y:0.28, w:0.44, h:0.38 },
  { id:'full-back',   label:'Full Back',         shortLabel:'Full Back',  x:0.28, y:0.24, w:0.44, h:0.42 },
  { id:'left-sleeve', label:'Left Sleeve',       shortLabel:'L.Sleeve',  x:0.10, y:0.30, w:0.14, h:0.20 },
  { id:'right-sleeve',label:'Right Sleeve',      shortLabel:'R.Sleeve',  x:0.76, y:0.30, w:0.14, h:0.20 },
];

function GarmentSVG({ product, color }) {
  const isDark = !['#ffffff','#c8a951','#f3f4f6'].includes(color);
  const stroke = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.13)';
  const pocket = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  if (product === 'hat') return (
    <svg viewBox="0 0 280 280" width="100%" height="100%">
      <ellipse cx="140" cy="120" rx="100" ry="58" fill={color} stroke={stroke} strokeWidth="1.5"/>
      <path d="M40 128 Q140 175 240 128 L240 148 Q140 195 40 148 Z" fill={color} stroke={stroke} strokeWidth="1.5"/>
      <path d="M120 64 Q140 58 160 64" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <circle cx="140" cy="60" r="5" fill={stroke}/>
    </svg>
  );

  if (product === 'tank') return (
    <svg viewBox="0 0 280 310" width="100%" height="100%">
      <path d="M115 50 L90 62 L70 85 L92 92 L92 262 L188 262 L188 92 L210 85 L190 62 L165 50 C160 64 145 72 140 72 C135 72 120 64 115 50 Z"
        fill={color} stroke={stroke} strokeWidth="1.5"/>
    </svg>
  );

  if (product === 'hoodie') return (
    <svg viewBox="0 0 280 310" width="100%" height="100%">
      <path d="M108 48 L68 58 L28 98 L56 108 L56 265 L224 265 L224 108 L252 98 L212 58 L172 48 C167 72 147 82 140 82 C133 82 113 72 108 48 Z"
        fill={color} stroke={stroke} strokeWidth="1.5"/>
      <path d="M108 48 L122 78 L140 84 L158 78 L172 48" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <path d="M56 108 L28 98" fill="none" stroke={stroke} strokeWidth="1"/>
      <path d="M224 108 L252 98" fill="none" stroke={stroke} strokeWidth="1"/>
      <rect x="122" y="165" width="36" height="44" rx="5" fill={pocket} stroke={stroke} strokeWidth="1"/>
    </svg>
  );

  if (product === 'polo') return (
    <svg viewBox="0 0 280 310" width="100%" height="100%">
      <path d="M110 48 L72 55 L32 95 L58 105 L58 262 L222 262 L222 105 L248 95 L208 55 L170 48 C165 64 148 72 140 72 C132 72 115 64 110 48 Z"
        fill={color} stroke={stroke} strokeWidth="1.5"/>
      <rect x="131" y="48" width="18" height="36" rx="3" fill="none" stroke={stroke} strokeWidth="1.2"/>
      <line x1="140" y1="48" x2="140" y2="84" stroke={stroke} strokeWidth="0.8"/>
    </svg>
  );

  // Default: T-shirt
  return (
    <svg viewBox="0 0 280 310" width="100%" height="100%">
      <path d="M110 48 L72 55 L32 95 L58 105 L58 262 L222 262 L222 105 L248 95 L208 55 L170 48 C165 66 148 76 140 76 C132 76 115 66 110 48 Z"
        fill={color} stroke={stroke} strokeWidth="1.5"/>
      <path d="M110 48 C115 70 165 70 170 48" fill="none" stroke={stroke} strokeWidth="1.5"/>
      <path d="M58 105 L32 95" fill="none" stroke={stroke} strokeWidth="1"/>
      <path d="M222 105 L248 95" fill="none" stroke={stroke} strokeWidth="1"/>
    </svg>
  );
}

export default function StudioPage() {
  const [product, setProduct]       = useState('tshirt');
  const [color, setColor]           = useState('#ffffff');
  const [printArea, setPrintArea]   = useState('front-chest');
  const [view, setView]             = useState('front');
  const [design, setDesign]         = useState(null);
  const [designPos, setDesignPos]   = useState({ x:0.37, y:0.30, w:0.18, h:0.16 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ ox:0, oy:0 });
  const [selected, setSelected]     = useState(false);
  const [layers, setLayers]         = useState([]);
  const [zoom, setZoom]             = useState(100);
  const [saved, setSaved]           = useState(false);
  const canvasRef = useRef();
  const fileRef   = useRef();

  const currentArea = PRINT_AREAS.find(a => a.id === printArea) || PRINT_AREAS[0];

  function handleUpload(file) {
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setDesign(url);
    setDesignPos({ x:currentArea.x, y:currentArea.y, w:currentArea.w, h:currentArea.h });
    setSelected(true);
    setLayers(l => [...l, { id:Date.now(), name:file.name, url }]);
  }

  function getRelativePos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      mx: (e.clientX - rect.left) / rect.width,
      my: (e.clientY - rect.top) / rect.height,
    };
  }

  function onMouseDown(e) {
    if (!design) return;
    const { mx, my } = getRelativePos(e);
    const { x, y, w, h } = designPos;
    // Resize corner
    if (Math.abs(mx-(x+w)) < 0.04 && Math.abs(my-(y+h)) < 0.04) {
      setIsResizing(true); return;
    }
    // Drag
    if (mx >= x && mx <= x+w && my >= y && my <= y+h) {
      setIsDragging(true);
      setDragOffset({ ox: mx-x, oy: my-y });
      setSelected(true); return;
    }
    setSelected(false);
  }

  function onMouseMove(e) {
    if (!isDragging && !isResizing) return;
    const { mx, my } = getRelativePos(e);
    if (isDragging) {
      setDesignPos(p => ({
        ...p,
        x: Math.max(0, Math.min(0.98-p.w, mx-dragOffset.ox)),
        y: Math.max(0, Math.min(0.98-p.h, my-dragOffset.oy)),
      }));
    }
    if (isResizing) {
      setDesignPos(p => ({
        ...p,
        w: Math.max(0.05, Math.min(0.9-p.x, mx-p.x)),
        h: Math.max(0.05, Math.min(0.9-p.y, my-p.y)),
      }));
    }
  }

  function onMouseUp() { setIsDragging(false); setIsResizing(false); }

  function snapToArea(areaId) {
    const area = PRINT_AREAS.find(a => a.id === areaId);
    if (area) setDesignPos({ x:area.x, y:area.y, w:area.w, h:area.h });
    setPrintArea(areaId);
  }

  function saveDesign() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const canvasW = Math.round(320 * zoom / 100);
  const canvasH = Math.round(360 * zoom / 100);

  return (
    <div style={{ display:'flex', height:'100vh', background:'#1c1c1c', fontFamily:'Inter,sans-serif', overflow:'hidden' }}>
      <style>{`
        input[type=range] { accent-color: #e8a020; }
        * { box-sizing: border-box; }
      `}</style>

      {/* LEFT TOOL RAIL */}
      <div style={{ width:56, background:'#111', borderRight:'1px solid #2a2a2a', display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:2, flexShrink:0 }}>
        <a href="/dashboard" style={{ display:'block', marginBottom:12, textDecoration:'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#2a2a2a"/>
            <path d="M5 14h18M14 5v18" stroke="#e8a020" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </a>
        {[
          { icon:'⬆', label:'Upload Design', onClick:() => fileRef.current?.click() },
          { icon:'⊞', label:'Layers',        onClick:() => {} },
          { icon:'T',  label:'Add Text',      onClick:() => {} },
        ].map(t => (
          <button key={t.label} onClick={t.onClick} title={t.label}
            style={{ width:38, height:38, background:'transparent', border:'none', color:'#777', cursor:'pointer', borderRadius:8, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {t.icon}
          </button>
        ))}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleUpload(e.target.files[0])}/>

        <div style={{ flex:1 }}/>

        {NAV.filter(n=>n.id!=='studio').map(n => (
          <a key={n.id} href={n.href} title={n.label}
            style={{ width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:'#555', textDecoration:'none', borderRadius:8, fontSize:16 }}>
            {n.icon}
          </a>
        ))}
      </div>

      {/* CENTER CANVAS */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <div style={{ height:48, background:'#111', borderBottom:'1px solid #2a2a2a', display:'flex', alignItems:'center', padding:'0 16px', gap:8, flexShrink:0 }}>
          <div style={{ display:'flex', gap:2 }}>
            {PRODUCTS.map(p => (
              <button key={p.id} onClick={() => setProduct(p.id)}
                style={{ padding:'4px 10px', borderRadius:6, border:'none', background:product===p.id?'#2e2e2e':'transparent', color:product===p.id?'#fff':'#666', fontSize:12, cursor:'pointer' }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', background:'#1a1a1a', borderRadius:6, padding:2, gap:1 }}>
            {['front','back'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:'3px 12px', borderRadius:4, border:'none', background:view===v?'#333':'transparent', color:view===v?'#fff':'#555', fontSize:12, cursor:'pointer', textTransform:'capitalize' }}>
                {v}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={() => setZoom(z=>Math.max(50,z-10))} style={{ width:22, height:22, background:'#2a2a2a', border:'none', color:'#ccc', borderRadius:4, cursor:'pointer', fontSize:14, lineHeight:1 }}>−</button>
            <span style={{ fontSize:12, color:'#777', minWidth:36, textAlign:'center' }}>{zoom}%</span>
            <button onClick={() => setZoom(z=>Math.min(200,z+10))} style={{ width:22, height:22, background:'#2a2a2a', border:'none', color:'#ccc', borderRadius:4, cursor:'pointer', fontSize:14, lineHeight:1 }}>+</button>
          </div>
          <button onClick={saveDesign}
            style={{ padding:'6px 18px', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saved ? '✓ Saved!' : 'Save Design'}
          </button>
        </div>

        {/* Canvas */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#242424', overflow:'hidden', position:'relative' }}
          onClick={e=>{ if(e.target===e.currentTarget) setSelected(false); }}>

          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-conic-gradient(#2a2a2a 0% 25%,#242424 0% 50%)', backgroundSize:'24px 24px', opacity:0.5 }}/>

          {/* Garment + design canvas */}
          <div ref={canvasRef}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            style={{ position:'relative', width:canvasW, height:canvasH, cursor:isDragging?'grabbing':'crosshair', userSelect:'none', flexShrink:0 }}>

            {/* Garment */}
            <div style={{ position:'absolute', inset:0, filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
              <GarmentSVG product={product} color={color}/>
            </div>

            {/* Print area guides */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {PRINT_AREAS.map(area => (
                <g key={area.id}>
                  <rect
                    x={area.x*100} y={area.y*100}
                    width={area.w*100} height={area.h*100}
                    fill={printArea===area.id ? 'rgba(232,160,32,0.06)' : 'none'}
                    stroke={printArea===area.id ? '#e8a020' : 'rgba(255,255,255,0.12)'}
                    strokeWidth={printArea===area.id ? '0.4' : '0.3'}
                    strokeDasharray="2 1.5"
                    rx="0.5"
                  />
                  <text x={(area.x+area.w/2)*100} y={(area.y-0.02)*100}
                    textAnchor="middle" fontSize="2.2"
                    fill={printArea===area.id ? '#e8a020' : 'rgba(255,255,255,0.2)'}>
                    {area.shortLabel}
                  </text>
                </g>
              ))}
            </svg>

            {/* Uploaded design */}
            {design && (
              <div style={{ position:'absolute', left:`${designPos.x*100}%`, top:`${designPos.y*100}%`, width:`${designPos.w*100}%`, height:`${designPos.h*100}%`, cursor:isDragging?'grabbing':'move' }}>
                <img src={design} alt="design" draggable={false}
                  style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', pointerEvents:'none' }}/>
                {selected && <>
                  <div style={{ position:'absolute', inset:-1, border:'1.5px solid #e8a020', borderRadius:2, pointerEvents:'none' }}/>
                  {[[0,0],[100,0],[0,100],[100,100]].map(([lx,ly],i) => (
                    <div key={i} style={{ position:'absolute', left:`${lx}%`, top:`${ly}%`, transform:'translate(-50%,-50%)', width:8, height:8, background:'#e8a020', border:'1.5px solid #1a1a1a', borderRadius:2, cursor:'nwse-resize' }}/>
                  ))}
                  <button onClick={()=>{setDesign(null);setSelected(false);setLayers([]);}}
                    style={{ position:'absolute', top:-10, right:-10, width:18, height:18, background:'#dc2626', border:'none', borderRadius:'50%', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, lineHeight:1 }}>×</button>
                </>}
              </div>
            )}

            {/* Upload prompt */}
            {!design && (
              <div onClick={() => fileRef.current?.click()}
                style={{ position:'absolute', left:`${currentArea.x*100}%`, top:`${currentArea.y*100}%`, width:`${currentArea.w*100}%`, height:`${currentArea.h*100}%`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(232,160,32,0.04)', border:'1.5px dashed rgba(232,160,32,0.35)', borderRadius:4, cursor:'pointer' }}>
                <div style={{ fontSize:Math.round(canvasW*0.06), lineHeight:1 }}>+</div>
                <div style={{ fontSize:Math.round(canvasW*0.025), color:'rgba(255,255,255,0.35)', textAlign:'center', marginTop:2, lineHeight:1.3, padding:'0 4px' }}>Upload design</div>
              </div>
            )}
          </div>

          <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#555', whiteSpace:'nowrap' }}>
            {design ? 'Drag to reposition · Corner to resize · Click canvas to deselect' : 'Click the + zone or Upload Design to get started'}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width:256, background:'#111', borderLeft:'1px solid #2a2a2a', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>

        {/* Upload */}
        <div style={{ padding:16, borderBottom:'1px solid #1e1e1e' }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ width:'100%', padding:'10px 0', background:'#e8a020', color:'#1a1a1a', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            ⬆ Upload Design
          </button>
          <p style={{ fontSize:10, color:'#555', textAlign:'center', margin:'6px 0 0' }}>PNG · SVG · JPG · PDF · AI</p>
        </div>

        {/* Color */}
        <div style={{ padding:16, borderBottom:'1px solid #1e1e1e' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Garment Color</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5 }}>
            {COLORS.map(c => (
              <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name}
                style={{ aspectRatio:'1', borderRadius:6, background:c.hex, border:color===c.hex?'2.5px solid #e8a020':'2px solid #2a2a2a', cursor:'pointer', position:'relative' }}>
                {color===c.hex && <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:['#ffffff','#c8a951'].includes(c.hex)?'#333':'white' }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#555', marginTop:6 }}>{COLORS.find(c=>c.hex===color)?.name}</div>
        </div>

        {/* Print areas */}
        <div style={{ padding:16, borderBottom:'1px solid #1e1e1e' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Print Area</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {PRINT_AREAS.map(area => (
              <button key={area.id} onClick={() => snapToArea(area.id)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:6, border:`1px solid ${printArea===area.id?'#e8a020':'#232323'}`, background:printArea===area.id?'rgba(232,160,32,0.08)':'transparent', color:printArea===area.id?'#e8a020':'#666', fontSize:12, cursor:'pointer', textAlign:'left' }}>
                <div style={{ width:6, height:6, borderRadius:1, background:printArea===area.id?'#e8a020':'#444', flexShrink:0 }}/>
                {area.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div style={{ padding:16, flex:1, overflow:'auto' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Layers</div>
          {layers.length===0
            ? <div style={{ fontSize:11, color:'#444', textAlign:'center', padding:'20px 0' }}>No layers yet</div>
            : layers.map(layer => (
              <div key={layer.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:6, background:'#1a1a1a', border:'1px solid #232323', marginBottom:6 }}>
                <img src={layer.url} alt="" style={{ width:28, height:28, objectFit:'contain', borderRadius:3, background:'#2a2a2a' }}/>
                <span style={{ fontSize:11, color:'#888', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{layer.name}</span>
                <button onClick={()=>{setDesign(null);setLayers([]);setSelected(false);}} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
              </div>
            ))
          }
        </div>

        {/* Size sliders */}
        {design && (
          <div style={{ padding:16, borderTop:'1px solid #1e1e1e' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#666', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Adjust Size</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'#666' }}>Width</span>
                <span style={{ fontSize:11, color:'#e8a020' }}>{Math.round(designPos.w*100)}%</span>
              </div>
              <input type="range" min="5" max="80" value={Math.round(designPos.w*100)}
                onChange={e => setDesignPos(p=>({...p,w:parseInt(e.target.value)/100}))}
                style={{ width:'100%' }}/>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'#666' }}>Height</span>
                <span style={{ fontSize:11, color:'#e8a020' }}>{Math.round(designPos.h*100)}%</span>
              </div>
              <input type="range" min="5" max="80" value={Math.round(designPos.h*100)}
                onChange={e => setDesignPos(p=>({...p,h:parseInt(e.target.value)/100}))}
                style={{ width:'100%' }}/>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => snapToArea(printArea)}
                style={{ flex:1, padding:'6px 0', background:'#2a2a2a', border:'none', borderRadius:6, color:'#ccc', fontSize:11, cursor:'pointer' }}>
                Snap to Area
              </button>
              <button onClick={()=>{setDesign(null);setLayers([]);setSelected(false);}}
                style={{ flex:1, padding:'6px 0', background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:6, color:'#f87171', fontSize:11, cursor:'pointer' }}>
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
