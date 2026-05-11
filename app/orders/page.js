'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];

const ORDERS = [
  { id:'1051', product:'24x T-Shirts, Front Print',    status:'In Production',  color:'#f59e0b', date:'May 10, 2026', total:'$342.00', progress:40 },
  { id:'1049', product:'36x Jerseys, Name+Number',     status:'Awaiting Artwork',color:'#8b5cf6', date:'May 7, 2026',  total:'$540.00', progress:20 },
  { id:'1048', product:'60x T-Shirts, 2-color print',  status:'Shipped',        color:'#10b981', date:'May 3, 2026',  total:'$480.00', progress:100 },
  { id:'1042', product:'100x T-Shirts, 3-color print', status:'Delivered',      color:'#6b7280', date:'Apr 20, 2026', total:'$950.00', progress:100 },
  { id:'1038', product:'24x Hoodies, Full Back',       status:'Delivered',      color:'#6b7280', date:'Apr 5, 2026',  total:'$480.00', progress:100 },
];

const FILTERS = ['All', 'In Production', 'Awaiting Artwork', 'Shipped', 'Delivered'];
const BLANK_ORDER = { garment:'', quantity:'24', colors:'', decoration:'Screen Print', notes:'' };
const DECO_OPTIONS = ['Screen Print', 'Embroidery', 'DTF', 'Sublimation', 'Heat Transfer', 'Vinyl'];

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [filter, setFilter]         = useState('All');
  const [orders, setOrders]         = useState(ORDERS);
  const [loading, setLoading]       = useState(true);
  const [userId, setUserId]         = useState(null);
  const [profile, setProfile]       = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orderForm, setOrderForm]   = useState(BLANK_ORDER);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState('');
  const [newOrderNum, setNewOrderNum] = useState('');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUserId(user.id);

    const { data: prof } = await supabase.from('profiles').select('business_name, contact_name').eq('id', user.id).single();
    if (prof) setProfile(prof);

    const { data: dbOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, notes')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (dbOrders?.length) {
      const ids = dbOrders.map(o => o.id);
      const { data: items } = await supabase.from('order_items').select('order_id, description, quantity, decoration').in('order_id', ids);
      const mapped = dbOrders.map(o => {
        const it = (items || []).filter(i => i.order_id === o.id);
        const desc = it.length ? `${it[0].quantity}x ${it[0].description}${it[0].decoration ? ', ' + it[0].decoration : ''}` : 'Order items';
        const statusColor = { 'In Production':'#f59e0b','Awaiting Artwork':'#8b5cf6','Shipped':'#10b981','Delivered':'#6b7280','Art Approved':'#3b82f6','Quality Check':'#f97316' };
        return { id: o.order_number?.replace('#','') || o.id, product: desc, status: o.status, color: statusColor[o.status] || '#6b7280', date: new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), total: o.total_amount ? `$${parseFloat(o.total_amount).toFixed(2)}` : '—', progress: o.status==='Delivered'||o.status==='Shipped'?100:o.status==='In Production'?60:o.status==='Art Approved'?40:20 };
      });
      setOrders(mapped);
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function submitNewOrder(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: userId, ...orderForm }),
    });
    const data = await res.json();
    if (!res.ok) { setSubmitMsg('⚠ ' + (data.error || 'Failed')); setSubmitting(false); return; }
    setNewOrderNum(data.orderNumber);
    setSubmitMsg('success');
    setTimeout(() => { setShowNewOrder(false); setSubmitMsg(''); setNewOrderNum(''); setOrderForm(BLANK_ORDER); loadData(); }, 3000);
    setSubmitting(false);
  }

  const displayName = profile?.business_name || profile?.contact_name || 'Client';
  const initial = displayName[0]?.toUpperCase() || '?';
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>{loading ? '…' : initial}</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>{loading ? '—' : displayName}</div>
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
        <a href="/" style={{ display:'block', padding:'8px 12px', color:'#666', fontSize:'12px', textDecoration:'none', textAlign:'center' }}>Sign Out</a>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' }}>
          <div>
            <h1 style={{ fontSize:'26px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>Your Orders</h1>
            <p style={{ fontSize:'14px', color:'#aaa', margin:0 }}>{orders.length} orders total</p>
          </div>
          <button onClick={() => setShowNewOrder(true)} style={{ padding:'10px 20px', background:'#1a1a1a', color:'white', borderRadius:'10px', fontSize:'13px', fontWeight:'600', border:'none', cursor:'pointer' }}>
            + New Order
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'7px 16px', borderRadius:'20px', border:'none', background:filter===f?'#1a1a1a':'white', color:filter===f?'white':'#666', fontSize:'13px', cursor:'pointer', fontWeight:filter===f?'600':'400', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {filtered.map(order => (
            <a key={order.id} href={`/orders/${order.id}`}
              style={{ background:'white', borderRadius:'14px', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', textDecoration:'none', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #e5e5e5', gap:'16px' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'13px', fontWeight:'700', color:'#1a1a1a', fontFamily:'monospace' }}>#{order.id}</span>
                  <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px', background:`${order.color}18`, color:order.color }}>{order.status}</span>
                </div>
                <div style={{ fontSize:'14px', color:'#1a1a1a', marginBottom:'10px' }}>{order.product}</div>
                <div style={{ background:'#f3f4f6', borderRadius:'4px', height:'4px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${order.progress}%`, background:order.color, borderRadius:'4px', transition:'width 0.3s' }}/>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:'18px', fontWeight:'700', color:'#1a1a1a', marginBottom:'4px' }}>{order.total}</div>
                <div style={{ fontSize:'12px', color:'#aaa' }}>{order.date}</div>
                <div style={{ fontSize:'12px', color:'#1a1a1a', marginTop:'6px', fontWeight:'500' }}>View details →</div>
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>
            No orders match this filter.
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}
          onClick={e => e.target === e.currentTarget && setShowNewOrder(false)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'36px', maxWidth:'480px', width:'100%', position:'relative' }}>
            <button onClick={() => setShowNewOrder(false)}
              style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>×</button>

            {submitMsg === 'success' ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>✅</div>
                <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 8px' }}>Order {newOrderNum} Created!</h2>
                <p style={{ fontSize:'14px', color:'#6b7280', margin:0 }}>We'll reach out shortly to confirm details. Upload your artwork in the Artwork Library.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>New Order</h2>
                <p style={{ fontSize:'13px', color:'#9ca3af', marginBottom:'24px' }}>Tell us what you need and we'll get back to you with a quote.</p>

                <form onSubmit={submitNewOrder} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Garment / Product *</label>
                    <input required value={orderForm.garment} onChange={e => setOrderForm(f => ({ ...f, garment: e.target.value }))}
                      placeholder="e.g. Gildan 5000 T-Shirts, Bella Canvas 3001…"
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Quantity *</label>
                      <input required type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm(f => ({ ...f, quantity: e.target.value }))}
                        placeholder="24"
                        style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Decoration</label>
                      <select value={orderForm.decoration} onChange={e => setOrderForm(f => ({ ...f, decoration: e.target.value }))}
                        style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none', background:'white' }}>
                        {DECO_OPTIONS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Colors Needed</label>
                    <input value={orderForm.colors} onChange={e => setOrderForm(f => ({ ...f, colors: e.target.value }))}
                      placeholder="e.g. White, Black, Navy…"
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}/>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>Notes / Special Instructions</label>
                    <textarea value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Rush order, deadline, print location, size breakdown…" rows={3}
                      style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none', resize:'vertical' }}/>
                  </div>

                  {submitMsg && submitMsg !== 'success' && (
                    <div style={{ padding:'8px 12px', background:'#fee2e2', borderRadius:'8px', fontSize:'13px', color:'#991b1b' }}>{submitMsg}</div>
                  )}

                  <button type="submit" disabled={submitting}
                    style={{ padding:'12px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:submitting?'default':'pointer', opacity:submitting?0.7:1 }}>
                    {submitting ? 'Submitting…' : 'Submit Order Request'}
                  </button>
                  <p style={{ fontSize:'11px', color:'#9ca3af', textAlign:'center', margin:0 }}>We'll confirm details and send a quote within 1 business day.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

