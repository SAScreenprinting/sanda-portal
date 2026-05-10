'use client'
import { useState, useEffect } from 'react'

const themes = {
  classic: {
    name: 'Classic',
    sidebar: '#EFEDE8',
    sidebarText: '#666',
    sidebarActive: '#1a1a1a',
    sidebarActiveTxt: 'white',
    main: '#F5F5F0',
    card: 'white',
    cardText: '#1a1a1a',
    cardSub: '#aaa',
    accent: '#1a1a1a',
    accentText: 'white',
    logoFilter: 'none',
  },
  midnight: {
    name: 'Midnight',
    sidebar: '#0f0f0f',
    sidebarText: '#666',
    sidebarActive: 'white',
    sidebarActiveTxt: '#0f0f0f',
    main: '#1a1a1a',
    card: '#242424',
    cardText: 'white',
    cardSub: '#555',
    accent: 'white',
    accentText: '#1a1a1a',
    logoFilter: 'invert(1)',
  },
  ocean: {
    name: 'Ocean',
    sidebar: '#EFF6FF',
    sidebarText: '#64748B',
    sidebarActive: '#1E40AF',
    sidebarActiveTxt: 'white',
    main: '#F0F7FF',
    card: 'white',
    cardText: '#1E293B',
    cardSub: '#94A3B8',
    accent: '#1E40AF',
    accentText: 'white',
    logoFilter: 'none',
  },
  forest: {
    name: 'Forest',
    sidebar: '#ECFDF5',
    sidebarText: '#6B7280',
    sidebarActive: '#065F46',
    sidebarActiveTxt: 'white',
    main: '#F0FDF4',
    card: 'white',
    cardText: '#1a1a1a',
    cardSub: '#aaa',
    accent: '#065F46',
    accentText: 'white',
    logoFilter: 'none',
  },
  rose: {
    name: 'Rose',
    sidebar: '#FFF1F2',
    sidebarText: '#9F6B6B',
    sidebarActive: '#9F1239',
    sidebarActiveTxt: 'white',
    main: '#FFF5F5',
    card: 'white',
    cardText: '#1a1a1a',
    cardSub: '#aaa',
    accent: '#9F1239',
    accentText: 'white',
    logoFilter: 'none',
  },
  slate: {
    name: 'Slate',
    sidebar: '#F1F5F9',
    sidebarText: '#64748B',
    sidebarActive: '#334155',
    sidebarActiveTxt: 'white',
    main: '#F8FAFC',
    card: 'white',
    cardText: '#1a1a1a',
    cardSub: '#aaa',
    accent: '#334155',
    accentText: 'white',
    logoFilter: 'none',
  },
}

export default function Dashboard() {
  const [activeTheme, setActiveTheme] = useState('classic')
  const [showThemePicker, setShowThemePicker] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme')
    if (saved && themes[saved]) setActiveTheme(saved)
  }, [])

  const setTheme = (key) => {
    setActiveTheme(key)
    localStorage.setItem('portal-theme', key)
    setShowThemePicker(false)
  }

  const t = themes[activeTheme]

  const orders = [
    { id: '#1042', customer: 'John Smith', product: 'TEE-BLK-LG-DTG-FC', status: 'Shipped', color: '#16A34A', bg: '#F0FDF4' },
    { id: '#1041', customer: 'Sarah Jones', product: 'HOD-NVY-MD-DTG-FC', status: 'In Production', color: '#2563EB', bg: '#EFF6FF' },
    { id: '#1040', customer: 'Mike Brown', product: 'TEE-WHT-SM-DTF-FC', status: 'Awaiting Artwork', color: '#D97706', bg: '#FFFBEB' },
    { id: '#1039', customer: 'Lisa Davis', product: 'CRW-HGR-XL-DTG-FC', status: 'QC Passed', color: '#16A34A', bg: '#F0FDF4' },
    { id: '#1038', customer: 'Tom Wilson', product: 'TEE-BLK-MD-DTG-BC', status: 'Awaiting Artwork', color: '#D97706', bg: '#FFFBEB' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.main, fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        width: '220px', background: t.sidebar, display: 'flex', flexDirection: 'column',
        padding: '28px 20px', position: 'fixed', height: '100vh', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ marginBottom: '32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width: '110px', filter: t.logoFilter }} />
          </div>

          <div style={{ marginBottom: '36px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: t.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.accentText, fontSize: '14px', fontWeight: '600', marginBottom: '12px'
            }}>BA</div>
            <p style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: 0 }}>Brand A</p>
            <p style={{ fontSize: '12px', color: t.sidebarText, margin: '2px 0 0' }}>Growth tier</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Dashboard', active: true, badge: null },
              { label: 'Orders', active: false, badge: '2' },
              { label: 'Artwork', active: false, badge: null },
              { label: 'Inventory', active: false, badge: null },
              { label: 'Design Studio', active: false, badge: null },
              { label: 'Billing', active: false, badge: null },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                background: item.active ? t.sidebarActive : 'transparent',
                color: item.active ? t.sidebarActiveTxt : t.sidebarText,
                fontSize: '14px', fontWeight: item.active ? '600' : '400',
              }}>
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: '#F59E0B', color: 'white', fontSize: '11px',
                    fontWeight: '600', padding: '2px 7px', borderRadius: '20px'
                  }}>{item.badge}</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div>
          <div
            onClick={() => setShowThemePicker(!showThemePicker)}
            style={{
              padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
              fontSize: '13px', color: t.sidebarText, marginBottom: '4px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>🎨</span> Theme
          </div>
          <div style={{ fontSize: '14px', color: t.sidebarText, cursor: 'pointer', padding: '10px 12px' }}>
            🚪 Log out
          </div>
        </div>
      </div>

      {/* Theme picker */}
      {showThemePicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowThemePicker(false)}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 6px' }}>Choose your theme</h2>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 24px' }}>Your preference is saved automatically</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {Object.entries(themes).map(([key, theme]) => (
                <div
                  key={key}
                  onClick={() => setTheme(key)}
                  style={{
                    borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                    border: activeTheme === key ? '3px solid #1a1a1a' : '3px solid transparent',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', height: '60px' }}>
                    <div style={{ width: '40%', background: theme.sidebar }}></div>
                    <div style={{ flex: 1, background: theme.main, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px', gap: '4px' }}>
                      <div style={{ height: '8px', background: theme.card, borderRadius: '4px' }}></div>
                      <div style={{ height: '8px', background: theme.accent, borderRadius: '4px', width: '60%' }}></div>
                    </div>
                  </div>
                  <div style={{ background: 'white', padding: '8px 10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>{theme.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main area */}
      <div style={{ marginLeft: '220px', flex: 1, padding: '36px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: t.cardText, margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: '13px', color: t.cardSub, margin: '6px 0 0' }}>Good morning, Brand A</p>
          </div>
          <div style={{
            background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '16px',
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B' }}></div>
            <span style={{ fontSize: '13px', color: '#92400E', fontWeight: '500' }}>2 orders awaiting artwork</span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total orders', value: '142', sub: 'all time', dark: false },
            { label: 'This month', value: '24', sub: 'May 2026', dark: false },
            { label: 'In production', value: '6', sub: 'right now', dark: true },
            { label: 'Shipped this week', value: '11', sub: 'last 7 days', dark: false },
          ].map((card) => (
            <div key={card.label} style={{
              background: card.dark ? t.accent : t.card,
              borderRadius: '20px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <p style={{ fontSize: '11px', color: card.dark ? 'rgba(255,255,255,0.5)' : t.cardSub, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>{card.label}</p>
              <p style={{ fontSize: '36px', fontWeight: '800', color: card.dark ? t.accentText : t.cardText, margin: 0, lineHeight: 1 }}>{card.value}</p>
              <p style={{ fontSize: '11px', color: card.dark ? 'rgba(255,255,255,0.3)' : '#ddd', margin: '6px 0 0' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* Recent orders */}
          <div style={{ background: t.card, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: t.cardText, margin: 0 }}>Recent orders</h2>
              <span style={{ fontSize: '12px', color: t.cardSub, cursor: 'pointer' }}>View all →</span>
            </div>
            {orders.map((order, i) => (
              <div key={order.id} style={{
                padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: i < orders.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#ccc', fontWeight: '500', width: '40px' }}>{order.id}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: t.cardText, margin: 0 }}>{order.customer}</p>
                    <p style={{ fontSize: '11px', color: t.cardSub, fontFamily: 'monospace', margin: '2px 0 0' }}>{order.product}</p>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
                  color: order.color, background: order.bg
                }}>{order.status}</span>
              </div>
            ))}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Turnaround */}
            <div style={{ background: t.card, borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: t.cardText, margin: '0 0 16px' }}>Avg. turnaround</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '6px' }}>
                <p style={{ fontSize: '40px', fontWeight: '800', color: t.cardText, margin: 0, lineHeight: 1 }}>1.8</p>
                <p style={{ fontSize: '13px', color: t.cardSub, marginBottom: '4px' }}>days</p>
              </div>
              <p style={{ fontSize: '11px', color: t.cardSub, margin: '0 0 16px' }}>SLA is 2 business days</p>
              <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px' }}>
                <div style={{ height: '6px', background: t.accent, borderRadius: '999px', width: '90%' }}></div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: t.accent, borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: t.accentText, margin: '0 0 16px' }}>Quick actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button style={{ width: '100%', background: t.accentText, color: t.accent, border: 'none', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Upload artwork
                </button>
                <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: t.accentText, border: 'none', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  View all orders
                </button>
                <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: t.accentText, border: 'none', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  Open design studio
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}