'use client';
import { useState, useRef, useEffect } from 'react';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
];

const PRODUCTS = [
  { id:'tshirt',  label:'T-Shirt',  color:'#ffffff' },
  { id:'hoodie',  label:'Hoodie',   color:'#1a1a2e' },
  { id:'polo',    label:'Polo',     color:'#1e3a5f' },
  { id:'hat',     label:'Hat',      color:'#2d4a1e' },
];

const COLORS = ['#ffffff','#1a1a1a','#1e3a5f','#8b0000','#2d4a1e','#4a2d6b','#c8a951','#e8e8e8'];

const PRINT_AREAS = [
  { id:'front-chest', label:'Front Left Chest', x:'38%', y:'35%' },
  { id:'full-front',  label:'Full Front',        x:'50%', y:'50%' },
  { id:'full-back',   label:'Full Back',         x:'50%', y:'45%' },
  { id:'left-sleeve', label:'Left Sleeve',       x:'20%', y:'45%' },
];

export default function StudioPage() {
  const [product, setProduct]     = useState('tshirt');
  const [color, setColor]         = useState('#ffffff');
  const [rotation, setRotation]   = useState(0);
  const [dragging, setDragging]   = useState(false);
  const [lastX, setLastX]         = useState(0);
  const [activePin, setActivePin] = useState(null);
  const [view, setView]           = useState('front');
  const canvasRef = useRef();

  function onMouseDown(e) { setDragging(true); setLastX(e.clientX); }
  function onMouseMove(e) { if (!dragging) return; const dx = e.clientX - lastX; setRotation(r => r + dx * 0.5); setLastX(e.clientX); }
  function onMouseUp()    { setDragging(false); }

  const isDark = ['#1a1a1a','#1e3a5f','#8b0000','#2d4a1e','#4a2d6b'].includes(color);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>R</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>Riverside Youth</div>
            <div style={{ fontSize:'12px', color:'#aaa' }}>Sports</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const isActive = item.id === 'studio';
              return (
                <a key={item.id} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', textDecoration:'none', background:isActive?'#1a1a1a':'transparent', color:isActive?'white':'#666', fontSize:'13px', fontWeight:isActive?'600':'400' }}>
                  <span style={{ fontSize:'16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <a href="/" style={{ display:'block', padding:'8px 12px', color:'#666', fontSize:'12px', textDecoration:'none', textAlign:'center' }}>Sign Out</a>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px' }}>
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'26px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>Design Studio</h1>
          <p style={{ fontSize:'14px', color:'#aaa', margin:0 }}>Preview your garments and mark print areas</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'24px' }}>

          {/* Viewer */}
          <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid #e5e5e5', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>

            {/* Product tabs */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
              {PRODUCTS.map(p => (
                <button key={p.id} onClick={() => setProduct(p.id)}
                  style={{ padding:'7px 16px', borderRadius:'20px', border:'none', background:product===p.id?'#1a1a1a':'#f3f4f6', color:product===p.id?'white':'#666', fontSize:'13px', cursor:'pointer', fontWeight:product===p.id?'600':'400' }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
              {['front','back'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding:'5px 14px', borderRadius:'8px', border:'1px solid #e5e5e5', background:view===v?'#1a1a1a':'white', color:view===v?'white':'#666', fontSize:'12px', cursor:'pointer', fontWeight:view===v?'600':'400', textTransform:'capitalize' }}>
                  {v}
                </button>
              ))}
            </div>

            {/* 3D viewer area */}
            <div
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ position:'relative', height:'380px', background:'#f8f8f6', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', cursor:dragging?'grabbing':'grab', overflow:'hidden', userSelect:'none' }}>

              {/* Garment placeholder */}
              <div style={{ position:'relative', transform:`rotateY(${rotation % 360}deg)`, transition:dragging?'none':'transform 0.1s' }}>
                <svg width="220" height="280" viewBox="0 0 220 280" fill="none">
                  {/* T-shirt shape */}
                  <path d="M70 20 L30 60 L55 70 L55 240 L165 240 L165 70 L190 60 L150 20 L130 35 C120 45 100 45 90 35 Z"
                    fill={color} stroke={isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)'} strokeWidth="1.5"/>
                  {/* Collar */}
                  <path d="M90 35 C100 50 120 50 130 35" fill="none" stroke={isDark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.15)'} strokeWidth="1.5"/>
                </svg>

                {/* Print area pins */}
                {PRINT_AREAS.slice(0, view==='front' ? 2 : 2).map((pin, i) => (
                  <button key={pin.id} onClick={() => setActivePin(activePin===pin.id ? null : pin.id)}
                    style={{ position:'absolute', left:pin.x, top:pin.y, transform:'translate(-50%,-50%)', width:'24px', height:'24px', borderRadius:'50%', background:activePin===pin.id?'#1a1a1a':'#e8a020', border:'2px solid white', color:'white', fontSize:'11px', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
                    {i+1}
                  </button>
                ))}
              </div>

              {/* Rotation hint */}
              <div style={{ position:'absolute', bottom:'12px', left:'50%', transform:'translateX(-50%)', fontSize:'11px', color:'#aaa', pointerEvents:'none' }}>
                ← Drag to rotate →
              </div>

              {/* Active pin tooltip */}
              {activePin && (
                <div style={{ position:'absolute', top:'12px', left:'50%', transform:'translateX(-50%)', background:'#1a1a1a', color:'white', fontSize:'12px', fontWeight:'600', padding:'6px 14px', borderRadius:'20px', whiteSpace:'nowrap' }}>
                  {PRINT_AREAS.find(p=>p.id===activePin)?.label}
                </div>
              )}
            </div>

            <p style={{ fontSize:'12px', color:'#aaa', textAlign:'center', marginTop:'12px' }}>
              Click numbered pins to see print area names
            </p>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Color picker */}
            <div style={{ background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e5e5e5' }}>
              <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a', marginBottom:'14px', marginTop:0 }}>Garment Color</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{ width:'100%', aspectRatio:'1', borderRadius:'8px', background:c, border:color===c?'3px solid #1a1a1a':'2px solid #e5e5e5', cursor:'pointer', boxShadow:color===c?'0 0 0 2px white inset':'' }}>
                  </button>
                ))}
              </div>
            </div>

            {/* Print areas */}
            <div style={{ background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e5e5e5' }}>
              <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a', marginBottom:'14px', marginTop:0 }}>Print Areas</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {PRINT_AREAS.map((pin, i) => (
                  <button key={pin.id} onClick={() => setActivePin(activePin===pin.id?null:pin.id)}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:`1px solid ${activePin===pin.id?'#1a1a1a':'#e5e5e5'}`, background:activePin===pin.id?'#1a1a1a':'white', color:activePin===pin.id?'white':'#374151', cursor:'pointer', textAlign:'left', fontSize:'13px' }}>
                    <span style={{ width:'20px', height:'20px', borderRadius:'50%', background:activePin===pin.id?'#e8a020':'#f3f4f6', color:activePin===pin.id?'white':'#666', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>{i+1}</span>
                    {pin.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ background:'white', borderRadius:'14px', padding:'20px', border:'1px solid #e5e5e5' }}>
              <h3 style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a', marginBottom:'14px', marginTop:0 }}>Actions</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <a href="/artwork" style={{ padding:'10px 16px', background:'#1a1a1a', color:'white', borderRadius:'8px', fontSize:'13px', fontWeight:'600', textDecoration:'none', textAlign:'center' }}>
                  Upload Artwork
                </a>
                <a href="/orders" style={{ padding:'10px 16px', background:'white', color:'#1a1a1a', borderRadius:'8px', fontSize:'13px', fontWeight:'600', textDecoration:'none', textAlign:'center', border:'1px solid #e5e5e5' }}>
                  View My Orders
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
