'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const themes = {
  classic:  { name:'Classic',  sidebar:'#EFEDE8', sidebarText:'#666', sidebarActive:'#1a1a1a', sidebarActiveTxt:'white', main:'#F5F5F0', card:'white',    cardText:'#1a1a1a', cardSub:'#aaa', accent:'#1a1a1a', accentText:'white', logoFilter:'none' },
  midnight: { name:'Midnight', sidebar:'#0f0f0f', sidebarText:'#666', sidebarActive:'white',   sidebarActiveTxt:'#0f0f0f', main:'#1a1a1a', card:'#242424', cardText:'white',   cardSub:'#555', accent:'white',   accentText:'#1a1a1a', logoFilter:'invert(1)' },
  ocean:    { name:'Ocean',    sidebar:'#0a1628', sidebarText:'#4a7fa5', sidebarActive:'#2196f3', sidebarActiveTxt:'white', main:'#0d1f35', card:'#0f2744', cardText:'white',   cardSub:'#4a7fa5', accent:'#2196f3', accentText:'white', logoFilter:'invert(1)' },
  forest:   { name:'Forest',   sidebar:'#0f1f0f', sidebarText:'#4a7a4a', sidebarActive:'#4caf50', sidebarActiveTxt:'white', main:'#141f14', card:'#1a2e1a', cardText:'white',   cardSub:'#4a7a4a', accent:'#4caf50', accentText:'white', logoFilter:'invert(1)' },
  sunset:   { name:'Sunset',   sidebar:'#1a0f0a', sidebarText:'#a06040', sidebarActive:'#ff6b35', sidebarActiveTxt:'white', main:'#1f1510', card:'#2a1f15', cardText:'white',   cardSub:'#a06040', accent:'#ff6b35', accentText:'white', logoFilter:'invert(1)' },
  lavender: { name:'Lavender', sidebar:'#f0eef8', sidebarText:'#8878c3', sidebarActive:'#7c6bc4', sidebarActiveTxt:'white', main:'#f5f3ff', card:'white',    cardText:'#2d2460', cardSub:'#9b8fd4', accent:'#7c6bc4', accentText:'white', logoFilter:'none' },
};

const STATUS_COLORS = {
  'In Production':    '#f59e0b',
  'Awaiting Artwork': '#8b5cf6',
  'Shipped':          '#10b981',
  'Delivered':        '#6b7280',
  'Art Approved':     '#3b82f6',
  'Quality Check':    '#f97316',
};

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];

const LOYALTY_TIERS = [
  { name:'Bronze',   min:0,  max:4,  color:'#cd7f32', emoji:'🥉', perks:['Early access to new products'] },
  { name:'Silver',   min:5,  max:14, color:'#9ca3af', emoji:'🥈', perks:['5% reorder discount','Priority support'] },
  { name:'Gold',     min:15, max:29, color:'#f59e0b', emoji:'🥇', perks:['10% reorder discount','Free setup on reorders','Dedicated rep'] },
  { name:'Platinum', min:30, max:Infinity, color:'#8b5cf6', emoji:'💎', perks:['15% discount on all orders','Free rush processing','White-glove service'] },
];

function getLoyaltyTier(totalOrders) {
  return LOYALTY_TIERS.find(t => totalOrders >= t.min && totalOrders <= t.max) || LOYALTY_TIERS[0];
}

const ONBOARDING_STEPS = [
  { title:'Welcome to your portal', sub:'Everything you need to manage your S&A print orders in one place.', icon:'👋', tip:null },
  { title:'Track your orders', sub:'Watch every order move from Art Approved → Production → Shipped in real time.', icon:'📦', tip:'Head to Orders to see your current status.' },
  { title:'Upload your artwork', sub:'Drop files directly into your orders. We support SVG, AI, PDF, PNG, and more.', icon:'🎨', tip:'Visit Artwork Library to manage your files.' },
  { title:'Design in the Studio', sub:'Preview your logo on actual garments before ordering. It\'s quick and free.', icon:'✦', tip:'Try Design Studio — it takes 2 minutes.' },
  { title:'You\'re all set!', sub:'Your account rep will reach out if we need anything. Questions? Hit Messages anytime.', icon:'✓', tip:null },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [themeName, setThemeNameState] = useState('classic');
  const [showThemes, setShowThemes] = useState(false);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ active: 0, pendingArt: 0, totalOrders: 0, balanceDue: 0, balanceDueDate: '' });
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(-1); // -1 = hidden
  const [userId, setUserId] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ brand:'', sku:'', garment:'', notes:'' });
  const [requestSuccess, setRequestSuccess] = useState(false);

  const t = themes[themeName];

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUserId(user.id);

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (prof) {
      setProfile(prof);
      if (prof.theme && themes[prof.theme]) setThemeNameState(prof.theme);
      if (!prof.onboarding_complete) setOnboardingStep(0);
    }

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, total_amount')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    let ordersWithDesc = recentOrders || [];
    if (ordersWithDesc.length > 0) {
      const orderIds = ordersWithDesc.map(o => o.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, description, quantity, decoration')
        .in('order_id', orderIds);

      ordersWithDesc = ordersWithDesc.map(o => {
        const oItems = (items || []).filter(i => i.order_id === o.id);
        const desc = oItems.length > 0
          ? `${oItems[0].quantity}x ${oItems[0].description || 'Items'}${oItems[0].decoration ? ', ' + oItems[0].decoration : ''}`
          : 'Order items';
        return { ...o, description: desc };
      });
    }

    setOrders(ordersWithDesc);

    const { data: allOrders } = await supabase
      .from('orders')
      .select('status, total_amount')
      .eq('client_id', user.id);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount, due_date')
      .eq('client_id', user.id)
      .eq('paid', false)
      .order('due_date', { ascending: true })
      .limit(1);

    const activeStatuses = ['Awaiting Artwork', 'Art Approved', 'In Production', 'Quality Check'];
    const active = (allOrders || []).filter(o => activeStatuses.includes(o.status)).length;
    const pendingArt = (allOrders || []).filter(o => o.status === 'Awaiting Artwork').length;
    const balanceDue = invoices?.[0]?.amount ?? 0;
    const balanceDueDate = invoices?.[0]?.due_date
      ? new Date(invoices[0].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';

    setStats({ active, pendingArt, totalOrders: (allOrders || []).length, balanceDue, balanceDueDate });
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function setThemeName(key) {
    setThemeNameState(key);
    setShowThemes(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ theme: key }).eq('id', user.id);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function submitRequest(e) {
    e.preventDefault();
    const res = await fetch('/api/requests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestForm, clientId: userId }),
    });
    if (res.ok) {
      setRequestSuccess(true);
      setTimeout(() => { setShowRequest(false); setRequestSuccess(false); setRequestForm({ brand:'', sku:'', garment:'', notes:'' }); }, 2500);
    }
  }

  async function completeOnboarding() {
    setOnboardingStep(-1);
    if (userId) {
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', userId);
    }
  }

  function nextOnboardingStep() {
    if (onboardingStep >= ONBOARDING_STEPS.length - 1) {
      completeOnboarding();
    } else {
      setOnboardingStep(s => s + 1);
    }
  }

  const businessInitial = profile?.business_name?.[0]?.toUpperCase() ?? '?';
  const displayName = profile?.business_name || profile?.contact_name || 'Client';

  const displayOrders = orders.length > 0 ? orders : (loading ? [] : [
    { id: 'demo-1', order_number: '#1051', description: '24x T-Shirts, Front Print',   status: 'In Production',    created_at: new Date().toISOString() },
    { id: 'demo-2', order_number: '#1049', description: '36x Jerseys, Name+Number',    status: 'Awaiting Artwork', created_at: new Date(Date.now()-259200000).toISOString() },
    { id: 'demo-3', order_number: '#1048', description: '60x T-Shirts, 2-color print', status: 'Shipped',          created_at: new Date(Date.now()-691200000).toISOString() },
  ]);

  const loyaltyTotal = loading ? 0 : stats.totalOrders;
  const tier = getLoyaltyTier(loyaltyTotal);
  const nextTier = LOYALTY_TIERS.find(t => t.min > loyaltyTotal);
  const tierProgress = nextTier
    ? Math.min(100, Math.round(((loyaltyTotal - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:t.sidebar, display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px', filter:t.logoFilter }}/>
          </div>

          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:t.accent, display:'flex', alignItems:'center', justifyContent:'center', color:t.accentText, fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>
              {loading ? '…' : businessInitial}
            </div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText }}>{loading ? '—' : displayName}</div>
            <div style={{ fontSize:'12px', color:t.cardSub }}>{profile?.account_rep || 'S&A Team'}</div>
          </div>

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

        <div>
          <div style={{ marginBottom:'16px' }}>
            <button onClick={() => setShowThemes(s => !s)}
              style={{ width:'100%', padding:'8px 12px', background:'transparent', border:`1px solid ${t.sidebarText}40`, borderRadius:'8px', color:t.sidebarText, fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>🎨 Theme: {t.name}</span>
              <span>{showThemes ? '▲' : '▼'}</span>
            </button>
            {showThemes && (
              <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'4px' }}>
                {Object.entries(themes).map(([key, th]) => (
                  <button key={key} onClick={() => setThemeName(key)}
                    style={{ padding:'6px 10px', background:key===themeName?t.sidebarActive:'transparent', border:'none', borderRadius:'6px', color:key===themeName?t.sidebarActiveTxt:t.sidebarText, fontSize:'12px', cursor:'pointer', textAlign:'left' }}>
                    {th.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSignOut}
            style={{ display:'block', width:'100%', padding:'8px 12px', background:'transparent', border:'none', color:t.sidebarText, fontSize:'12px', cursor:'pointer', textAlign:'center' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
          <div>
            <h1 style={{ fontSize:'26px', fontWeight:'700', color:t.cardText, margin:'0 0 4px' }}>
              Welcome back{profile?.contact_name ? `, ${profile.contact_name.split(' ')[0]}` : ''} 👋
            </h1>
            <p style={{ fontSize:'14px', color:t.cardSub, margin:0 }}>Here's what's happening with your orders.</p>
          </div>
          <a href="/orders"
            style={{ padding:'10px 20px', background:t.accent, color:t.accentText, borderRadius:'10px', fontSize:'13px', fontWeight:'600', textDecoration:'none', whiteSpace:'nowrap' }}>
            + New Order
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'28px' }}>
          {[
            { label:'Active Orders',   value: loading ? '—' : String(stats.active),         sub: stats.active === 1 ? '1 in production' : `${stats.active} in progress` },
            { label:'Pending Artwork', value: loading ? '—' : String(stats.pendingArt),      sub: stats.pendingArt > 0 ? 'Needs your upload' : 'All caught up' },
            { label:'Balance Due',     value: loading ? '—' : stats.balanceDue > 0 ? `$${stats.balanceDue.toFixed(0)}` : '$0', sub: stats.balanceDueDate ? `Due ${stats.balanceDueDate}` : 'No open invoices' },
            { label:'Total Orders',    value: loading ? '—' : String(stats.totalOrders),     sub: 'All time' },
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
          {loading ? (
            <div style={{ textAlign:'center', padding:'24px', color:t.cardSub, fontSize:'13px' }}>Loading…</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {displayOrders.map(order => {
                const color = STATUS_COLORS[order.status] || '#6b7280';
                const dateStr = order.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })
                  : '';
                const href = order.id.startsWith('demo-') ? '#' : `/orders/${order.id}`;
                return (
                  <a key={order.id} href={href}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:`${t.cardSub}10`, borderRadius:'10px', textDecoration:'none', cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:t.accent, fontFamily:'monospace' }}>{order.order_number}</span>
                      <span style={{ fontSize:'13px', color:t.cardText }}>{order.description}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <span style={{ fontSize:'12px', color:t.cardSub }}>{dateStr}</span>
                      <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px', background:`${color}20`, color }}>{order.status}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom row: Quick actions + Loyalty widget */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px' }}>

          {/* Quick actions */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px' }}>
            {[
              { label:'Upload Artwork',    sub:'Add files to your orders',        icon:'🎨', href:'/artwork' },
              { label:'Design Studio',     sub:'Preview your garments in 360°',   icon:'✦',  href:'/studio' },
              { label:'View Invoices',     sub:'Check billing & payment status',   icon:'💰', href:'/billing' },
            ].map(action => (
              <a key={action.label} href={action.href}
                style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.cardSub}20`, textDecoration:'none', display:'block', transition:'all 0.15s' }}>
                <div style={{ fontSize:'24px', marginBottom:'10px' }}>{action.icon}</div>
                <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText, marginBottom:'4px' }}>{action.label}</div>
                <div style={{ fontSize:'12px', color:t.cardSub }}>{action.sub}</div>
              </a>
            ))}
            <button onClick={() => setShowRequest(true)}
              style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.cardSub}20`, textAlign:'left', cursor:'pointer', display:'block', width:'100%' }}>
              <div style={{ fontSize:'24px', marginBottom:'10px' }}>📋</div>
              <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText, marginBottom:'4px' }}>Request a Product</div>
              <div style={{ fontSize:'12px', color:t.cardSub }}>Ask us to source a specific garment</div>
            </button>
          </div>

          {/* Loyalty widget */}
          <div style={{ background:t.card, borderRadius:'12px', padding:'20px', border:`1px solid ${t.cardSub}20` }}>
            <div style={{ fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Loyalty Status</div>

            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'28px' }}>{tier.emoji}</span>
              <div>
                <div style={{ fontSize:'16px', fontWeight:'700', color:tier.color }}>{tier.name}</div>
                <div style={{ fontSize:'12px', color:t.cardSub }}>{loyaltyTotal} order{loyaltyTotal !== 1 ? 's' : ''} total</div>
              </div>
            </div>

            {nextTier && (
              <div style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                  <span style={{ fontSize:'11px', color:t.cardSub }}>Progress to {nextTier.name}</span>
                  <span style={{ fontSize:'11px', color:t.cardSub, fontWeight:'600' }}>{nextTier.min - loyaltyTotal} more</span>
                </div>
                <div style={{ height:'6px', background:`${t.cardSub}25`, borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${tierProgress}%`, background:tier.color, borderRadius:'3px', transition:'width 0.5s ease' }}/>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              {tier.perks.map(perk => (
                <div key={perk} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:t.cardSub }}>
                  <span style={{ color:tier.color, fontWeight:'700' }}>✓</span>
                  {perk}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Request a Product modal */}
      {showRequest && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}
          onClick={e => e.target === e.currentTarget && setShowRequest(false)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'36px', maxWidth:'440px', width:'100%', position:'relative' }}>
            <button onClick={() => setShowRequest(false)}
              style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>×</button>

            {requestSuccess ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>✅</div>
                <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 8px' }}>Request Received!</h2>
                <p style={{ fontSize:'14px', color:'#6b7280', margin:0 }}>We'll look into sourcing this for you and reach out shortly.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>Request a Product</h2>
                <p style={{ fontSize:'13px', color:'#9ca3af', marginBottom:'24px' }}>Tell us what garment you're looking for and we'll source it for you.</p>

                <form onSubmit={submitRequest} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Brand Name *</label>
                    <input required value={requestForm.brand} onChange={e => setRequestForm(f => ({ ...f, brand:e.target.value }))}
                      placeholder="e.g. Port & Company, Gildan, Next Level…"
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>SKU / Style Number</label>
                    <input value={requestForm.sku} onChange={e => setRequestForm(f => ({ ...f, sku:e.target.value }))}
                      placeholder="e.g. PC54, 5000, 6210"
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Garment Name / Description *</label>
                    <input required value={requestForm.garment} onChange={e => setRequestForm(f => ({ ...f, garment:e.target.value }))}
                      placeholder="e.g. Unisex Essential T-Shirt"
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Additional Notes</label>
                    <textarea value={requestForm.notes} onChange={e => setRequestForm(f => ({ ...f, notes:e.target.value }))}
                      placeholder="Colors, sizes, quantity estimate, deadline…" rows={3}
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none', resize:'vertical' }}/>
                  </div>
                  <button type="submit"
                    style={{ padding:'12px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>
                    Submit Request
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Onboarding modal */}
      {onboardingStep >= 0 && onboardingStep < ONBOARDING_STEPS.length && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'40px', maxWidth:'460px', width:'100%', textAlign:'center', position:'relative' }}>
            {/* Step dots */}
            <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginBottom:'28px' }}>
              {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} style={{ width:i===onboardingStep?20:8, height:'8px', borderRadius:'4px', background:i===onboardingStep?'#1a1a1a':i<onboardingStep?'#ccc':'#e5e5e5', transition:'all 0.25s' }}/>
              ))}
            </div>

            <div style={{ fontSize:'48px', marginBottom:'16px' }}>{ONBOARDING_STEPS[onboardingStep].icon}</div>
            <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 10px' }}>{ONBOARDING_STEPS[onboardingStep].title}</h2>
            <p style={{ fontSize:'14px', color:'#6b7280', lineHeight:'1.7', margin:'0 0 24px' }}>{ONBOARDING_STEPS[onboardingStep].sub}</p>

            {ONBOARDING_STEPS[onboardingStep].tip && (
              <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'12px 16px', marginBottom:'24px', fontSize:'12px', color:'#6b7280', border:'1px solid #e5e5e5' }}>
                💡 {ONBOARDING_STEPS[onboardingStep].tip}
              </div>
            )}

            <div style={{ display:'flex', gap:'10px' }}>
              {onboardingStep > 0 && (
                <button onClick={() => setOnboardingStep(s => s - 1)}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', color:'#666' }}>
                  Back
                </button>
              )}
              <button onClick={nextOnboardingStep}
                style={{ flex:2, padding:'12px', background:'#1a1a1a', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', color:'white' }}>
                {onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Get Started →' : 'Next →'}
              </button>
            </div>

            <button onClick={completeOnboarding}
              style={{ marginTop:'16px', background:'none', border:'none', fontSize:'12px', color:'#bbb', cursor:'pointer' }}>
              Skip walkthrough
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
