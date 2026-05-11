'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const themes = {
  classic:  { sidebar:'#EFEDE8', sidebarText:'#666', sidebarActive:'#1a1a1a', sidebarActiveTxt:'white', main:'#F5F5F0', card:'white',    cardText:'#1a1a1a', cardSub:'#aaa', accent:'#1a1a1a', accentText:'white', logoFilter:'none' },
  midnight: { sidebar:'#0f0f0f', sidebarText:'#666', sidebarActive:'white',   sidebarActiveTxt:'#0f0f0f', main:'#1a1a1a', card:'#242424', cardText:'white',   cardSub:'#555', accent:'white',   accentText:'#1a1a1a', logoFilter:'invert(1)' },
  ocean:    { sidebar:'#0a1628', sidebarText:'#4a7fa5', sidebarActive:'#2196f3', sidebarActiveTxt:'white', main:'#0d1f35', card:'#0f2744', cardText:'white',   cardSub:'#4a7fa5', accent:'#2196f3', accentText:'white', logoFilter:'invert(1)' },
  forest:   { sidebar:'#0f1f0f', sidebarText:'#4a7a4a', sidebarActive:'#4caf50', sidebarActiveTxt:'white', main:'#141f14', card:'#1a2e1a', cardText:'white',   cardSub:'#4a7a4a', accent:'#4caf50', accentText:'white', logoFilter:'invert(1)' },
  sunset:   { sidebar:'#1a0f0a', sidebarText:'#a06040', sidebarActive:'#ff6b35', sidebarActiveTxt:'white', main:'#1f1510', card:'#2a1f15', cardText:'white',   cardSub:'#a06040', accent:'#ff6b35', accentText:'white', logoFilter:'invert(1)' },
  lavender: { sidebar:'#f0eef8', sidebarText:'#8878c3', sidebarActive:'#7c6bc4', sidebarActiveTxt:'white', main:'#f5f3ff', card:'white',    cardText:'#2d2460', cardSub:'#9b8fd4', accent:'#7c6bc4', accentText:'white', logoFilter:'none' },
}

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
]

const TRACK_STEPS = [
  { key:'art_approved',   label:'Art Approved',   icon:'🎨' },
  { key:'in_production',  label:'In Production',  icon:'⚙️' },
  { key:'quality_check',  label:'Quality Check',  icon:'✅' },
  { key:'shipped',        label:'Shipped',         icon:'📦' },
]

const MOCK_ORDER = {
  id: '#1051',
  product: 'TEE-WHT-SM-SCR-FC',
  qty: 24,
  description: '24x T-Shirts, Front Print',
  date: 'May 10, 2026',
  status: 'In Production',
  cost: '$252.00',
  shipping: '$18.00',
  total: '$270.00',
  address: '123 Riverside Dr, Newark, NJ 07101',
  tracking: null,
  carrier: null,
  notes: 'Rush order — needed by May 17.',
  // Tracking dates
  est_art_approved_at: 'May 11',
  est_in_production_at: 'May 12',
  est_quality_check_at: 'May 15',
  est_shipped_at: 'May 16',
  art_approved_at: 'May 11',
  in_production_at: 'May 12',
  quality_check_at: null,
  shipped_at: null,
  // Proof
  proof: {
    id: 1,
    version: 1,
    status: 'Pending',
    file_url: null,
    thumbnail_url: null,
  }
}

const skuDecoder = (sku) => {
  if (!sku) return {}
  const parts = sku.split('-')
  const product = { TEE:'T-Shirt', HOD:'Hoodie', CRW:'Crewneck', TNK:'Tank Top', LSL:'Long Sleeve', HAT:'Hat/Cap', TOT:'Tote Bag', YTH:'Youth Tee' }
  const color   = { BLK:'Black', WHT:'White', NVY:'Navy', GRY:'Gray', HGR:'Heather Gray', RED:'Red', NAT:'Natural' }
  const size    = { XS:'XS', SM:'Small', MD:'Medium', LG:'Large', XL:'XL', '2X':'2XL', '3X':'3XL', '4X':'4XL' }
  const method  = { DTG:'Direct to Garment', DTF:'Direct to Film', SCR:'Screen Print', EMB:'Embroidery', SUB:'Sublimation', HTV:'Heat Transfer' }
  const location= { FC:'Front Chest', BC:'Back Center', LC:'Left Chest', SL:'Sleeve', NK:'Neck Label', FCBC:'Front + Back' }
  return {
    product:  product[parts[0]]  || parts[0],
    color:    color[parts[1]]    || parts[1],
    size:     size[parts[2]]     || parts[2],
    method:   method[parts[3]]   || parts[3],
    location: location[parts[4]] || parts[4],
  }
}

function getStepIndex(status) {
  if (status === 'Shipped' || status === 'Delivered') return 4
  if (status === 'Quality Check') return 3
  if (status === 'In Production') return 2
  if (status === 'Art Approved')  return 1
  return 0
}

export default function OrderDetail() {
  const router = useRouter()
  const [themeName, setThemeName] = useState('classic')
  const [order, setOrder] = useState(MOCK_ORDER)
  const [proofNote, setProofNote] = useState('')
  const [proofAction, setProofAction] = useState(null) // 'approved' | 'rejected'
  const [reorderMsg, setReorderMsg] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme')
    if (saved && themes[saved]) setThemeName(saved)
  }, [])

  const t = themes[themeName]
  const decoded = skuDecoder(order.product)
  const stepIdx = getStepIndex(order.status)

  function handleProof(action) {
    setProofAction(action)
    setOrder(o => ({ ...o, proof: { ...o.proof, status: action === 'approved' ? 'Approved' : 'Rejected' } }))
  }

  function handleReorder() {
    setReorderMsg('✓ Reorder request sent! S&A will reach out to confirm details.')
    setTimeout(() => setReorderMsg(''), 4000)
  }

  const completedSteps = [
    order.art_approved_at,
    order.in_production_at,
    order.quality_check_at,
    order.shipped_at,
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:t.sidebar, display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px', filter:t.logoFilter }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:t.accent, display:'flex', alignItems:'center', justifyContent:'center', color:t.accentText, fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>R</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText }}>Riverside Youth</div>
            <div style={{ fontSize:'12px', color:t.cardSub }}>Sports</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const active = item.id === 'orders'
              return (
                <a key={item.id} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', textDecoration:'none', background:active?t.sidebarActive:'transparent', color:active?t.sidebarActiveTxt:t.sidebarText, fontSize:'13px', fontWeight:active?'600':'400' }}>
                  <span style={{ fontSize:'16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
        <a href="/" style={{ display:'block', padding:'8px 12px', color:t.sidebarText, fontSize:'12px', textDecoration:'none', textAlign:'center' }}>Sign Out</a>
      </div>

      {/* Main */}
      <div style={{ marginLeft:'220px', flex:1, padding:'36px 40px', maxWidth:'1100px' }}>

        {/* Header */}
        <div style={{ marginBottom:'28px' }}>
          <a href="/orders" style={{ fontSize:'13px', color:t.cardSub, textDecoration:'none', display:'inline-block', marginBottom:'10px' }}>← Back to orders</a>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:'28px', fontWeight:'800', color:t.cardText, margin:'0 0 4px' }}>Order {order.id}</h1>
              <p style={{ fontSize:'13px', color:t.cardSub, margin:0 }}>Placed {order.date} · {order.description}</p>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
              {/* Reorder button */}
              <button onClick={handleReorder}
                style={{ padding:'9px 18px', background:'transparent', border:`1px solid ${t.accent}`, color:t.accent, borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                🔄 Reorder
              </button>
              <span style={{ fontSize:'13px', fontWeight:'600', padding:'8px 16px', borderRadius:'20px', background:`${t.accent}15`, color:t.accent }}>
                {order.status}
              </span>
            </div>
          </div>
          {reorderMsg && (
            <div style={{ marginTop:'12px', padding:'10px 16px', background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:'10px', fontSize:'13px', color:'#065f46' }}>
              {reorderMsg}
            </div>
          )}
        </div>

        {/* ── TRACKING PROGRESS BAR ── */}
        <div style={{ background:t.card, borderRadius:'16px', padding:'28px', marginBottom:'20px', border:`1px solid ${t.cardSub}20` }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', color:t.cardText, margin:'0 0 24px' }}>Order Progress</h2>
          <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
            {/* connecting line */}
            <div style={{ position:'absolute', top:'18px', left:'18px', right:'18px', height:'3px', background:`${t.cardSub}25`, zIndex:0 }}/>
            <div style={{ position:'absolute', top:'18px', left:'18px', height:'3px', background:t.accent, zIndex:1, width:`${Math.min(100, (stepIdx / 4) * 100)}%`, transition:'width 0.6s ease' }}/>
            {TRACK_STEPS.map((step, i) => {
              const done    = i < stepIdx
              const current = i === stepIdx - 1
              const estDate = [order.est_art_approved_at, order.est_in_production_at, order.est_quality_check_at, order.est_shipped_at][i]
              const actDate = completedSteps[i]
              return (
                <div key={step.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: done||current ? t.accent : `${t.cardSub}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', marginBottom:'10px', border:`3px solid ${done||current ? t.accent : t.card}`, boxShadow: current ? `0 0 0 4px ${t.accent}30` : 'none', transition:'all 0.3s' }}>
                    {done || current ? '✓' : step.icon}
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'12px', fontWeight:'600', color:done||current ? t.cardText : t.cardSub, marginBottom:'3px' }}>{step.label}</div>
                    {actDate ? (
                      <div style={{ fontSize:'11px', color:t.accent, fontWeight:'500' }}>✓ {actDate}</div>
                    ) : (
                      <div style={{ fontSize:'11px', color:t.cardSub }}>Est. {estDate}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {order.tracking && (
            <div style={{ marginTop:'20px', padding:'12px 16px', background:'#d1fae5', borderRadius:'10px', display:'flex', gap:'12px', alignItems:'center' }}>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#065f46' }}>Tracking:</span>
              <span style={{ fontSize:'13px', fontFamily:'monospace', color:'#065f46' }}>{order.tracking}</span>
              {order.carrier && <span style={{ fontSize:'12px', color:'#6ee7b7' }}>({order.carrier})</span>}
            </div>
          )}
        </div>

        {/* ── PROOF APPROVAL ── */}
        {order.proof && (
          <div style={{ background:t.card, borderRadius:'16px', padding:'24px', marginBottom:'20px', border:`2px solid ${order.proof.status === 'Pending' ? '#f59e0b' : order.proof.status === 'Approved' ? '#10b981' : '#ef4444'}40` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div>
                <h2 style={{ fontSize:'15px', fontWeight:'700', color:t.cardText, margin:'0 0 3px' }}>Proof Review — Version {order.proof.version}</h2>
                <p style={{ fontSize:'13px', color:t.cardSub, margin:0 }}>Review and approve your print proof before we go to production.</p>
              </div>
              <span style={{ fontSize:'12px', fontWeight:'700', padding:'4px 12px', borderRadius:'20px',
                background: order.proof.status === 'Approved' ? '#d1fae5' : order.proof.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                color:      order.proof.status === 'Approved' ? '#065f46' : order.proof.status === 'Rejected' ? '#991b1b' : '#92400e'
              }}>{order.proof.status}</span>
            </div>

            {/* Proof image placeholder */}
            <div style={{ background:`${t.cardSub}10`, borderRadius:'12px', padding:'40px', textAlign:'center', marginBottom:'16px', border:`1px dashed ${t.cardSub}40` }}>
              {order.proof.thumbnail_url ? (
                <img src={order.proof.thumbnail_url} alt="Proof" style={{ maxWidth:'100%', maxHeight:'300px', objectFit:'contain', borderRadius:'8px' }}/>
              ) : (
                <div>
                  <div style={{ fontSize:'40px', marginBottom:'10px' }}>🖨️</div>
                  <p style={{ fontSize:'14px', fontWeight:'600', color:t.cardText, margin:'0 0 4px' }}>Proof will appear here</p>
                  <p style={{ fontSize:'13px', color:t.cardSub, margin:0 }}>S&A will upload your print proof for review before production begins.</p>
                </div>
              )}
            </div>

            {order.proof.status === 'Pending' && (
              <>
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Note (optional)</label>
                  <textarea value={proofNote} onChange={e => setProofNote(e.target.value)}
                    placeholder="Any changes or comments before we print?"
                    rows={2}
                    style={{ width:'100%', background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:t.cardText, outline:'none', resize:'vertical', fontFamily:'Inter, sans-serif' }}/>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={() => handleProof('approved')}
                    style={{ flex:1, padding:'12px', background:'#10b981', color:'white', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                    ✓ Approve Proof — Start Production
                  </button>
                  <button onClick={() => handleProof('rejected')}
                    style={{ padding:'12px 20px', background:'#fee2e2', color:'#991b1b', border:'1px solid #fca5a5', borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                    ✗ Request Changes
                  </button>
                </div>
              </>
            )}
            {proofAction === 'approved' && (
              <div style={{ padding:'12px 16px', background:'#d1fae5', borderRadius:'10px', fontSize:'13px', color:'#065f46', fontWeight:'500' }}>
                ✓ Proof approved! We'll begin production shortly.
              </div>
            )}
            {proofAction === 'rejected' && (
              <div style={{ padding:'12px 16px', background:'#fee2e2', borderRadius:'10px', fontSize:'13px', color:'#991b1b', fontWeight:'500' }}>
                Changes requested. S&A will send a revised proof soon.
              </div>
            )}
          </div>
        )}

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Product details */}
            <div style={{ background:t.card, borderRadius:'16px', padding:'24px', border:`1px solid ${t.cardSub}20` }}>
              <h2 style={{ fontSize:'15px', fontWeight:'700', color:t.cardText, margin:'0 0 16px' }}>Product Details</h2>
              <div style={{ background:`${t.cardSub}08`, borderRadius:'10px', padding:'14px', marginBottom:'14px' }}>
                <p style={{ fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 6px' }}>SKU</p>
                <p style={{ fontSize:'15px', fontWeight:'700', color:t.accent, fontFamily:'monospace', margin:'0 0 14px' }}>{order.product}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  {[
                    { label:'Product',  value:decoded.product },
                    { label:'Color',    value:decoded.color },
                    { label:'Size',     value:decoded.size },
                    { label:'Method',   value:decoded.method },
                    { label:'Location', value:decoded.location },
                    { label:'Quantity', value:order.qty },
                  ].map(item => (
                    <div key={item.label} style={{ background:t.card, borderRadius:'8px', padding:'10px 12px' }}>
                      <p style={{ fontSize:'10px', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 2px' }}>{item.label}</p>
                      <p style={{ fontSize:'13px', fontWeight:'600', color:t.cardText, margin:0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {order.notes && (
                <div style={{ background:'#fffbeb', borderRadius:'10px', padding:'12px 14px', border:'1px solid #fde68a' }}>
                  <p style={{ fontSize:'11px', fontWeight:'600', color:'#92400e', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 3px' }}>Order Note</p>
                  <p style={{ fontSize:'13px', color:'#b45309', margin:0 }}>{order.notes}</p>
                </div>
              )}
            </div>

            {/* Shipping */}
            <div style={{ background:t.card, borderRadius:'16px', padding:'24px', border:`1px solid ${t.cardSub}20` }}>
              <h2 style={{ fontSize:'15px', fontWeight:'700', color:t.cardText, margin:'0 0 12px' }}>Ship To</h2>
              <p style={{ fontSize:'13px', color:t.cardSub, margin:0 }}>{order.address}</p>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div style={{ background:t.card, borderRadius:'16px', padding:'24px', border:`1px solid ${t.cardSub}20` }}>
              <h2 style={{ fontSize:'15px', fontWeight:'700', color:t.cardText, margin:'0 0 16px' }}>Order Summary</h2>
              {[
                { label:'Product cost', value:order.cost },
                { label:'Shipping',     value:order.shipping },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                  <span style={{ fontSize:'13px', color:t.cardSub }}>{row.label}</span>
                  <span style={{ fontSize:'13px', color:t.cardText, fontWeight:'500' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height:'1px', background:`${t.cardSub}20`, margin:'12px 0' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                <span style={{ fontSize:'14px', fontWeight:'700', color:t.cardText }}>Total</span>
                <span style={{ fontSize:'14px', fontWeight:'700', color:t.cardText }}>{order.total}</span>
              </div>
              <button onClick={handleReorder}
                style={{ width:'100%', padding:'11px', background:`${t.accent}15`, color:t.accent, border:`1px solid ${t.accent}40`, borderRadius:'10px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                🔄 Reorder This
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
