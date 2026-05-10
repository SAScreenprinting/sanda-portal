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

const statusStyles = {
  'Shipped':          { color: '#16A34A', bg: '#F0FDF4' },
  'In Production':    { color: '#2563EB', bg: '#EFF6FF' },
  'Awaiting Artwork': { color: '#D97706', bg: '#FFFBEB' },
  'QC Passed':        { color: '#16A34A', bg: '#F0FDF4' },
  'Delivered':        { color: '#6B7280', bg: '#F9FAFB' },
  'On Hold':          { color: '#DC2626', bg: '#FEF2F2' },
  'Received':         { color: '#6B7280', bg: '#F9FAFB' },
}

const allOrders = [
  { id: '#1042', customer: 'John Smith',   product: 'TEE-BLK-LG-DTG-FC',  date: 'May 9, 2026',  status: 'Shipped',          cost: '$14.99' },
  { id: '#1041', customer: 'Sarah Jones',  product: 'HOD-NVY-MD-DTG-FC',  date: 'May 9, 2026',  status: 'In Production',    cost: '$29.99' },
  { id: '#1040', customer: 'Mike Brown',   product: 'TEE-WHT-SM-DTF-FC',  date: 'May 8, 2026',  status: 'Awaiting Artwork', cost: '$14.99' },
  { id: '#1039', customer: 'Lisa Davis',   product: 'CRW-HGR-XL-DTG-FC', date: 'May 8, 2026',  status: 'QC Passed',        cost: '$26.99' },
  { id: '#1038', customer: 'Tom Wilson',   product: 'TEE-BLK-MD-DTG-BC', date: 'May 7, 2026',  status: 'Awaiting Artwork', cost: '$14.99' },
  { id: '#1037', customer: 'Amy Chen',     product: 'HAT-BLK-OS-EMB-FC', date: 'May 7, 2026',  status: 'Shipped',          cost: '$24.99' },
  { id: '#1036', customer: 'James Lee',    product: 'TOT-NAT-OS-DTG-FC', date: 'May 6, 2026',  status: 'Delivered',        cost: '$13.99' },
  { id: '#1035', customer: 'Maria Garcia', product: 'LSL-BLK-LG-DTG-FC', date: 'May 6, 2026',  status: 'Shipped',          cost: '$17.99' },
  { id: '#1034', customer: 'David Kim',    product: 'TEE-NVY-XL-DTG-FC', date: 'May 5, 2026',  status: 'Delivered',        cost: '$14.99' },
  { id: '#1033', customer: 'Emma White',   product: 'HOD-BLK-SM-DTG-FC', date: 'May 5, 2026',  status: 'Delivered',        cost: '$29.99' },
]

export default function Orders() {
  const [activeTheme, setActiveTheme] = useState('classic')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme')
    if (saved && themes[saved]) setActiveTheme(saved)
  }, [])

  const t = themes[activeTheme]

  const filtered = allOrders.filter(o => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
    const matchStatus = statusFilter === '' || o.status === statusFilter
    return matchSearch && matchStatus
  })

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

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: t.cardText, margin: 0 }}>Orders</h1>
          <p style={{ fontSize: '13px', color: t.cardSub, margin: '6px 0 0' }}>142 total orders across your account</p>
        </div>

        {/* Awaiting artwork alert */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '16px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B' }}></div>
            <span style={{ fontSize: '13px', color: '#92400E', fontWeight: '500' }}>2 orders are waiting for your artwork upload</span>
          </div>
          <span style={{ fontSize: '12px', color: '#D97706', cursor: 'pointer', fontWeight: '500' }}>View →</span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by customer or order #"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', background: t.card, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: t.cardText, outline: 'none' }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ background: t.card, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: t.cardText, outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All statuses</option>
            <option value="Awaiting Artwork">Awaiting Artwork</option>
            <option value="In Production">In Production</option>
            <option value="QC Passed">QC Passed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        {/* Orders table */}
        <div style={{ background: t.card, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 120px 160px 80px', padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            {['Order', 'Customer', 'Product', 'Date', 'Status', 'Cost'].map((h, i) => (
              <span key={h} style={{ fontSize: '11px', fontWeight: '600', color: t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i === 5 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: t.cardSub, fontSize: '14px' }}>No orders found</div>
          ) : (
            filtered.map((order, i) => {
              const s = statusStyles[order.status] || { color: '#6B7280', bg: '#F9FAFB' }
              return (
                <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 120px 160px 80px', padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', cursor: 'pointer', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', color: t.cardSub }}>{order.id}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: t.cardText }}>{order.customer}</span>
                  <span style={{ fontSize: '11px', color: t.cardSub, fontFamily: 'monospace' }}>{order.product}</span>
                  <span style={{ fontSize: '12px', color: t.cardSub }}>{order.date}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', color: s.color, background: s.bg, width: 'fit-content' }}>{order.status}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: t.cardText, textAlign: 'right' }}>{order.cost}</span>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <p style={{ fontSize: '12px', color: t.cardSub }}>Showing {filtered.length} of 142 orders</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Previous', '1', '2', '3', 'Next'].map((p) => (
              <button key={p} style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', background: p === '1' ? t.accent : t.card, color: p === '1' ? t.accentText : t.cardText, cursor: 'pointer', fontWeight: p === '1' ? '600' : '400' }}>{p}</button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}