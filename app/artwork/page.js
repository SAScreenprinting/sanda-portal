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

const categories = {
  apparel: {
    label: 'Apparel',
    icon: '👕',
    desc: 'T-shirts, hoodies, crewnecks, tanks, long sleeves, youth tees',
    methods: ['Screen Print', 'DTF', 'Embroidery'],
    products: {
      TEE:  { label: 'T-Shirt', blanks: [{ code: 'BC3001', label: 'Bella Canvas 3001' }, { code: 'NL3600', label: 'Next Level 3600' }, { code: 'GD64', label: 'Gildan 64000' }], colors: ['Black','White','Navy','Gray','Heather Gray','Red'], sizes: ['XS','S','M','L','XL','2XL','3XL'], locations: ['Front chest','Back center','Left chest','Right chest','Left sleeve','Right sleeve','Neck label area'] },
      HOD:  { label: 'Hoodie', blanks: [{ code: 'GD18500', label: 'Gildan 18500' }, { code: 'BC3719', label: 'Bella Canvas 3719' }, { code: 'IND4000', label: 'Independent IND4000' }], colors: ['Black','White','Navy','Gray','Heather Gray'], sizes: ['S','M','L','XL','2XL'], locations: ['Front chest','Back center','Left chest','Hood','Pocket area','Left sleeve'] },
      CRW:  { label: 'Crewneck', blanks: [{ code: 'GD18000', label: 'Gildan 18000' }, { code: 'BC3901', label: 'Bella Canvas 3901' }], colors: ['Black','White','Navy','Heather Gray'], sizes: ['S','M','L','XL','2XL'], locations: ['Front chest','Back center','Left chest','Left sleeve'] },
      TNK:  { label: 'Tank Top', blanks: [{ code: 'BC3480', label: 'Bella Canvas 3480' }, { code: 'NL3533', label: 'Next Level 3533' }], colors: ['Black','White','Navy','Gray'], sizes: ['XS','S','M','L','XL'], locations: ['Front chest','Back center','Left chest'] },
      LSL:  { label: 'Long Sleeve', blanks: [{ code: 'BC3501', label: 'Bella Canvas 3501' }, { code: 'NL3601', label: 'Next Level 3601' }, { code: 'GD5400', label: 'Gildan 5400' }], colors: ['Black','White','Navy','Gray'], sizes: ['XS','S','M','L','XL','2XL'], locations: ['Front chest','Back center','Left chest','Left sleeve','Right sleeve'] },
      YTH:  { label: 'Youth Tee', blanks: [{ code: 'BC3001Y', label: 'Bella Canvas 3001Y' }, { code: 'GD64Y', label: 'Gildan 64000B' }], colors: ['Black','White','Navy','Gray','Red'], sizes: ['YXS','YS','YM','YL','YXL'], locations: ['Front chest','Back center','Left chest'] },
    }
  },
  accessories: {
    label: 'Accessories',
    icon: '🧢',
    desc: 'Hats, tote bags, patches',
    methods: ['Embroidery', 'DTF'],
    products: {
      HAT:  { label: 'Hat/Cap', blanks: [{ code: 'OT101', label: 'Otto Cap 101' }, { code: 'YP609', label: 'Yupoong YP609' }], colors: ['Black','White','Navy','Gray','Khaki'], sizes: ['One Size'], locations: ['Front center','Left side','Right side','Back strap','Under brim'] },
      TOT:  { label: 'Tote Bag', blanks: [{ code: 'LB8503', label: 'Liberty Bags 8503' }], colors: ['Natural','Black','Navy'], sizes: ['One Size'], locations: ['Front center','Back center'] },
      PATCH: { label: 'Sewn-on Patch', blanks: [{ code: 'CUSTOM', label: 'Custom patch (you supply artwork)' }], colors: ['Custom'], sizes: ['Custom size'], locations: ['Left chest','Right chest','Left sleeve','Right sleeve','Back center','Front chest','Hat front','Anywhere — specify in notes'] },
    }
  },
  laser: {
    label: 'Laser Engraving',
    icon: '⚡',
    desc: 'Tumblers, metal cards, and more hard goods',
    methods: ['Laser Engraving'],
    products: {
      TUMBLER: { label: 'Tumbler / Drinkware', blanks: [{ code: 'YETI20', label: 'YETI 20oz Rambler' }, { code: 'YETI30', label: 'YETI 30oz Rambler' }, { code: 'HYDRO', label: 'Hydro Flask 21oz' }, { code: 'CUSTOM', label: 'Customer supplies tumbler' }], colors: ['Stainless','Black','White','Navy','Red'], sizes: ['20oz','30oz','40oz','Custom'], locations: ['Full wrap','Front panel','Back panel','Bottom'] },
      METALCARD: { label: 'Metal Business Card', blanks: [{ code: 'SS304', label: 'Stainless Steel 304' }, { code: 'BRASS', label: 'Brushed Brass' }, { code: 'BLK', label: 'Black Coated Steel' }], colors: ['Silver','Gold','Black','Rose Gold'], sizes: ['Standard 3.5x2in','Custom size'], locations: ['Front','Back','Front + Back'] },
    }
  }
}

const printMethodDetails = {
  'Screen Print': {
    desc: 'Ink pressed through a mesh screen onto the garment. Best for bold, solid designs. Extremely durable and vibrant.',
    bestFor: 'Bold graphics, large runs, 1–6 solid colors',
    notFor: 'Photographic images, gradients, very small text',
    photo: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&q=80',
    tag: 'Most popular', tagColor: '#16A34A', tagBg: '#F0FDF4',
  },
  'DTF': {
    desc: 'Full color design printed onto film then heat-transferred. Excellent for complex, multi-color, and photographic designs.',
    bestFor: 'Full color, photos, gradients, small runs, dark fabrics',
    notFor: 'Very large prints on a budget',
    photo: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500&q=80',
    tag: 'Best for detail', tagColor: '#2563EB', tagBg: '#EFF6FF',
  },
  'Embroidery': {
    desc: 'Design stitched directly into the fabric using thread. Premium, professional look with texture and depth.',
    bestFor: 'Logos, hats, left chest placement, premium brands',
    notFor: 'Very fine detail, photographic images',
    photo: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&q=80',
    tag: 'Premium look', tagColor: '#7C3AED', tagBg: '#F5F3FF',
  },
  'Laser Engraving': {
    desc: 'Laser precisely removes material surface to create permanent, high-detail engravings. No ink, no fading, no peeling.',
    bestFor: 'Metal cards, tumblers, hard goods, logos, text',
    notFor: 'Fabric or soft goods',
    photo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80',
    tag: 'Permanent finish', tagColor: '#D97706', tagBg: '#FFFBEB',
  },
}

const artworkFiles = [
  { id: 1, name: 'summer-collection-front.png', sku: 'TEE-BC3001-BLK-LG-SCR-FC', category: 'Apparel', method: 'Screen Print', locations: ['Front chest'], dpi: 300, status: 'approved', uploaded: 'May 1, 2026' },
  { id: 2, name: 'logo-left-chest.png', sku: 'HOD-GD18500-NVY-LG-EMB-LC', category: 'Apparel', method: 'Embroidery', locations: ['Left chest'], dpi: 300, status: 'approved', uploaded: 'Apr 28, 2026' },
  { id: 3, name: 'back-print-v2.pdf', sku: 'CRW-GD18000-HGR-LG-DTF-BC', category: 'Apparel', method: 'DTF', locations: ['Back center'], dpi: 300, status: 'pending', uploaded: 'May 8, 2026' },
  { id: 4, name: 'hat-logo-final.png', sku: 'HAT-OT101-BLK-OS-EMB-FC', category: 'Accessories', method: 'Embroidery', locations: ['Front center'], dpi: 300, status: 'approved', uploaded: 'Apr 15, 2026' },
  { id: 5, name: 'tumbler-logo.png', sku: 'TUMBLER-YETI20-SS-20OZ-LSR-FP', category: 'Laser', method: 'Laser Engraving', locations: ['Front panel'], dpi: 300, status: 'approved', uploaded: 'May 3, 2026' },
  { id: 6, name: 'metal-card-design.pdf', sku: 'METALCARD-SS304-SLV-STD-LSR-FRONT', category: 'Laser', method: 'Laser Engraving', locations: ['Front'], dpi: 300, status: 'pending', uploaded: 'May 6, 2026' },
  { id: 7, name: 'tote-design-draft.png', sku: 'TOT-LB8503-NAT-OS-DTF-FC', category: 'Accessories', method: 'DTF', locations: ['Front center'], dpi: 72, status: 'rejected', uploaded: 'May 7, 2026', reason: 'Resolution too low — file is 72 DPI. Please re-export at 300 DPI minimum.' },
]

const statusStyle = {
  approved: { color: '#16A34A', bg: '#F0FDF4', label: 'Approved' },
  pending:  { color: '#D97706', bg: '#FFFBEB', label: 'Pending review' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', label: 'Rejected' },
}

export default function Artwork() {
  const [activeTheme, setActiveTheme] = useState('classic')
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('all')
  const [step, setStep] = useState(1)

  // Form
  const [category, setCategory] = useState('')
  const [product, setProduct] = useState('')
  const [blank, setBlank] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [method, setMethod] = useState('')
  const [locations, setLocations] = useState([])
  const [wantsLabel, setWantsLabel] = useState(false)
  const [labelType, setLabelType] = useState('')
  const [wantsPatch, setWantsPatch] = useState(false)
  const [patchLocation, setPatchLocation] = useState('')
  const [patchFile, setPatchFile] = useState(null)
  const [artFile, setArtFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme')
    if (saved && themes[saved]) setActiveTheme(saved)
  }, [])

  useEffect(() => {
    setProduct(''); setBlank(''); setColor(''); setSize(''); setMethod(''); setLocations([])
  }, [category])

  useEffect(() => {
    setBlank(''); setColor(''); setSize(''); setLocations([])
  }, [product])

  const t = themes[activeTheme]
  const filtered = filter === 'all' ? artworkFiles : artworkFiles.filter(f => f.status === filter)
  const catData = category ? categories[category] : null
  const prodData = product && catData ? catData.products[product] : null
  const methodData = method ? printMethodDetails[method] : null

  const toggleLocation = (loc) => setLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])

  const step1Done = category && product && blank && color && size
  const step2Done = method !== ''
  const step3Done = locations.length > 0
  const formReady = step1Done && step2Done && step3Done && artFile && confirmed

  const inputStyle = { width: '100%', background: t.main, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: t.cardText, outline: 'none', boxSizing: 'border-box' }
  const sectionHead = (txt) => <p style={{ fontSize: '11px', fontWeight: '700', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{txt}</p>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.main, fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', background: t.sidebar, display: 'flex', flexDirection: 'column', padding: '28px 20px', position: 'fixed', height: '100vh', justifyContent: 'space-between' }}>
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
              { label: 'Artwork', active: true, badge: null },
              { label: 'Inventory', active: false, badge: null },
              { label: 'Design Studio', active: false, badge: null },
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
      <div style={{ marginLeft: '220px', flex: 1, padding: '36px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: t.cardText, margin: 0 }}>Artwork library</h1>
            <p style={{ fontSize: '13px', color: t.cardSub, margin: '6px 0 0' }}>All print files for your account</p>
          </div>
          <button onClick={() => { setShowUpload(!showUpload); setStep(1) }} style={{ background: t.accent, color: t.accentText, border: 'none', borderRadius: '14px', padding: '12px 22px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            {showUpload ? '✕ Cancel' : '+ Upload new file'}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div style={{ background: t.card, borderRadius: '20px', padding: '28px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: t.cardText, margin: '0 0 4px' }}>Upload artwork file</h2>
            <p style={{ fontSize: '13px', color: t.cardSub, margin: '0 0 24px' }}>Complete each step below. Your SKU is generated automatically.</p>

            {/* Step indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              {[
                { n: 1, label: 'Product' },
                { n: 2, label: 'Print method' },
                { n: 3, label: 'Locations' },
                { n: 4, label: 'Extras' },
                { n: 5, label: 'Upload' },
              ].map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => { if (s.n <= step || (s.n === 2 && step1Done) || (s.n === 3 && step2Done) || (s.n === 4 && step3Done) || (s.n === 5 && step3Done)) setStep(s.n) }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', background: step > s.n ? '#16A34A' : step === s.n ? t.accent : 'rgba(0,0,0,0.08)', color: step > s.n ? 'white' : step === s.n ? t.accentText : t.cardSub }}>
                      {step > s.n ? '✓' : s.n}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: step === s.n ? '700' : '400', color: step === s.n ? t.cardText : t.cardSub }}>{s.label}</span>
                  </div>
                  {i < 4 && <div style={{ width: '24px', height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>}
                </div>
              ))}
            </div>

            {/* STEP 1 — Product */}
            {step === 1 && (
              <div>
                {sectionHead('Step 1 — Select your product category and details')}

                {/* Category cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {Object.entries(categories).map(([key, cat]) => (
                    <div key={key} onClick={() => setCategory(key)} style={{ border: `2px solid ${category === key ? t.accent : 'rgba(0,0,0,0.08)'}`, borderRadius: '14px', padding: '16px', cursor: 'pointer', background: category === key ? (t.accent === '#1a1a1a' ? '#f5f5f5' : t.main) : t.main, transition: 'all .15s' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.icon}</div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: '0 0 4px' }}>{cat.label}</p>
                      <p style={{ fontSize: '11px', color: t.cardSub, margin: 0, lineHeight: 1.4 }}>{cat.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Product dropdowns */}
                {category && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      {sectionHead('Product type')}
                      <select value={product} onChange={e => setProduct(e.target.value)} style={inputStyle}>
                        <option value="">Select product...</option>
                        {Object.entries(catData.products).map(([code, p]) => (
                          <option key={code} value={code}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    {product && (
                      <div>
                        {sectionHead('Blank style')}
                        <select value={blank} onChange={e => setBlank(e.target.value)} style={inputStyle}>
                          <option value="">Select blank...</option>
                          {prodData?.blanks.map(b => <option key={b.code} value={b.code}>{b.label}</option>)}
                        </select>
                      </div>
                    )}
                    {product && category !== 'laser' && (
                      <>
                        <div>
                          {sectionHead('Color')}
                          <select value={color} onChange={e => setColor(e.target.value)} style={inputStyle}>
                            <option value="">Select color...</option>
                            {prodData?.colors.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          {sectionHead('Size')}
                          <select value={size} onChange={e => setSize(e.target.value)} style={inputStyle}>
                            <option value="">Select size...</option>
                            {prodData?.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    {product && category === 'laser' && (
                      <>
                        <div>
                          {sectionHead('Material / finish')}
                          <select value={color} onChange={e => setColor(e.target.value)} style={inputStyle}>
                            <option value="">Select finish...</option>
                            {prodData?.colors.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          {sectionHead('Size / capacity')}
                          <select value={size} onChange={e => setSize(e.target.value)} style={inputStyle}>
                            <option value="">Select size...</option>
                            {prodData?.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  disabled={!step1Done}
                  onClick={() => setStep(2)}
                  style={{ marginTop: '20px', background: step1Done ? t.accent : 'rgba(0,0,0,0.08)', color: step1Done ? t.accentText : t.cardSub, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '700', cursor: step1Done ? 'pointer' : 'not-allowed' }}
                >
                  Next — Choose print method →
                </button>
              </div>
            )}

            {/* STEP 2 — Print method */}
            {step === 2 && (
              <div>
                {sectionHead('Step 2 — Choose your print method')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  {catData?.methods.map((m) => {
                    const md = printMethodDetails[m]
                    const selected = method === m
                    return (
                      <div key={m} onClick={() => setMethod(m)} style={{ border: `2px solid ${selected ? t.accent : 'rgba(0,0,0,0.08)'}`, borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all .15s' }}>
                        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                          <img src={md.photo} alt={m} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                          <div style={{ position: 'absolute', top: '10px', right: '10px', background: md.tagBg, color: md.tagColor, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>{md.tag}</div>
                          {selected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '32px' }}>✓</span></div>}
                        </div>
                        <div style={{ padding: '14px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: '0 0 4px' }}>{m}</p>
                          <p style={{ fontSize: '12px', color: t.cardSub, margin: '0 0 8px', lineHeight: 1.4 }}>{md.desc}</p>
                          <p style={{ fontSize: '11px', color: '#16A34A', margin: '0 0 2px', fontWeight: '600' }}>✓ Best for: {md.bestFor}</p>
                          <p style={{ fontSize: '11px', color: '#DC2626', margin: 0 }}>✗ Not for: {md.notFor}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} style={{ background: t.main, color: t.cardText, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
                  <button disabled={!step2Done} onClick={() => setStep(3)} style={{ background: step2Done ? t.accent : 'rgba(0,0,0,0.08)', color: step2Done ? t.accentText : t.cardSub, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '700', cursor: step2Done ? 'pointer' : 'not-allowed' }}>
                    Next — Select locations →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Locations */}
            {step === 3 && (
              <div>
                {sectionHead('Step 3 — Select print locations (choose all that apply)')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                  {prodData?.locations.map(loc => (
                    <div key={loc} onClick={() => toggleLocation(loc)} style={{ padding: '10px 16px', borderRadius: '12px', border: `2px solid ${locations.includes(loc) ? t.accent : 'rgba(0,0,0,0.08)'}`, background: locations.includes(loc) ? (t.accent === '#1a1a1a' ? '#f0f0f0' : t.main) : t.main, cursor: 'pointer', fontSize: '13px', fontWeight: locations.includes(loc) ? '700' : '400', color: locations.includes(loc) ? t.cardText : t.cardSub, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {locations.includes(loc) && <span style={{ color: t.accent }}>✓</span>}
                      {loc}
                    </div>
                  ))}
                </div>
                {locations.length > 0 && (
                  <div style={{ background: t.main, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: t.cardSub, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected locations</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: t.cardText, margin: 0 }}>{locations.join(' + ')}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(2)} style={{ background: t.main, color: t.cardText, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
                  <button disabled={!step3Done} onClick={() => setStep(4)} style={{ background: step3Done ? t.accent : 'rgba(0,0,0,0.08)', color: step3Done ? t.accentText : t.cardSub, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '700', cursor: step3Done ? 'pointer' : 'not-allowed' }}>
                    Next — Add extras →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — Extras */}
            {step === 4 && (
              <div>
                {sectionHead('Step 4 — Optional extras')}

                {/* Private label — only for apparel */}
                {category === 'apparel' && (
                  <div style={{ background: t.main, borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: wantsLabel ? '14px' : 0 }}>
                      <input type="checkbox" checked={wantsLabel} onChange={e => setWantsLabel(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: 0 }}>Add private label</p>
                        <p style={{ fontSize: '12px', color: t.cardSub, margin: '2px 0 0' }}>Replace the manufacturer tag with your brand label — woven or printed</p>
                      </div>
                    </label>
                    {wantsLabel && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                        {[
                          { type: 'woven', label: 'Woven label', desc: 'Thread-stitched into the garment. Most premium option. Feels like a real brand.' },
                          { type: 'printed', label: 'Printed label', desc: 'Printed directly on the inside neck area. Clean, soft, no itching.' },
                        ].map(opt => (
                          <div key={opt.type} onClick={() => setLabelType(opt.type)} style={{ border: `2px solid ${labelType === opt.type ? t.accent : 'rgba(0,0,0,0.08)'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer', background: 'white' }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: t.cardText, margin: '0 0 4px' }}>{labelType === opt.type ? '✓ ' : ''}{opt.label}</p>
                            <p style={{ fontSize: '12px', color: t.cardSub, margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sewn-on patch */}
                {(category === 'apparel' || category === 'accessories') && (
                  <div style={{ background: t.main, borderRadius: '14px', padding: '18px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: wantsPatch ? '14px' : 0 }}>
                      <input type="checkbox" checked={wantsPatch} onChange={e => setWantsPatch(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: 0 }}>Add sewn-on patch</p>
                        <p style={{ fontSize: '12px', color: t.cardSub, margin: '2px 0 0' }}>Upload your patch artwork and specify where you want it sewn</p>
                      </div>
                    </label>
                    {wantsPatch && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '600', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Patch location</p>
                          <select value={patchLocation} onChange={e => setPatchLocation(e.target.value)} style={inputStyle}>
                            <option value="">Select where to sew the patch...</option>
                            {['Left chest', 'Right chest', 'Left sleeve', 'Right sleeve', 'Back center', 'Front center', 'Hat front', 'Custom — specify in notes'].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: '600', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Patch artwork file</p>
                          <label style={{ display: 'block', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                            <input type="file" accept=".png,.pdf" onChange={e => { if (e.target.files[0]) setPatchFile(e.target.files[0].name) }} style={{ display: 'none' }} />
                            <p style={{ fontSize: '13px', fontWeight: '600', color: patchFile ? '#16A34A' : t.cardText, margin: 0 }}>{patchFile ? `✓ ${patchFile}` : 'Upload patch artwork (PNG or PDF)'}</p>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Special instructions (optional)</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any specific requirements, color references, placement notes..." maxLength={400} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
                  <p style={{ fontSize: '11px', color: t.cardSub, margin: '2px 0 0', textAlign: 'right' }}>{notes.length}/400</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(3)} style={{ background: t.main, color: t.cardText, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
                  <button onClick={() => setStep(5)} style={{ background: t.accent, color: t.accentText, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    Next — Upload file →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 — Upload + submit */}
            {step === 5 && (
              <div>
                {sectionHead('Step 5 — Upload your artwork file and submit')}

                {/* Order summary */}
                <div style={{ background: t.main, borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Your order summary</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'Category', value: catData?.label },
                      { label: 'Product', value: catData?.products[product]?.label },
                      { label: 'Blank', value: blank },
                      { label: 'Color / Finish', value: color },
                      { label: 'Size', value: size },
                      { label: 'Print method', value: method },
                      { label: 'Locations', value: locations.join(' + ') },
                      { label: 'Private label', value: wantsLabel ? labelType : 'None' },
                      { label: 'Sewn patch', value: wantsPatch ? (patchLocation || 'Location TBD') : 'None' },
                    ].map(row => (
                      <div key={row.label} style={{ background: 'white', borderRadius: '8px', padding: '8px 12px' }}>
                        <p style={{ fontSize: '10px', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>{row.label}</p>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: t.cardText, margin: 0 }}>{row.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File upload */}
                <label style={{ display: 'block', border: '2px dashed rgba(0,0,0,0.12)', borderRadius: '14px', padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                  <input type="file" accept=".png,.pdf" onChange={e => { if (e.target.files[0]) setArtFile(e.target.files[0].name) }} style={{ display: 'none' }} />
                  {artFile ? (
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#16A34A', margin: 0 }}>✓ {artFile}</p>
                      <p style={{ fontSize: '12px', color: t.cardSub, margin: '4px 0 0' }}>Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📁</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: 0 }}>Click to upload artwork file</p>
                      <p style={{ fontSize: '12px', color: t.cardSub, margin: '4px 0 0' }}>PNG or PDF · 300 DPI minimum · Max 100MB</p>
                    </div>
                  )}
                </label>

                {/* Confirm */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '13px', color: t.cardText }}>I confirm this file is print-ready at 300 DPI or higher</span>
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(4)} style={{ background: t.main, color: t.cardText, border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
                  <button disabled={!formReady} style={{ flex: 1, background: formReady ? '#16A34A' : 'rgba(0,0,0,0.08)', color: formReady ? 'white' : t.cardSub, border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: formReady ? 'pointer' : 'not-allowed' }}>
                    {formReady ? '✓ Submit for review' : 'Upload file and confirm to submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejected alert */}
        {artworkFiles.some(f => f.status === 'rejected') && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#DC2626' }}></div>
              <span style={{ fontSize: '13px', color: '#991B1B', fontWeight: '500' }}>1 file was rejected — please review and re-upload</span>
            </div>
            <span onClick={() => setFilter('rejected')} style={{ fontSize: '12px', color: '#DC2626', cursor: 'pointer', fontWeight: '500' }}>View →</span>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${artworkFiles.length})` },
            { key: 'approved', label: `Approved (${artworkFiles.filter(f => f.status === 'approved').length})` },
            { key: 'pending', label: `Pending (${artworkFiles.filter(f => f.status === 'pending').length})` },
            { key: 'rejected', label: `Rejected (${artworkFiles.filter(f => f.status === 'rejected').length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '10px', border: 'none', cursor: 'pointer', background: filter === tab.key ? t.accent : t.card, color: filter === tab.key ? t.accentText : t.cardSub, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* File grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filtered.map(file => {
            const s = statusStyle[file.status]
            return (
              <div key={file.id} style={{ background: t.card, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ height: '110px', background: t.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '44px' }}>{file.name.endsWith('.pdf') ? '📄' : file.category === 'laser' ? '⚡' : '🖼️'}</span>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', color: s.color, background: s.bg }}>{s.label}</span>
                    <span style={{ fontSize: '11px', color: t.cardSub }}>{file.uploaded}</span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: t.cardText, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                  <p style={{ fontSize: '11px', color: t.cardSub, fontFamily: 'monospace', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.sku}</p>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: t.main, color: t.cardSub }}>{file.method}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: t.main, color: t.cardSub }}>{file.category}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: file.dpi < 300 ? '#FEF2F2' : t.main, color: file.dpi < 300 ? '#DC2626' : t.cardSub, fontWeight: file.dpi < 300 ? '700' : '400' }}>{file.dpi} DPI</span>
                  </div>
                  {file.status === 'rejected' && (
                    <div style={{ background: '#FEF2F2', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#991B1B', margin: '0 0 3px' }}>Rejection reason</p>
                      <p style={{ fontSize: '12px', color: '#B91C1C', margin: 0 }}>{file.reason}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {file.status === 'rejected' && (
                      <button style={{ flex: 1, background: t.accent, color: t.accentText, border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Re-upload</button>
                    )}
                    <button style={{ flex: 1, background: t.main, color: t.cardText, border: 'none', borderRadius: '10px', padding: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>View file</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}