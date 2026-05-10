'use client';
import { useState } from 'react';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
];

const ORDERS = [
  { id:'1051', product:'24x T-Shirts, Front Print',    status:'In Production',  color:'#f59e0b', date:'May 10, 2026', total:'$342.00', progress:40 },
  { id:'1049', product:'36x Jerseys, Name+Number',     status:'Awaiting Artwork',color:'#8b5cf6', date:'May 7, 2026',  total:'$540.00', progress:20 },
  { id:'1048', product:'60x T-Shirts, 2-color print',  status:'Shipped',        color:'#10b981', date:'May 3, 2026',  total:'$480.00', progress:100 },
  { id:'1042', product:'100x T-Shirts, 3-color print', status:'Delivered',      color:'#6b7280', date:'Apr 20, 2026', total:'$950.00', progress:100 },
  { id:'1038', product:'24x Hoodies, Full Back',       status:'Delivered',      color:'#6b7280', date:'Apr 5, 2026',  total:'$480.00', progress:100 },
];

const FILTERS = ['All', 'In Production', 'Awaiting Artwork', 'Shipped', 'Delivered'];

export default function OrdersPage() {
  const [active, setActive] = useState('dashboard');
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? ORDERS : ORDERS.filter(o => o.status === filter);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>R</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>Riverside Youth</div>
            <div style={{ fontSize:'12px', color:'#aaa' }}>Sports</div>
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
            <p style={{ fontSize:'14px', color:'#aaa', margin:0 }}>{ORDERS.length} orders total</p>
          </div>
          <a href="/studio" style={{ padding:'10px 20px', background:'#1a1a1a', color:'white', borderRadius:'10px', fontSize:'13px', fontWeight:'600', textDecoration:'none' }}>
            + Start New Design
          </a>
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
    </div>
  );
}
