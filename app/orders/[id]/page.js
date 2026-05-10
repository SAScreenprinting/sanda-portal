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

const skuDecoder = (sku) => {
  if (!sku) return {}
  const parts = sku.split('-')
  const product = { TEE: 'T-Shirt', HOD: 'Hoodie', CRW: 'Crewneck', TNK: 'Tank Top', LSL: 'Long Sleeve', HAT: 'Hat/Cap', TOT: 'Tote Bag', YTH: 'Youth Tee' }
  const color = { BLK: 'Black', WHT: 'White', NVY: 'Navy', GRY: 'Gray', HGR: 'Heather Gray', RED: 'Red', NAT: 'Natural', OS: 'One Size' }
  const size = { XS: 'XS', SM: 'Small', MD: 'Medium', LG: 'Large', XL: 'XL', '2X': '2XL', '3X': '3XL', '4X': '4XL', OS: 'One Size' }
  const method = { DTG: 'Direct to Garment', DTF: 'Direct to Film', SCR: 'Screen Print', EMB: 'Embroidery', SUB: 'Sublimation', HTV: 'Heat Transfer' }
  const location = { FC: 'Front Chest', BC: 'Back Center', LC: 'Left Chest', SL: 'Sleeve', NK: 'Neck Label', FCBC: 'Front + Back' }
  return {
    product: product[parts[0]] || parts[0],
    color: color[parts[1]] || parts[1],
    size: size[parts[2]] || parts[2],
    method: method[parts[3]] || parts[3],
    location: location[parts[4]] || parts[4],
  }
}

const statusStyles = {
  'Shipped':          { color: '#16A34A', bg: '#F0FDF4' },
  'In Production':    { color: '#2563EB', bg: '#EFF6FF' },
  'Awaiting Artwork': { color: '#D97706', bg: '#FFFBEB' },
  'QC Passed':        { color: '#16A34A', bg: '#F0FDF4' },
  'Delivered':        { color: '#6B7280', bg: '#F9FAFB' },
  'On Hold':          { color: '#DC2626', bg: '#FEF2F2' },
  'Received':         { color: '#6B7280', bg: '#F9FAFB' },
}

const order = {
  id: '#1040',
  customer: 'Mike Brown',
  email: 'mike.brown@example.com',
  product: 'TEE-WHT-SM-DTF-FC',
  qty: 1,
  date: 'May 8, 2026',
  status: 'Awaiting Artwork',
  cost: '$14.99',
  shipping: '$4.50',
  total: '$19.49',
  address: '123 Main Street, Apt 4B, New York, NY 10001',
  tracking: null,
  carrier: null,
  notes: 'Customer requested white ink on white tee — confirm design before printing.',
}

export default function OrderDetail() {
  const [activeTheme, setActiveTheme] = useState('classic')
  const [showUpload, setShowUpload] = useState(false)
  const [fileName, setFileName] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme')
    if (saved && themes[saved]) setActiveTheme(saved)
  }, [])

  const t = themes[activeTheme]
  const decoded = skuDecoder(order.product)
  const s = statusStyles[order.status] || { color: '#6B7280', bg: '#F9FAFB' }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) setFileName(file.name)
  }

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
              { label: 'Orders', active: true, badge: '2' },
              { label: 'Artwork', active: false, badge: null },
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

      {/* Main area */}
      <div style={{ marginLeft: '220px', flex: 1, padding: '36px 40px' }}>

        {/* Back + header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', color: t.cardSub, cursor: 'pointer', marginBottom: '8px' }}>← Back to orders</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: t.cardText, margin: 0 }}>Order {order.id}</h1>
              <p style={{ fontSize: '13px', color: t.cardSub, margin: '4px 0 0' }}>Placed on {order.date}</p>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '20px', color: s.color, background: s.bg }}>{order.status}</span>
          </div>
        </div>

        {/* Awaiting artwork alert */}
        {order.status === 'Awaiting Artwork' && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400E', margin: 0 }}>This order is waiting for your artwork file</p>
            </div>
            <p style={{ fontSize: '13px', color: '#B45309', margin: '0 0 14px' }}>Upload your customer's print-ready artwork below. We cannot begin production until the file is received and approved. Upload within 4 hours to meet your turnaround SLA.</p>
            <button
              onClick={() => setShowUpload(!showUpload)}
              style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Upload artwork file
            </button>

            {showUpload && (
              <div style={{ marginTop: '16px', background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #FDE68A' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#92400E', margin: '0 0 4px' }}>File requirements</p>
                <p style={{ fontSize: '12px', color: '#B45309', margin: '0 0 16px' }}>PNG or PDF only · 300 DPI minimum · Max 100MB · Transparent background recommended</p>
                <label style={{ display: 'block', border: '2px dashed #FDE68A', borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
                  <input type="file" accept=".png,.pdf" onChange={handleFile} style={{ display: 'none' }} />
                  {fileName ? (
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#16A34A', margin: 0 }}>✓ {fileName}</p>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: '4px 0 0' }}>File selected — click Submit to upload</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#92400E', margin: 0 }}>Click to select your file</p>
                      <p style={{ fontSize: '12px', color: '#B45309', margin: '4px 0 0' }}>PNG or PDF only</p>
                    </div>
                  )}
                </label>
                {fileName && (
                  <button style={{ marginTop: '12px', width: '100%', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    Submit artwork for review
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Product details */}
            <div style={{ background: t.card, borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: t.cardText, margin: '0 0 20px' }}>Product details</h2>

              {/* SKU */}
              <div style={{ background: t.main, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>SKU code</p>
                <p style={{ fontSize: '16px', fontWeight: '700', color: t.cardText, fontFamily: 'monospace', margin: '0 0 16px' }}>{order.product}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Product', value: decoded.product },
                    { label: 'Color', value: decoded.color },
                    { label: 'Size', value: decoded.size },
                    { label: 'Print method', value: decoded.method },
                    { label: 'Print location', value: decoded.location },
                    { label: 'Quantity', value: order.qty },
                  ].map((item) => (
                    <div key={item.label} style={{ background: t.card, borderRadius: '10px', padding: '10px 12px' }}>
                      <p style={{ fontSize: '10px', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>{item.label}</p>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: t.cardText, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div style={{ background: '#FFFBEB', borderRadius: '12px', padding: '14px 16px', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Order note</p>
                  <p style={{ fontSize: '13px', color: '#B45309', margin: 0 }}>{order.notes}</p>
                </div>
              )}
            </div>

            {/* Shipping address */}
            <div style={{ background: t.card, borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: t.cardText, margin: '0 0 16px' }}>Ship to</h2>
              <p style={{ fontSize: '14px', fontWeight: '600', color: t.cardText, margin: '0 0 4px' }}>{order.customer}</p>
              <p style={{ fontSize: '13px', color: t.cardSub, margin: 0 }}>{order.address}</p>
              {order.tracking && (
                <div style={{ marginTop: '14px', padding: '12px 14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#16A34A', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking number</p>
                  <p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#15803D', margin: 0 }}>{order.tracking}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Order summary */}
            <div style={{ background: t.card, borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: t.cardText, margin: '0 0 16px' }}>Order summary</h2>
              {[
                { label: 'Product cost', value: order.cost },
                { label: 'Shipping', value: order.shipping },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: t.cardSub }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: t.cardText, fontWeight: '500' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '12px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: t.cardText }}>Total</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: t.cardText }}>{order.total}</span>
              </div>
            </div>

            {/* Fulfillment timeline */}
            <div style={{ background: t.card, borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: t.cardText, margin: '0 0 20px' }}>Fulfillment stages</h2>
              {[
                { label: 'Order received', done: true },
                { label: 'Awaiting artwork', done: true, active: true },
                { label: 'File review', done: false },
                { label: 'In production', done: false },
                { label: 'QC passed', done: false },
                { label: 'Shipped', done: false },
                { label: 'Delivered', done: false },
              ].map((stage, i) => (
                <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 6 ? '12px' : 0 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: stage.active ? '#F59E0B' : stage.done ? t.accent : 'rgba(0,0,0,0.1)', border: stage.active ? '2px solid #FDE68A' : 'none' }}></div>
                  <span style={{ fontSize: '13px', color: stage.active ? '#D97706' : stage.done ? t.cardText : t.cardSub, fontWeight: stage.active ? '700' : stage.done ? '500' : '400' }}>{stage.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}