'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useMobile } from '@/hooks/useMobile';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];

const TRACK_STEPS = [
  { key:'awaiting_artwork', label:'Awaiting Artwork', icon:'🎨' },
  { key:'art_approved',     label:'Art Approved',     icon:'✅' },
  { key:'in_production',    label:'In Production',    icon:'⚙️' },
  { key:'shipped',          label:'Shipped',          icon:'📦' },
];

// Mock detail data for demo orders not yet in Supabase
const MOCK_ORDERS = {
  '1051': { order_number:'#1051', description:'24x T-Shirts, Front Print',    status:'In Production',  total_amount:342.00, created_at:'2026-05-10', notes:'Rush order — needed by May 17.' },
  '1049': { order_number:'#1049', description:'36x Jerseys, Name+Number',     status:'Awaiting Artwork',total_amount:540.00, created_at:'2026-05-07', notes:'' },
  '1048': { order_number:'#1048', description:'60x T-Shirts, 2-color print',  status:'Shipped',        total_amount:480.00, created_at:'2026-05-03', notes:'' },
  '1042': { order_number:'#1042', description:'100x T-Shirts, 3-color print', status:'Delivered',      total_amount:950.00, created_at:'2026-04-20', notes:'' },
  '1038': { order_number:'#1038', description:'24x Hoodies, Full Back',       status:'Delivered',      total_amount:480.00, created_at:'2026-04-05', notes:'' },
};

function getStepIndex(status) {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s.includes('deliver') || s.includes('ship')) return 4;
  if (s.includes('production'))  return 3;
  if (s.includes('art approved') || s.includes('quality')) return 2;
  return 1; // awaiting artwork or anything else
}

const STATUS_COLOR = {
  'Awaiting Artwork': '#8b5cf6',
  'Art Approved':     '#3b82f6',
  'In Production':    '#f59e0b',
  'Quality Check':    '#f97316',
  'Shipped':          '#10b981',
  'Delivered':        '#6b7280',
};

export default function OrderDetail() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params?.id;
  const supabase = createClient();
  const fileRef  = useRef();
  const isMobile = useMobile();

  const [order, setOrder]         = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reorderMsg, setReorderMsg]   = useState('');
  const [themeName, setThemeName]     = useState('classic');

  // Artwork upload state
  const [artUploading, setArtUploading] = useState(false);
  const [artLabel, setArtLabel]         = useState('');
  const [artMsg, setArtMsg]             = useState('');
  const [artFiles, setArtFiles]         = useState([]);
  const [dragging, setDragging]         = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('portal-theme');
    if (saved) setThemeName(saved);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUserId(user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('business_name, contact_name')
        .eq('id', user.id)
        .single();
      if (prof) setProfile(prof);

      // Try to fetch real order from Supabase by order_number
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('client_id', user.id)
        .eq('order_number', `#${id}`)
        .single();

      if (dbOrder) {
        const items = dbOrder.order_items || [];
        const desc  = items.length
          ? `${items[0].quantity}x ${items[0].description}${items[0].decoration ? ', ' + items[0].decoration : ''}`
          : 'Order items';
        setOrder({ ...dbOrder, description: desc, isMock: false });
      } else if (MOCK_ORDERS[id]) {
        setOrder({ ...MOCK_ORDERS[id], isMock: true });
      } else {
        setOrder(null);
      }

      setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function uploadArtwork(fileList) {
    if (!userId || !fileList?.length) return;
    setArtUploading(true);
    setArtMsg('');

    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', userId);
      if (artLabel.trim()) fd.append('label', artLabel.trim());
      if (order?.id && !order.isMock) fd.append('orderId', order.id);

      const res  = await fetch('/api/artwork/upload', { method:'POST', body:fd });
      const data = await res.json();
      if (!res.ok) {
        setArtMsg(`⚠ ${data.error || 'Upload failed'}`);
        setArtUploading(false);
        return;
      }
    }

    setArtMsg(`✓ ${fileList.length} file${fileList.length > 1 ? 's' : ''} submitted — S&A will review and confirm.`);
    setArtLabel('');
    setArtFiles([]);
    setArtUploading(false);
    setTimeout(() => setArtMsg(''), 5000);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadArtwork(e.dataTransfer.files);
  }

  function handleReorder() {
    setReorderMsg('✓ Reorder request sent! S&A will reach out to confirm details.');
    setTimeout(() => setReorderMsg(''), 4000);
  }

  const displayName = profile?.business_name || profile?.contact_name || 'Client';
  const initial     = displayName[0]?.toUpperCase() || '?';

  // Theme (basic, keep classic only for simplicity)
  const t = {
    sidebar:'#EFEDE8', sidebarText:'#666', sidebarActive:'#1a1a1a', sidebarActiveTxt:'white',
    main:'#f5f5f0', card:'white', cardText:'#1a1a1a', cardSub:'#9ca3af', accent:'#1a1a1a', accentText:'white',
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif', color:'#aaa', fontSize:'14px' }}>
      Loading order…
    </div>
  );

  if (!order) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif', flexDirection:'column', gap:'12px' }}>
      <div style={{ fontSize:'32px' }}>📦</div>
      <div style={{ fontSize:'16px', fontWeight:'600', color:'#374151' }}>Order not found</div>
      <a href="/orders" style={{ fontSize:'13px', color:'#6b7280', textDecoration:'none' }}>← Back to orders</a>
    </div>
  );

  const stepIdx    = getStepIndex(order.status);
  const statusColor = STATUS_COLOR[order.status] || '#6b7280';
  const isAwaiting  = order.status === 'Awaiting Artwork';
  const dateStr     = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:140, cursor:'pointer' }} />
      )}

      {/* Sidebar */}
      <div style={{ width:'220px', background:t.sidebar, display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between', transform: isMobile && !sidebarOpen ? 'translateX(-220px)' : 'none', transition:'transform 0.25s ease', zIndex:150 }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ position:'absolute', top:'14px', right:'14px', background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#666', lineHeight:1, padding:'4px' }}>✕</button>
        )}
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>{initial}</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>{displayName}</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const isActive = item.id === 'orders';
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
        <a href="/" onClick={async e => { e.preventDefault(); await supabase.auth.signOut(); router.push('/'); }}
          style={{ display:'block', padding:'8px 12px', color:'#666', fontSize:'12px', textDecoration:'none', textAlign:'center' }}>
          Sign Out
        </a>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft: isMobile ? 0 : '220px' }}>
        {isMobile && (
          <div style={{ position:'sticky', top:0, zIndex:50, padding:'12px 16px', background:'#EFEDE8', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:'12px' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#666', lineHeight:1, padding:'2px 4px' }}>☰</button>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'80px' }}/>
          </div>
        )}

        <div style={{ padding: isMobile ? '16px 14px' : '36px 40px', maxWidth:'860px' }}>

          {/* Header */}
          <div style={{ marginBottom:'28px' }}>
            <a href="/orders" style={{ fontSize:'13px', color:'#9ca3af', textDecoration:'none', display:'inline-block', marginBottom:'10px' }}>← Back to orders</a>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <h1 style={{ fontSize:'26px', fontWeight:'800', color:'#1a1a1a', margin:'0 0 4px' }}>Order {order.order_number}</h1>
                <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>Placed {dateStr} · {order.description}</p>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={handleReorder}
                  style={{ padding:'8px 16px', background:'transparent', border:'1px solid #d1d5db', color:'#374151', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                  🔄 Reorder
                </button>
                <span style={{ fontSize:'13px', fontWeight:'700', padding:'8px 16px', borderRadius:'20px', background:`${statusColor}18`, color:statusColor }}>
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

          {/* Progress tracker */}
          <div style={{ background:'white', borderRadius:'16px', padding:'28px', marginBottom:'20px', border:'1px solid #e5e7eb' }}>
            <h2 style={{ fontSize:'15px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 24px' }}>Order Progress</h2>
            <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
              <div style={{ position:'absolute', top:'18px', left:'18px', right:'18px', height:'3px', background:'#f3f4f6', zIndex:0 }}/>
              <div style={{ position:'absolute', top:'18px', left:'18px', height:'3px', background:'#1a1a1a', zIndex:1, width:`${Math.min(100, ((stepIdx - 1) / (TRACK_STEPS.length - 1)) * 100)}%`, transition:'width 0.6s ease' }}/>
              {TRACK_STEPS.map((step, i) => {
                const done    = i < stepIdx - 1;
                const current = i === stepIdx - 1;
                return (
                  <div key={step.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: done ? '#1a1a1a' : current ? statusColor : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', marginBottom:'10px', border:`3px solid ${done ? '#1a1a1a' : current ? statusColor : '#e5e7eb'}`, boxShadow: current ? `0 0 0 4px ${statusColor}25` : 'none', transition:'all 0.3s' }}>
                      {done ? <span style={{ color:'white', fontSize:'13px', fontWeight:'700' }}>✓</span> : <span>{step.icon}</span>}
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'11px', fontWeight:'600', color: done || current ? '#1a1a1a' : '#9ca3af' }}>{step.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Artwork upload — only when Awaiting Artwork */}
          {isAwaiting && (
            <div style={{ background:'white', borderRadius:'16px', padding:'24px', marginBottom:'20px', border:'2px solid #8b5cf630' }}>
              <div style={{ display:'flex', align:'center', gap:'10px', marginBottom:'6px' }}>
                <span style={{ fontSize:'18px' }}>🎨</span>
                <h2 style={{ fontSize:'15px', fontWeight:'700', color:'#1a1a1a', margin:0 }}>Upload Your Artwork</h2>
              </div>
              <p style={{ fontSize:'13px', color:'#9ca3af', margin:'0 0 18px 28px' }}>
                This order is waiting on your artwork. Upload your design files below and S&A will review and confirm before production starts.
              </p>

              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'5px' }}>Design Label <span style={{ fontWeight:'400', color:'#9ca3af' }}>(optional)</span></label>
                <input
                  type="text"
                  value={artLabel}
                  onChange={e => setArtLabel(e.target.value)}
                  placeholder="e.g. Front Logo, Jersey Back…"
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}
                />
              </div>

              <div
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !artUploading && fileRef.current?.click()}
                style={{ border:`2px dashed ${dragging ? '#8b5cf6' : '#d1d5db'}`, borderRadius:'12px', padding:'28px', textAlign:'center', cursor: artUploading ? 'default' : 'pointer', background: dragging ? '#f5f3ff' : '#fafafa', transition:'all 0.15s' }}>
                <input ref={fileRef} type="file" multiple accept=".svg,.ai,.pdf,.png,.jpg,.jpeg,.eps,.gif,.webp" style={{ display:'none' }} onChange={e => uploadArtwork(e.target.files)}/>
                {artUploading ? (
                  <div>
                    <div style={{ fontSize:'26px', marginBottom:'6px' }}>⏳</div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a1a' }}>Uploading…</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>🎨</div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a1a', marginBottom:'3px' }}>Drop files here or click to browse</div>
                    <div style={{ fontSize:'12px', color:'#9ca3af' }}>SVG · AI · PDF · PNG · JPG · EPS · Max 20MB</div>
                  </div>
                )}
              </div>

              {artMsg && (
                <div style={{ marginTop:'12px', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', background: artMsg.startsWith('✓') ? '#d1fae5' : '#fee2e2', color: artMsg.startsWith('✓') ? '#065f46' : '#991b1b' }}>
                  {artMsg}
                </div>
              )}
            </div>
          )}

          {/* Order details grid */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap:'16px' }}>

            {/* Left: details */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid #e5e7eb' }}>
                <h2 style={{ fontSize:'15px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 14px' }}>Order Details</h2>
                <div style={{ fontSize:'14px', color:'#374151', marginBottom:'10px' }}>{order.description}</div>
                {order.notes ? (
                  <div style={{ background:'#fffbeb', borderRadius:'10px', padding:'12px 14px', border:'1px solid #fde68a' }}>
                    <p style={{ fontSize:'11px', fontWeight:'600', color:'#92400e', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 3px' }}>Order Note</p>
                    <p style={{ fontSize:'13px', color:'#b45309', margin:0 }}>{order.notes}</p>
                  </div>
                ) : (
                  <div style={{ fontSize:'13px', color:'#9ca3af' }}>No special notes.</div>
                )}
              </div>
            </div>

            {/* Right: summary */}
            <div>
              <div style={{ background:'white', borderRadius:'16px', padding:'24px', border:'1px solid #e5e7eb' }}>
                <h2 style={{ fontSize:'15px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 16px' }}>Order Summary</h2>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'13px', color:'#9ca3af' }}>Order total</span>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a1a' }}>
                    {order.total_amount ? `$${parseFloat(order.total_amount).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div style={{ height:'1px', background:'#f3f4f6', margin:'12px 0' }}/>
                <button onClick={handleReorder}
                  style={{ width:'100%', padding:'10px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                  🔄 Reorder This
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
