'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const themes = {
  classic:    { name:'Classic',     sidebar:'#EFEDE8', sidebarText:'#666', sidebarActive:'#1a1a1a', sidebarActiveTxt:'white', main:'#F5F5F0', card:'white', cardText:'#1a1a1a', cardSub:'#aaa', accent:'#1a1a1a', accentText:'white', logoFilter:'none' },
  midnight:   { name:'Midnight',    sidebar:'#0f0f0f', sidebarText:'#666', sidebarActive:'white',   sidebarActiveTxt:'#0f0f0f', main:'#1a1a1a', card:'#242424', cardText:'white', cardSub:'#555', accent:'white', accentText:'#1a1a1a', logoFilter:'invert(1)' },
  ocean:      { name:'Ocean',       sidebar:'#0a1628', sidebarText:'#4a7fa5', sidebarActive:'#2196f3', sidebarActiveTxt:'white', main:'#0d1f35', card:'#0f2744', cardText:'white', cardSub:'#4a7fa5', accent:'#2196f3', accentText:'white', logoFilter:'invert(1)' },
  forest:     { name:'Forest',      sidebar:'#0f1f0f', sidebarText:'#4a7a4a', sidebarActive:'#4caf50', sidebarActiveTxt:'white', main:'#141f14', card:'#1a2e1a', cardText:'white', cardSub:'#4a7a4a', accent:'#4caf50', accentText:'white', logoFilter:'invert(1)' },
  sunset:     { name:'Sunset',      sidebar:'#1a0f0a', sidebarText:'#a06040', sidebarActive:'#ff6b35', sidebarActiveTxt:'white', main:'#1f1510', card:'#2a1f15', cardText:'white', cardSub:'#a06040', accent:'#ff6b35', accentText:'white', logoFilter:'invert(1)' },
  lavender:   { name:'Lavender',    sidebar:'#f0eef8', sidebarText:'#8878c3', sidebarActive:'#7c6bc4', sidebarActiveTxt:'white', main:'#f5f3ff', card:'white', cardText:'#2d2460', cardSub:'#9b8fd4', accent:'#7c6bc4', accentText:'white', logoFilter:'none' },
};

const NAV = [
  { id:'dashboard', label:'Dashboard',      icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',         icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library',icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',  icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',        icon:'◎', href:'/billing' },
];

const MOCK_ORDERS = [
  { id:'#1051', product:'24x T-Shirts, Front Print',   status:'In Production', color:'#f59e0b', date:'May 10' },
  { id:'#1049', product:'36x Jerseys, Name+Number',    status:'Awaiting Artwork', color:'#8b5cf6', date:'May 7' },
  { id:'#1048', product:'60x T-Shirts, 2-color print', status:'Shipped',        color:'#10b981', date:'May 3' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [themeName, setThemeName] = useState('classic');
  const [showThemes, setShowThemes] = useState(false);
  const t = themes[themeName];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:t.sidebar, display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          {/* Logo */}
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px', filter:t.logoFilter }}/>
          </div>

          {/* User avatar */}
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:t.accent, display:'flex', alignItems:'center', justifyContent:'center', color:t.accentText, fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>R</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText }}>Riverside Youth</div>
            <div style={{ fontSize:'12px', color:t.cardSub }}>Sports</div>
          </div>

          {/* Nav links */}
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const active = item.id === 'dashboard';
              return (
                <a key={item.id} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', textDecoration:'none', cursor:'pointer', background:active?t.sidebarActive:'transparent', color:active?t.sidebarActiveTxt:t.sidebarText, fontSize:'13px', fontWeight:active?'600':'400', transition:'all 0.15s' }}>
                  <span style={{ fontSize:'16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div>
          {/* Theme switcher */}
          <div style={{ marginBottom:'16px' }}>
            <button onClick={() => setShowThemes(s => !s)}
              style={{ width:'100%', padding:'8px 12px', background:'transparent', border:`1px solid ${t.sidebarText}40`, borderRadius:'8px', color:t.sidebarText, fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>🎨 Theme: {t.name}</span>
              <span>{showThemes ? '▲' : '▼'}</span>
            </button>
            {showThemes && (
              <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'4px' }}>
                {Object.entries(themes).map(([key, th]) => (
                  <button key={key} onClick={() => { setThemeName(key); setShowThemes(false); }}
                    style={{ padding:'6px 10px', background:key===themeName?t.sidebarActive:'transparent', border:'none', borderRadius:'6px', color:key===themeName?t.sidebarActiveTxt:t.sidebarText, fontSize:'12px', cursor:'pointer', textAlign:'left' }}>
                    {th.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a href="/" style={{ display:'block', padding:'8px 12px', color:t.sidebarText, fontSize:'12px', textDecoration:'none', textAlign:'center' }}>
            Sign Out
          </a>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
          <div>
            <h1 style={{ fontSize:'26px', fontWeight:'700', color:t.cardText, margin:'0 0 4px' }}>Welcome back 👋</h1>
            <p style={{ fontSize:'14px', color:t.cardSub, margin:0 }}>Here's what's happening with your orders.</p>
          </div>
          <a href="/orders" style={{ padding:'10px 20px', background:t.accent, color:t.accentText, borderRadius:'10px', fontSize:'13px', fontWeight:'600', textDecoration:'none', whiteSpace:'nowrap' }}>
            + New Order
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'28px' }}>
          {[
            { label:'Active Orders',    value:'3',      sub:'2 in production' },
            { label:'Pending Artwork',  value:'1',      sub:'Needs your upload' },
            { label:'Balance Due',      value:'$342',   sub:'Due Jun 9' },
            { label:'Total Orders',     value:'12',     sub:'All time' },
          ].map(stat => (
            <div key={stat.label} style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.cardSub}20` }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>{stat.label}</div>
              <div style={{ fontSize:'28px', fontWeight:'700', color:t.cardText, marginBottom:'4px' }}>{stat.value}</div>
              <div style={{ fontSize:'12px', color:t.cardSub }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div style={{ background:t.card, borderRadius:'14px', padding:'22px', marginBottom:'20px', border:`1px solid ${t.cardSub}20` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:'600', color:t.cardText, margin:0 }}>Recent Orders</h2>
            <a href="/orders" style={{ fontSize:'13px', color:t.accent, textDecoration:'none', fontWeight:'500' }}>View all →</a>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {MOCK_ORDERS.map(order => (
              <a key={order.id} href={`/orders/${order.id.replace('#','')}`}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:`${t.cardSub}10`, borderRadius:'10px', textDecoration:'none', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                  <span style={{ fontSize:'13px', fontWeight:'700', color:t.accent, fontFamily:'monospace' }}>{order.id}</span>
                  <span style={{ fontSize:'13px', color:t.cardText }}>{order.product}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                  <span style={{ fontSize:'12px', color:t.cardSub }}>{order.date}</span>
                  <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px', background:`${order.color}20`, color:order.color }}>{order.status}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
          {[
            { label:'Upload Artwork',   sub:'Add files to your orders',      icon:'🎨', href:'/artwork' },
            { label:'Design Studio',    sub:'Preview your garments in 360°', icon:'✦',  href:'/studio' },
            { label:'View Invoices',    sub:'Check billing & payment status', icon:'💰', href:'/billing' },
          ].map(action => (
            <a key={action.label} href={action.href}
              style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.cardSub}20`, textDecoration:'none', display:'block', transition:'all 0.15s' }}>
              <div style={{ fontSize:'24px', marginBottom:'10px' }}>{action.icon}</div>
              <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText, marginBottom:'4px' }}>{action.label}</div>
              <div style={{ fontSize:'12px', color:t.cardSub }}>{action.sub}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
