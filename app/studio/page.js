'use client'
import { useState, useEffect } from 'react'

const themes = {
  classic: { sidebar: '#EFEDE8', sidebarText: '#666', sidebarActive: '#1a1a1a', sidebarActiveTxt: 'white', main: '#F5F5F0', card: 'white', cardText: '#1a1a1a', cardSub: '#aaa', accent: '#1a1a1a', accentText: 'white', logoFilter: 'none' },
  midnight: { sidebar: '#0f0f0f', sidebarText: '#666', sidebarActive: 'white', sidebarActiveTxt: '#0f0f0f', main: '#1a1a1a', card: '#242424', cardText: 'white', cardSub: '#555', accent: 'white', accentText: '#1a1a1a', logoFilter: 'invert(1)' },
  ocean: { sidebar: '#EFF6FF', sidebarText: '#64748B', sidebarActive: '#1E40AF', sidebarActiveTxt: 'white', main: '#F0F7FF', card: 'white', cardText: '#1E293B', cardSub: '#94A3B8', accent: '#1E40AF', accentText: 'white', logoFilter: 'none' },
  forest: { sidebar: '#ECFDF5', sidebarText: '#6B7280', sidebarActive: '#065F46', sidebarActiveTxt: 'white', main: '#F0FDF4', card: 'white', cardText: '#1a1a1a', cardSub: '#aaa', accent: '#065F46', accentText: 'white', logoFilter: 'none' },
  rose: { sidebar: '#FFF1F2', sidebarText: '#9F6B6B', sidebarActive: '#9F1239', sidebarActiveTxt: 'white', main: '#FFF5F5', card: 'white', cardText: '#1a1a1a', cardSub: '#aaa', accent: '#9F1239', accentText: 'white', logoFilter: 'none' },
  slate: { sidebar: '#F1F5F9', sidebarText: '#64748B', sidebarActive: '#334155', sidebarActiveTxt: 'white', main: '#F8FAFC', card: 'white', cardText: '#1a1a1a', cardSub: '#aaa', accent: '#334155', accentText: 'white', logoFilter: 'none' },
}

const products = {
  TEE: {
    label: 'T-Shirt', icon: '👕',
    blanks: ['Bella Canvas 3001', 'Next Level 3600', 'Gildan 64000'],
    colors: [
      { name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f0f0f0' },
      { name: 'Navy', hex: '#1B2A4A' }, { name: 'Gray', hex: '#888' },
      { name: 'Heather Gray', hex: '#b0b0b0' }, { name: 'Red', hex: '#B91C1C' },
    ],
    sizes: ['XS','S','M','L','XL','2XL','3XL'],
    basePrice: 14.99,
    views: {
      front: { label: 'Front', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', pins: [
        { id: 'FC', num: 1, label: 'Front chest', x: 50, y: 40 },
        { id: 'LC', num: 2, label: 'Left chest', x: 34, y: 35 },
        { id: 'RC', num: 3, label: 'Right chest', x: 66, y: 35 },
      ]},
      left: { label: 'Left side', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', pins: [
        { id: 'FSL', num: 4, label: 'Left sleeve', x: 50, y: 38 },
      ]},
      back: { label: 'Back', img: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&q=80', pins: [
        { id: 'BC', num: 5, label: 'Back center', x: 50, y: 45 },
        { id: 'BN', num: 6, label: 'Back neck', x: 50, y: 22 },
      ]},
      right: { label: 'Right side', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80', pins: [
        { id: 'RSL', num: 7, label: 'Right sleeve', x: 50, y: 38 },
      ]},
    }
  },
  HOD: {
    label: 'Hoodie', icon: '🧥',
    blanks: ['Gildan 18500', 'Bella Canvas 3719', 'Independent IND4000'],
    colors: [
      { name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f0f0f0' },
      { name: 'Navy', hex: '#1B2A4A' }, { name: 'Gray', hex: '#888' },
    ],
    sizes: ['S','M','L','XL','2XL'],
    basePrice: 29.99,
    views: {
      front: { label: 'Front', img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', pins: [
        { id: 'FC', num: 1, label: 'Front chest', x: 50, y: 42 },
        { id: 'LC', num: 2, label: 'Left chest', x: 35, y: 37 },
        { id: 'PKT', num: 3, label: 'Pocket area', x: 50, y: 63 },
        { id: 'HD', num: 4, label: 'Hood', x: 50, y: 16 },
      ]},
      left: { label: 'Left side', img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', pins: [
        { id: 'LSL', num: 5, label: 'Left sleeve', x: 50, y: 42 },
      ]},
      back: { label: 'Back', img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', pins: [
        { id: 'BC', num: 6, label: 'Back center', x: 50, y: 48 },
        { id: 'BHD', num: 7, label: 'Back hood', x: 50, y: 12 },
      ]},
      right: { label: 'Right side', img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80', pins: [
        { id: 'RSL', num: 8, label: 'Right sleeve', x: 50, y: 42 },
      ]},
    }
  },
  HAT: {
    label: 'Hat/Cap', icon: '🧢',
    blanks: ['Otto Cap 101', 'Yupoong YP609'],
    colors: [
      { name: 'Black', hex: '#1a1a1a' }, { name: 'White', hex: '#f0f0f0' },
      { name: 'Navy', hex: '#1B2A4A' }, { name: 'Khaki', hex: '#C2A96C' },
    ],
    sizes: ['One Size'],
    basePrice: 24.99,
    views: {
      front: { label: 'Front', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', pins: [
        { id: 'FC', num: 1, label: 'Front center', x: 50, y: 38 },
      ]},
      left: { label: 'Left side', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', pins: [
        { id: 'LS', num: 2, label: 'Left side', x: 50, y: 42 },
      ]},
      back: { label: 'Back', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', pins: [
        { id: 'BS', num: 3, label: 'Back strap', x: 50, y: 52 },
        { id: 'UB', num: 4, label: 'Under brim', x: 50, y: 74 },
      ]},
      right: { label: 'Right side', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80', pins: [
        { id: 'RS', num: 5, label: 'Right side', x: 50, y: 42 },
      ]},
    }
  },
  TUMBLER: {
    label: 'Tumbler', icon: '🥤',
    blanks: ['YETI 20oz', 'YETI 30oz', 'Hydro Flask 21oz'],
    colors: [
      { name: 'Stainless', hex: '#C0C0C0' }, { name: 'Black', hex: '#1a1a1a' },
      { name: 'White', hex: '#f0f0f0' }, { name: 'Navy', hex: '#1B2A4A' },
    ],
    sizes: ['20oz','30oz','40oz'],
    basePrice: 34.99,
    views: {
      front: { label: 'Front', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', pins: [
        { id: 'FP', num: 1, label: 'Front panel', x: 50, y: 45 },
      ]},
      left: { label: 'Left side', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', pins: [
        { id: 'LP', num: 2, label: 'Left panel', x: 50, y: 45 },
      ]},
      back: { label: 'Back', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', pins: [
        { id: 'BP', num: 3, label: 'Back panel', x: 50, y: 45 },
        { id: 'FW', num: 4, label: 'Full wrap', x: 50, y: 68 },
      ]},
      right: { label: 'Right side', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', pins: [
        { id: 'RP', num: 4, label: 'Right panel', x: 50, y: 45 },
      ]},
    }
  },
  METALCARD: {
    label: 'Metal Card', icon: '💳',
    blanks: ['Stainless Steel 304', 'Brushed Brass', 'Black Coated Steel'],
    colors: [
      { name: 'Silver', hex: '#C0C0C0' }, { name: 'Gold', hex: '#D4A843' },
      { name: 'Black', hex: '#1a1a1a' }, { name: 'Rose Gold', hex: '#E8B4B8' },
    ],
    sizes: ['Standard 3.5×2in', 'Custom size'],
    basePrice: 19.99,
    views: {
      front: { label: 'Front', img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80', pins: [
        { id: 'CF', num: 1, label: 'Card front', x: 50, y: 50 },
      ]},
      left: { label: 'Left edge', img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80', pins: [] },
      back: { label: 'Back', img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80', pins: [
        { id: 'CB', num: 2, label: 'Card back', x: 50, y: 50 },
      ]},
      right: { label: 'Right edge', img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80', pins: [] },
    }
  },
}

const methods = [
  { code: 'SCR', label: 'Screen Print', basePrice: 8, screenFee: 30, desc: 'Bold, durable, vibrant. $30 per color/screen setup fee applies.', color: '#16A34A', bg: '#F0FDF4', hasScreenFee: true },
  { code: 'DTF', label: 'DTF', basePrice: 6, screenFee: 0, desc: 'Full color, photos, gradients. No setup fee.', color: '#2563EB', bg: '#EFF6FF', hasScreenFee: false },
  { code: 'EMB', label: 'Embroidery', basePrice: 12, screenFee: 0, desc: 'Premium stitched look. Best for logos and hats.', color: '#7C3AED', bg: '#F5F3FF', hasScreenFee: false },
  { code: 'LSR', label: 'Laser Engrave', basePrice: 15, screenFee: 0, desc: 'Permanent precision engraving. For hard goods only.', color: '#D97706', bg: '#FFFBEB', hasScreenFee: false },
]

const extras = [
  { id: 'woven_label', label: 'Woven neck label', price: 3.50, desc: 'Thread-stitched brand label sewn into collar' },
  { id: 'printed_label', label: 'Printed neck label', price: 1.50, desc: 'Printed directly on inside neck area' },
  { id: 'patch', label: 'Sewn-on patch', price: 5.00, desc: 'Custom patch sewn anywhere on the garment' },
]

const viewOrder = ['front', 'left', 'back', 'right']
const SCREEN_FEE = 30

export default function DesignStudio() {
  const [activeTheme, setActiveTheme] = useState('classic')
  const [selectedProduct, setSelectedProduct] = useState('TEE')
  const [selectedBlank, setSelectedBlank] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('DTF')
  const [screenColors, setScreenColors] = useState(1)
  const [view, setView] = useState('front')
  const [activePin, setActivePin] = useState(null)
  const [zoneFiles, setZoneFiles] = useState({})
  const [zoneTexts, setZoneTexts] = useState({})
  const [selectedExtras, setSelectedExtras] = useState([])
  const [notes, setNotes] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme')
    if (saved && themes[saved]) setActiveTheme(saved)
  }, [])

  useEffect(() => {
    const p = products[selectedProduct]
    setSelectedColor(p.colors[0])
    setSelectedBlank(p.blanks[0])
    setSelectedSize(p.sizes[Math.min(3, p.sizes.length - 1)])
    setActivePin(null)
    setZoneFiles({})
    setZoneTexts({})
    setSelectedExtras([])
    setView('front')
    setScreenColors(1)
  }, [selectedProduct])

  const t = themes[activeTheme]
  const prod = products[selectedProduct]
  const currentView = prod.views[view]
  const method = methods.find(m => m.code === selectedMethod)
  const allPins = Object.values(prod.views).flatMap(v => v.pins)
  const uniquePins = allPins.filter((p, i, arr) => arr.findIndex(q => q.id === p.id) === i)
  const activePinData = uniquePins.find(p => p.id === activePin)
  const totalLocations = Object.keys(zoneFiles).length + Object.keys(zoneTexts).filter(k => zoneTexts[k]).length
  const extrasCost = selectedExtras.reduce((sum, id) => sum + (extras.find(e => e.id === id)?.price || 0), 0)
  const printCost = totalLocations * (method?.basePrice || 6)
  const screenSetupCost = method?.hasScreenFee ? screenColors * SCREEN_FEE : 0
  const totalPrice = prod.basePrice + printCost + screenSetupCost + extrasCost

  const toggleExtra = (id) => setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  const handleFileUpload = (e) => { const f = e.target.files[0]; if (f && activePin) setZoneFiles(prev => ({ ...prev, [activePin]: f.name })) }
  const rotateView = (dir) => {
    const idx = viewOrder.indexOf(view)
    const next = (idx + dir + viewOrder.length) % viewOrder.length
    setView(viewOrder[next])
    setActivePin(null)
  }

  const inputStyle = { width: '100%', background: t.main, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: t.cardText, outline: 'none', boxSizing: 'border-box' }
  const sectionLabel = (txt) => <p style={{ fontSize: '11px', fontWeight: '700', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{txt}</p>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.main, fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', background: t.sidebar, display: 'flex', flexDirection: 'column', padding: '28px 20px', position: 'fixed', height: '100vh', justifyContent: 'space-between', zIndex: 10 }}>
        <div>
          <div style={{ marginBottom: '32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width: '110px', filter: t.logoFilter }} />
          </div>
          <div style={{ marginBottom: '36px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText, fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>BA</div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: 0 }}>Brand A</p>
            <p style={{ fontSize: '12px', color: t.sidebarText, margin: '2px 0 0' }}>Growth tier</p>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Dashboard', active: false, badge: null },
              { label: 'Orders', active: false, badge: '2' },
              { label: 'Artwork', active: false, badge: null },
              { label: 'Inventory', active: false, badge: null },
              { label: 'Design Studio', active: true, badge: null },
              { label: 'Billing', active: false, badge: null },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', background: item.active ? t.sidebarActive : 'transparent', color: item.active ? t.sidebarActiveTxt : t.sidebarText, fontSize: '14px', fontWeight: item.active ? '600' : '400' }}>
                <span>{item.label}</span>
                {item.badge && <span style={{ background: '#F59E0B', color: 'white', fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px' }}>{item.badge}</span>}
              </div>
            ))}
          </nav>
        </div>
        <div>
          <div style={{ padding: '10px 12px', fontSize: '13px', color: t.sidebarText, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎨</span> Theme
          </div>
          <div style={{ fontSize: '14px', color: t.sidebarText, cursor: 'pointer', padding: '10px 12px' }}>🚪 Log out</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ background: t.card, borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: t.cardText, margin: 0 }}>Design Studio</h1>
            <p style={{ fontSize: '12px', color: t.cardSub, margin: '2px 0 0' }}>Select a product · rotate 360° · click a pin to add artwork</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: t.cardSub, margin: 0 }}>Estimated cost to you</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: t.cardText, margin: 0 }}>${totalPrice.toFixed(2)}</p>
            </div>
            <button onClick={() => setShowSubmit(true)} disabled={totalLocations === 0} style={{ background: totalLocations > 0 ? '#16A34A' : 'rgba(0,0,0,0.08)', color: totalLocations > 0 ? 'white' : t.cardSub, border: 'none', borderRadius: '14px', padding: '13px 24px', fontSize: '13px', fontWeight: '700', cursor: totalLocations > 0 ? 'pointer' : 'not-allowed' }}>
              Submit print job
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1 }}>

          {/* Left panel */}
          <div style={{ width: '270px', background: t.card, borderRight: '1px solid rgba(0,0,0,0.06)', padding: '20px', overflowY: 'auto', flexShrink: 0 }}>

            {sectionLabel('Product')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {Object.entries(products).map(([code, p]) => (
                <div key={code} onClick={() => setSelectedProduct(code)} style={{ border: `2px solid ${selectedProduct === code ? t.accent : 'rgba(0,0,0,0.08)'}`, borderRadius: '10px', padding: '10px 6px', cursor: 'pointer', textAlign: 'center', background: selectedProduct === code ? t.main : 'transparent' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{p.icon}</div>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: t.cardText, margin: 0 }}>{p.label}</p>
                </div>
              ))}
            </div>

            {sectionLabel('Blank style')}
            <select value={selectedBlank} onChange={e => setSelectedBlank(e.target.value)} style={{ ...inputStyle, marginBottom: '14px' }}>
              {prod.blanks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {sectionLabel('Color')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
              {prod.colors.map(c => (
                <div key={c.name} onClick={() => setSelectedColor(c)} title={c.name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c.hex, cursor: 'pointer', border: selectedColor?.name === c.name ? `3px solid ${t.accent}` : '2px solid rgba(0,0,0,0.12)', boxSizing: 'border-box' }} />
              ))}
            </div>
            {selectedColor && <p style={{ fontSize: '11px', color: t.cardSub, margin: '0 0 14px' }}>{selectedColor.name}</p>}

            {sectionLabel('Size')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {prod.sizes.map(s => (
                <div key={s} onClick={() => setSelectedSize(s)} style={{ padding: '5px 10px', borderRadius: '8px', border: `1.5px solid ${selectedSize === s ? t.accent : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', fontSize: '12px', fontWeight: selectedSize === s ? '700' : '400', color: selectedSize === s ? t.cardText : t.cardSub, background: selectedSize === s ? t.main : 'transparent' }}>
                  {s}
                </div>
              ))}
            </div>

            {sectionLabel('Print method')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
              {methods.map(m => (
                <div key={m.code} onClick={() => setSelectedMethod(m.code)} style={{ border: `1.5px solid ${selectedMethod === m.code ? t.accent : 'rgba(0,0,0,0.08)'}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', background: selectedMethod === m.code ? t.main : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: t.cardText, margin: 0 }}>{m.label}</p>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: m.color, background: m.bg, padding: '2px 8px', borderRadius: '20px' }}>+${m.basePrice} per location</span>
                  </div>
                  <p style={{ fontSize: '11px', color: t.cardSub, margin: 0 }}>{m.desc}</p>
                </div>
              ))}
            </div>

            {/* Screen color selector — only shows for screen print */}
            {method?.hasScreenFee && (
              <div style={{ background: '#FEF9E7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px', marginBottom: '16px', marginTop: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', margin: '0 0 4px' }}>Screen printing setup fee</p>
                <p style={{ fontSize: '11px', color: '#B45309', margin: '0 0 12px', lineHeight: 1.5 }}>Each color in your design requires a separate screen. Setup fee is $30 per color/screen. This is a one-time fee — reorders of the same design do not pay setup again.</p>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#92400E', margin: '0 0 8px' }}>How many colors in your design?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {[1,2,3,4,5,6].map(n => (
                    <div key={n} onClick={() => setScreenColors(n)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `2px solid ${screenColors === n ? '#D97706' : 'rgba(0,0,0,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', background: screenColors === n ? '#FEF3C7' : 'white', color: screenColors === n ? '#D97706' : '#666' }}>
                      {n}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '12px', color: '#92400E' }}>{screenColors} color{screenColors > 1 ? 's' : ''} × $30</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#D97706' }}>+${screenSetupCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            {sectionLabel('Add-ons')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {extras.map(ex => (
                <div key={ex.id} onClick={() => toggleExtra(ex.id)} style={{ border: `1.5px solid ${selectedExtras.includes(ex.id) ? t.accent : 'rgba(0,0,0,0.08)'}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', background: selectedExtras.includes(ex.id) ? t.main : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: t.cardText, margin: 0 }}>{selectedExtras.includes(ex.id) ? '✓ ' : ''}{ex.label}</p>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#D97706' }}>+${ex.price.toFixed(2)}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: t.cardSub, margin: 0 }}>{ex.desc}</p>
                </div>
              ))}
            </div>

            {sectionLabel('Special instructions')}
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes for our production team..." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          {/* Center — product viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', background: t.main, overflowY: 'auto' }}>

            {/* 360 controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => rotateView(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', background: t.card, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.cardText }}>←</button>
              <div style={{ display: 'flex', gap: '6px' }}>
                {viewOrder.map(v => (
                  <button key={v} onClick={() => { setView(v); setActivePin(null) }} style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '12px', cursor: 'pointer', background: view === v ? t.accent : t.card, color: view === v ? t.accentText : t.cardSub }}>
                    {prod.views[v].label}
                  </button>
                ))}
              </div>
              <button onClick={() => rotateView(1)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', background: t.card, cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.cardText }}>→</button>
            </div>

            {/* Garment with pins */}
            <div style={{ position: 'relative', width: '380px', height: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              <img src={currentView.img} alt={`${prod.label}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
              <div style={{ position: 'absolute', inset: 0, background: `${selectedColor?.hex || '#1a1a1a'}18`, pointerEvents: 'none' }} />

              {currentView.pins.map(pin => {
                const hasContent = zoneFiles[pin.id] || zoneTexts[pin.id]
                const isActive = activePin === pin.id
                return (
                  <div key={pin.id} onClick={() => setActivePin(isActive ? null : pin.id)} style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)', cursor: 'pointer', zIndex: 10, transition: 'all .2s', filter: isActive ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: hasContent ? '#16A34A' : isActive ? t.accent : 'white', border: `3px solid ${hasContent ? '#15803D' : isActive ? t.accent : 'rgba(0,0,0,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                      <span style={{ transform: 'rotate(45deg)', fontSize: '13px', fontWeight: '800', color: hasContent ? 'white' : isActive ? t.accentText : '#1a1a1a', lineHeight: 1 }}>
                        {hasContent ? '✓' : pin.num}
                      </span>
                    </div>
                    {/* Tooltip */}
                    <div style={{ position: 'absolute', bottom: '44px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.88)', color: 'white', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap', opacity: isActive ? 1 : 0, transition: 'opacity .2s', pointerEvents: 'none' }}>
                      {pin.label}
                    </div>
                  </div>
                )
              })}

              <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '12px', fontWeight: '600', padding: '5px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                {currentView.label} · {currentView.pins.length} print location{currentView.pins.length !== 1 ? 's' : ''}
              </div>
            </div>

            <p style={{ fontSize: '12px', color: t.cardSub, margin: '14px 0 0', textAlign: 'center' }}>
              Use ← → to rotate 360°. Click a numbered pin to add artwork to that location.
            </p>

            {/* Locations summary */}
            {totalLocations > 0 && (
              <div style={{ marginTop: '20px', background: t.card, borderRadius: '16px', padding: '16px 20px', width: '380px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: t.cardText, margin: '0 0 10px' }}>
                  {totalLocations} print location{totalLocations !== 1 ? 's' : ''} added
                </p>
                {[...Object.entries(zoneFiles), ...Object.entries(zoneTexts).filter(([,v]) => v)].map(([zid, val], i) => {
                  const pinData = uniquePins.find(p => p.id === zid)
                  const isFile = !!zoneFiles[zid]
                  return (
                    <div key={zid + i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                          {pinData?.num || '?'}
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: t.cardText, margin: 0 }}>{pinData?.label || zid}</p>
                          <p style={{ fontSize: '11px', color: t.cardSub, margin: 0 }}>{isFile ? `📁 ${val}` : `✏️ "${val}"`}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: t.cardSub }}>+${method?.basePrice.toFixed(2)}</span>
                        <button onClick={() => { if (isFile) setZoneFiles(prev => { const n={...prev}; delete n[zid]; return n }); else setZoneTexts(prev => { const n={...prev}; delete n[zid]; return n }) }} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '16px', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ width: '280px', background: t.card, borderLeft: '1px solid rgba(0,0,0,0.06)', padding: '20px', overflowY: 'auto', flexShrink: 0 }}>
            {activePin && activePinData ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: t.accentText, flexShrink: 0 }}>
                    {activePinData.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: 0 }}>{activePinData.label}</p>
                    <p style={{ fontSize: '11px', color: t.cardSub, margin: 0 }}>+${method?.basePrice.toFixed(2)} · {method?.label}</p>
                  </div>
                  <button onClick={() => setActivePin(null)} style={{ background: 'none', border: 'none', color: t.cardSub, fontSize: '18px', cursor: 'pointer', padding: 0 }}>✕</button>
                </div>

                <p style={{ fontSize: '11px', fontWeight: '700', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Upload artwork file</p>
                <label style={{ display: 'block', border: `2px dashed ${zoneFiles[activePin] ? '#22C55E' : 'rgba(0,0,0,0.12)'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '14px', background: zoneFiles[activePin] ? '#F0FDF4' : 'transparent' }}>
                  <input type="file" accept=".png,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                  {zoneFiles[activePin] ? (
                    <div>
                      <p style={{ fontSize: '20px', margin: '0 0 4px' }}>✓</p>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', margin: 0 }}>{zoneFiles[activePin]}</p>
                      <p style={{ fontSize: '11px', color: '#16A34A', margin: '3px 0 0' }}>Tap to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '24px', margin: '0 0 6px' }}>📁</p>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: t.cardText, margin: 0 }}>Upload artwork</p>
                      <p style={{ fontSize: '11px', color: t.cardSub, margin: '3px 0 0' }}>PNG or PDF · 300 DPI min</p>
                    </div>
                  )}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
                  <span style={{ fontSize: '11px', color: t.cardSub }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }}></div>
                </div>

                <p style={{ fontSize: '11px', fontWeight: '700', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Add text to print</p>
                <input value={zoneTexts[activePin] || ''} onChange={e => setZoneTexts(prev => ({ ...prev, [activePin]: e.target.value }))} placeholder="Type text to print here..." style={{ ...inputStyle, marginBottom: '16px' }} />

                {/* Cost for this location */}
                <div style={{ background: t.main, borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: t.cardSub, margin: '0 0 2px' }}>Cost for this location</p>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: t.cardText, margin: 0 }}>+${method?.basePrice.toFixed(2)}</p>
                  {method?.hasScreenFee && (
                    <p style={{ fontSize: '11px', color: '#D97706', margin: '4px 0 0' }}>+ screen setup fee applies (see left panel)</p>
                  )}
                </div>

                {(zoneFiles[activePin] || zoneTexts[activePin]) && (
                  <button onClick={() => { setZoneFiles(prev => { const n={...prev}; delete n[activePin]; return n }); setZoneTexts(prev => { const n={...prev}; delete n[activePin]; return n }) }} style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Remove artwork from this location
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '48px' }}>
                <p style={{ fontSize: '36px', margin: '0 0 12px' }}>📍</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: '0 0 6px' }}>Click a numbered pin</p>
                <p style={{ fontSize: '12px', color: t.cardSub, lineHeight: 1.6, margin: '0 0 24px' }}>
                  Rotate the product with the arrows and click any pin to add artwork or text to that location
                </p>

                {/* Price breakdown */}
                <div style={{ background: t.main, borderRadius: '14px', padding: '16px', textAlign: 'left' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Price breakdown</p>
                  {[
                    { label: 'Base product', value: prod.basePrice, sub: null },
                    { label: `Print locations (${totalLocations} × $${method?.basePrice})`, value: printCost, sub: null },
                    method?.hasScreenFee ? { label: `Screen setup (${screenColors} color${screenColors > 1 ? 's' : ''} × $30)`, value: screenSetupCost, sub: 'One-time fee — free on reorders' } : null,
                    extrasCost > 0 ? { label: 'Add-ons', value: extrasCost, sub: null } : null,
                  ].filter(Boolean).map(row => (
                    <div key={row.label} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: t.cardSub }}>{row.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: t.cardText }}>${row.value.toFixed(2)}</span>
                      </div>
                      {row.sub && <p style={{ fontSize: '10px', color: '#16A34A', margin: '1px 0 0' }}>{row.sub}</p>}
                    </div>
                  ))}
                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.08)', margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: t.cardText }}>Total</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: t.cardText }}>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSubmit(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 6px' }}>Submit print job</h2>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 20px' }}>Review your complete order before sending to production</p>
            <div style={{ background: '#F5F5F0', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Product', value: `${prod.label} — ${selectedBlank}` },
                { label: 'Color / Size', value: `${selectedColor?.name} / ${selectedSize}` },
                { label: 'Print method', value: method?.label },
                { label: 'Print locations', value: `${totalLocations} location${totalLocations !== 1 ? 's' : ''}` },
                method?.hasScreenFee ? { label: `Screen setup (${screenColors} color${screenColors > 1 ? 's' : ''})`, value: `$${screenSetupCost.toFixed(2)} — one-time fee` } : null,
                selectedExtras.length > 0 ? { label: 'Add-ons', value: selectedExtras.map(id => extras.find(e => e.id === id)?.label).join(', ') } : null,
                { label: 'Total cost to you', value: `$${totalPrice.toFixed(2)}` },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#FEF9E7', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                Our team will review your files within 1–2 hours. You will receive an email when your job is approved and in production. If we have any questions about your files we will contact you before printing.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowSubmit(false)} style={{ flex: 1, background: '#F5F5F0', color: '#1a1a1a', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Go back
              </button>
              <button onClick={() => { setShowSubmit(false); alert('Print job submitted! Our team will review your files and be in touch shortly.') }} style={{ flex: 2, background: '#16A34A', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                ✓ Confirm and submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}