'use client';
import { useState, useRef } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sanda2024admin';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_ALERTS = [
  { id:1, level:'urgent', icon:'🔴', title:'Order #1042 overdue', detail:'Print deadline passed 2 days ago', section:'orders', time:'2d ago' },
  { id:2, level:'urgent', icon:'🔴', title:'Payment past due', detail:'Riverside Youth Sports — Invoice #88 overdue 5 days', section:'billing', time:'5d ago' },
  { id:3, level:'action', icon:'🟡', title:'Artwork needs approval', detail:'Lakewood FC uploaded 3 files — pending review', section:'artwork', time:'3h ago' },
  { id:4, level:'action', icon:'🟡', title:'Low inventory', detail:'Port & Company PC54 White — only 12 units left', section:'inventory', time:'1d ago' },
  { id:5, level:'action', icon:'🟡', title:'New client message', detail:'East Side Brewing: "When will our order ship?"', section:'messages', time:'45m ago' },
  { id:6, level:'info', icon:'🟢', title:'New order received', detail:'Order #1051 from Northside Academy — $342.00', section:'orders', time:'1h ago' },
  { id:7, level:'info', icon:'🟢', title:'Webhook connected', detail:'Order Desk sync active — last ping 4 min ago', section:'orderdesk', time:'4m ago' },
];

const MOCK_CLIENTS = [
  { id:1, name:'Riverside Youth Sports', email:'coach@riversidefc.com', phone:'(201) 555-0182', orders:12, balance:245.00, status:'active', lastOrder:'2d ago', notes:'Prefers rush orders. Net 30.' },
  { id:2, name:'East Side Brewing Co.', email:'merch@eastsidebrew.com', phone:'(973) 555-0134', orders:8, balance:0, status:'active', lastOrder:'1w ago', notes:'Always pays on time. Loves oversized prints.' },
  { id:3, name:'Lakewood FC', email:'admin@lakewoodfc.com', phone:'(732) 555-0199', orders:5, balance:180.00, status:'active', lastOrder:'3d ago', notes:'Youth league — discount applied.' },
  { id:4, name:'Northside Academy', email:'office@northsideacademy.edu', phone:'(201) 555-0167', orders:3, balance:342.00, status:'new', lastOrder:'1h ago', notes:'' },
  { id:5, name:'Summit CrossFit', email:'hello@summitcf.com', phone:'(908) 555-0211', orders:15, balance:0, status:'vip', lastOrder:'4d ago', notes:'VIP client. 10% standing discount.' },
];

const MOCK_ORDERS = [
  { id:'#1051', client:'Northside Academy', items:'24x T-Shirts, Front Print', total:342.00, status:'new', date:'1h ago', urgent:false },
  { id:'#1050', client:'Summit CrossFit', items:'48x Hoodies, Full Back', total:876.00, status:'printing', date:'2d ago', urgent:false },
  { id:'#1049', client:'Lakewood FC', items:'36x Jerseys, Name+Number', total:540.00, status:'review', date:'3d ago', urgent:false },
  { id:'#1048', client:'East Side Brewing Co.', items:'60x T-Shirts, 2-color', total:480.00, status:'shipped', date:'1w ago', urgent:false },
  { id:'#1042', client:'Riverside Youth Sports', items:'100x T-Shirts, 3-color', total:950.00, status:'overdue', date:'12d ago', urgent:true },
];

const MOCK_INVOICES = [
  { id:'INV-088', client:'Riverside Youth Sports', amount:245.00, issued:'Mar 28', due:'Apr 27', status:'overdue', waived:false },
  { id:'INV-091', client:'Lakewood FC', amount:180.00, issued:'Apr 10', due:'May 10', status:'pending', waived:false },
  { id:'INV-093', client:'Northside Academy', amount:342.00, issued:'May 10', due:'Jun 9', status:'pending', waived:false },
  { id:'INV-089', client:'East Side Brewing Co.', amount:480.00, issued:'Apr 2', due:'May 2', status:'paid', waived:false },
  { id:'INV-090', client:'Summit CrossFit', amount:876.00, issued:'Apr 8', due:'May 8', status:'paid', waived:false },
];

const MOCK_INVENTORY = [
  { id:1, sku:'PC54-WHT', name:'Port & Company PC54 White', qty:12, min:24, status:'low' },
  { id:2, sku:'PC54-BLK', name:'Port & Company PC54 Black', qty:88, min:24, status:'ok' },
  { id:3, sku:'PC78H-NVY', name:'Port & Company PC78H Navy Hoodie', qty:34, min:12, status:'ok' },
  { id:4, sku:'NF0A3LHB', name:'New Era Snapback Black', qty:5, min:12, status:'critical' },
  { id:5, sku:'ST850-GRY', name:'Sport-Tek ST850 Gray', qty:60, min:24, status:'ok' },
];

const MOCK_ARTWORK = [
  { id:1, client:'Lakewood FC', file:'lfc_jersey_front_v2.ai', uploaded:'3h ago', status:'pending', notes:'' },
  { id:2, client:'Lakewood FC', file:'lfc_jersey_back_v2.ai', uploaded:'3h ago', status:'pending', notes:'' },
  { id:3, client:'Lakewood FC', file:'lfc_sleeve_patch.ai', uploaded:'3h ago', status:'pending', notes:'' },
  { id:4, client:'Summit CrossFit', file:'scf_logo_final.svg', uploaded:'2d ago', status:'approved', notes:'Looks great' },
  { id:5, client:'East Side Brewing', file:'esb_hop_design.pdf', uploaded:'5d ago', status:'rejected', notes:'Resolution too low — need 300dpi' },
];

const MOCK_MESSAGES = [
  { id:1, client:'East Side Brewing Co.', msg:'When will our order ship?', time:'45m ago', read:false, thread:[
    { from:'client', text:'Hey! Just checking in on order #1048. When will it ship?', time:'45m ago' },
  ]},
  { id:2, client:'Riverside Youth Sports', msg:'Can we add 10 more shirts?', time:'2h ago', read:false, thread:[
    { from:'client', text:'Hi, is it too late to add 10 more shirts to order #1042?', time:'2h ago' },
  ]},
  { id:3, client:'Summit CrossFit', msg:'Thanks for the fast turnaround!', time:'4d ago', read:true, thread:[
    { from:'client', text:'Just got the hoodies. They look amazing, thank you!', time:'4d ago' },
    { from:'admin', text:'So glad you love them! Let us know when you need the next batch.', time:'4d ago' },
  ]},
];

const STATUS_COLORS = {
  new:      { bg:'#dbeafe', color:'#1e40af' },
  printing: { bg:'#fef3c7', color:'#92400e' },
  review:   { bg:'#ede9fe', color:'#5b21b6' },
  shipped:  { bg:'#d1fae5', color:'#065f46' },
  overdue:  { bg:'#fee2e2', color:'#991b1b' },
  active:   { bg:'#d1fae5', color:'#065f46' },
  vip:      { bg:'#fef3c7', color:'#92400e' },
  pending:  { bg:'#fef3c7', color:'#92400e' },
  paid:     { bg:'#d1fae5', color:'#065f46' },
  approved: { bg:'#d1fae5', color:'#065f46' },
  rejected: { bg:'#fee2e2', color:'#991b1b' },
  low:      { bg:'#fef3c7', color:'#92400e' },
  critical: { bg:'#fee2e2', color:'#991b1b' },
  ok:       { bg:'#d1fae5', color:'#065f46' },
};

const NAV = [
  { id:'dashboard', icon:'📊', label:'Dashboard' },
  { id:'alerts',    icon:'🔔', label:'Alerts', badge: MOCK_ALERTS.filter(a=>a.level!=='info').length },
  { id:'clients',   icon:'👥', label:'Clients' },
  { id:'messages',  icon:'💬', label:'Messages', badge: MOCK_MESSAGES.filter(m=>!m.read).length },
  { id:'orders',    icon:'📦', label:'Orders' },
  { id:'products',  icon:'🏷️', label:'Products' },
  { id:'artwork',   icon:'🎨', label:'Artwork', badge: MOCK_ARTWORK.filter(a=>a.status==='pending').length },
  { id:'billing',   icon:'💰', label:'Billing' },
  { id:'inventory', icon:'📋', label:'Inventory' },
  { id:'orderdesk', icon:'🚚', label:'Order Desk' },
  { id:'settings',  icon:'⚙️', label:'Settings' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [section, setSection]   = useState('dashboard');
  const [alerts, setAlerts]     = useState(MOCK_ALERTS);
  const [clients, setClients]   = useState(MOCK_CLIENTS);
  const [orders, setOrders]     = useState(MOCK_ORDERS);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [artwork, setArtwork]   = useState(MOCK_ARTWORK);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [activeMsg, setActiveMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [newNote, setNewNote]   = useState('');
  const [discountClient, setDiscountClient] = useState(null);
  const [discountAmt, setDiscountAmt] = useState('');
  const [discountType, setDiscountType] = useState('percent');

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setAuthed(true);
    else { setAuthError('Incorrect password.'); setPassword(''); }
  }

  function dismissAlert(id) {
    setAlerts(a => a.filter(x => x.id !== id));
  }

  function updateOrderStatus(id, status) {
    setOrders(o => o.map(x => x.id === id ? {...x, status, urgent: status==='overdue'} : x));
  }

  function waiveInvoice(id) {
    setInvoices(i => i.map(x => x.id === id ? {...x, waived:true, status:'waived'} : x));
  }

  function markInvoicePaid(id) {
    setInvoices(i => i.map(x => x.id === id ? {...x, status:'paid'} : x));
  }

  function applyDiscount() {
    if (!discountClient || !discountAmt) return;
    alert(`Discount applied: ${discountAmt}${discountType==='percent'?'%':'$'} off for ${discountClient}`);
    setDiscountClient(null);
    setDiscountAmt('');
  }

  function approveArtwork(id) {
    setArtwork(a => a.map(x => x.id===id ? {...x, status:'approved'} : x));
  }

  function rejectArtwork(id, note) {
    setArtwork(a => a.map(x => x.id===id ? {...x, status:'rejected', notes:note||'Rejected by admin'} : x));
  }

  function sendReply() {
    if (!replyText.trim() || activeMsg===null) return;
    setMessages(m => m.map((x,i) => i===activeMsg
      ? {...x, thread:[...x.thread, {from:'admin', text:replyText, time:'just now'}], read:true}
      : x
    ));
    setReplyText('');
  }

  function saveClientNote(id) {
    setClients(c => c.map(x => x.id===id ? {...x, notes:newNote} : x));
    setNewNote('');
    setSelectedClient(null);
  }

  const urgentCount = alerts.filter(a => a.level==='urgent').length;
  const actionCount = alerts.filter(a => a.level==='action').length;

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={s.loginBg}>
      <div style={s.loginCard}>
        <div style={{fontSize:40, marginBottom:12}}>⚡</div>
        <h1 style={s.loginTitle}>S&A Admin</h1>
        <p style={s.loginSub}>Command Center · Staff Only</p>
        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:10}}>
          <input type="password" placeholder="Admin password" value={password}
            onChange={e=>setPassword(e.target.value)} style={s.loginInput} autoFocus/>
          {authError && <p style={{color:'#f87171',fontSize:13,margin:0}}>{authError}</p>}
          <button type="submit" style={s.loginBtn}>Enter Admin</button>
        </form>
      </div>
    </div>
  );

  // ── Admin Shell ────────────────────────────────────────────────────────────
  return (
    <div style={s.shell}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        input:focus, textarea:focus, select:focus { outline: 2px solid #e8a020; outline-offset: -1px; }
      `}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logo}>
            <span style={{fontSize:20}}>⚡</span>
            <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>S&A Admin</span>
          </div>
          {urgentCount > 0 && (
            <div style={s.urgentBanner}>
              🔴 {urgentCount} urgent item{urgentCount>1?'s':''} need attention
            </div>
          )}
        </div>

        <nav style={s.nav}>
          {NAV.map(item => (
            <button key={item.id} onClick={()=>setSection(item.id)}
              style={{...s.navBtn,...(section===item.id?s.navBtnActive:{})}}>
              <span style={{fontSize:16}}>{item.icon}</span>
              <span style={{flex:1,textAlign:'left'}}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{...s.navBadge,...(item.id==='alerts'&&urgentCount>0?{background:'#dc2626'}:{})}}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <a href="/dashboard" style={s.portalLink}>← Client Portal</a>
          <button onClick={()=>setAuthed(false)} style={s.signOutBtn}>Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={s.main}>

        {/* ── DASHBOARD ── */}
        {section==='dashboard' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Dashboard</h1>
            <p style={s.pageSub}>Good morning — here's what's happening today.</p>

            {urgentCount > 0 && (
              <div style={s.alertBanner}>
                <span>🔴</span>
                <span><strong>{urgentCount} urgent alert{urgentCount>1?'s':''}</strong> require your immediate attention.</span>
                <button onClick={()=>setSection('alerts')} style={s.alertBannerBtn}>View Alerts →</button>
              </div>
            )}

            <div style={s.statsGrid}>
              {[
                { label:'Active Clients', value:clients.length, icon:'👥' },
                { label:'Open Orders', value:orders.filter(o=>o.status!=='shipped').length, icon:'📦' },
                { label:'Pending Artwork', value:artwork.filter(a=>a.status==='pending').length, icon:'🎨' },
                { label:'Unpaid Invoices', value:invoices.filter(i=>i.status==='pending'||i.status==='overdue').length, icon:'💰' },
                { label:'Unread Messages', value:messages.filter(m=>!m.read).length, icon:'💬' },
                { label:'Low Stock Items', value:inventory.filter(i=>i.status!=='ok').length, icon:'📋' },
              ].map(stat => (
                <div key={stat.label} style={s.statCard}>
                  <div style={{fontSize:28,marginBottom:6}}>{stat.icon}</div>
                  <div style={{fontSize:32,fontWeight:700,color:'#111827'}}>{stat.value}</div>
                  <div style={{fontSize:13,color:'#6b7280'}}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={s.dashGrid}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Recent Orders</h3>
                {orders.slice(0,4).map(o => (
                  <div key={o.id} style={s.listRow}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{o.id} · {o.client}</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>{o.items}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <StatusBadge status={o.status}/>
                      <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>${o.total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <button onClick={()=>setSection('orders')} style={s.viewAllBtn}>View all orders →</button>
              </div>

              <div style={s.card}>
                <h3 style={s.cardTitle}>Pending Actions</h3>
                {alerts.filter(a=>a.level!=='info').slice(0,5).map(a => (
                  <div key={a.id} style={s.listRow}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{a.icon} {a.title}</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>{a.detail}</div>
                    </div>
                    <div style={{fontSize:11,color:'#9ca3af',whiteSpace:'nowrap'}}>{a.time}</div>
                  </div>
                ))}
                <button onClick={()=>setSection('alerts')} style={s.viewAllBtn}>View all alerts →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {section==='alerts' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Alerts</h1>
            <p style={s.pageSub}>{alerts.length} active alerts — {urgentCount} urgent, {actionCount} need action</p>

            {['urgent','action','info'].map(level => {
              const levelAlerts = alerts.filter(a=>a.level===level);
              if (!levelAlerts.length) return null;
              return (
                <div key={level} style={{marginBottom:24}}>
                  <h3 style={{fontSize:13,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>
                    {level==='urgent'?'🔴 Urgent':level==='action'?'🟡 Action Needed':'🟢 Info'}
                  </h3>
                  {levelAlerts.map(a => (
                    <div key={a.id} style={{...s.alertRow,...(a.level==='urgent'?{borderLeft:'3px solid #dc2626'}:a.level==='action'?{borderLeft:'3px solid #f59e0b'}:{borderLeft:'3px solid #10b981'})}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{a.title}</div>
                        <div style={{fontSize:13,color:'#6b7280',marginTop:2}}>{a.detail}</div>
                        <div style={{fontSize:11,color:'#9ca3af',marginTop:4}}>{a.time}</div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <button onClick={()=>setSection(a.section)} style={s.alertActionBtn}>Go →</button>
                        <button onClick={()=>dismissAlert(a.id)} style={s.alertDismissBtn}>Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {!alerts.length && <div style={s.emptyState}>✅ All clear — no alerts!</div>}
          </div>
        )}

        {/* ── CLIENTS ── */}
        {section==='clients' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Clients</h1>
            <p style={s.pageSub}>{clients.length} clients on your roster</p>

            {clients.map(c => (
              <div key={c.id} style={s.clientCard}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:16,fontWeight:700,color:'#111827'}}>{c.name}</span>
                      <StatusBadge status={c.status}/>
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>{c.email} · {c.phone}</div>
                    <div style={{fontSize:13,color:'#6b7280',marginTop:2}}>{c.orders} orders · Last order {c.lastOrder}</div>
                    {c.notes && <div style={{fontSize:12,color:'#92400e',background:'#fef3c7',padding:'4px 8px',borderRadius:4,marginTop:6,display:'inline-block'}}>{c.notes}</div>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:20,fontWeight:700,color:c.balance>0?'#dc2626':'#059669'}}>${c.balance.toFixed(2)}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>{c.balance>0?'balance due':'paid up'}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                  <button onClick={()=>{setActiveMsg(messages.findIndex(m=>m.client===c.name));setSection('messages');}} style={s.clientActionBtn}>💬 Message</button>
                  <button onClick={()=>{setSection('billing');}} style={s.clientActionBtn}>💰 Billing</button>
                  <button onClick={()=>{setDiscountClient(c.name);}} style={s.clientActionBtn}>🏷️ Apply Discount</button>
                  <button onClick={()=>{setSelectedClient(c.id);setNewNote(c.notes);}} style={s.clientActionBtn}>📝 Edit Note</button>
                </div>
                {selectedClient===c.id && (
                  <div style={{marginTop:12,display:'flex',gap:8}}>
                    <input value={newNote} onChange={e=>setNewNote(e.target.value)}
                      style={{...s.inp,flex:1}} placeholder="Add a note about this client…"/>
                    <button onClick={()=>saveClientNote(c.id)} style={s.saveSmBtn}>Save</button>
                    <button onClick={()=>setSelectedClient(null)} style={s.cancelSmBtn}>Cancel</button>
                  </div>
                )}
                {discountClient===c.name && (
                  <div style={{marginTop:12,background:'#f9fafb',padding:12,borderRadius:8,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontSize:13,fontWeight:600}}>Apply discount to {c.name}:</span>
                    <input type="number" value={discountAmt} onChange={e=>setDiscountAmt(e.target.value)}
                      style={{...s.inp,width:80}} placeholder="10"/>
                    <select value={discountType} onChange={e=>setDiscountType(e.target.value)} style={s.inp}>
                      <option value="percent">%</option>
                      <option value="dollar">$</option>
                    </select>
                    <button onClick={applyDiscount} style={s.saveSmBtn}>Apply</button>
                    <button onClick={()=>setDiscountClient(null)} style={s.cancelSmBtn}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {section==='messages' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Messages</h1>
            <p style={s.pageSub}>{messages.filter(m=>!m.read).length} unread conversations</p>
            <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16,minHeight:500}}>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {messages.map((m,i) => (
                  <button key={m.id} onClick={()=>{setActiveMsg(i);setMessages(msgs=>msgs.map((x,j)=>j===i?{...x,read:true}:x));}}
                    style={{...s.msgThread,...(activeMsg===i?{background:'#1a1a2e',color:'#fff'}:{})}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:600}}>{m.client}</span>
                      {!m.read && <span style={{width:8,height:8,background:'#e8a020',borderRadius:'50%',flexShrink:0,marginTop:3}}/>}
                    </div>
                    <div style={{fontSize:12,color:activeMsg===i?'#d1d5db':'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.msg}</div>
                    <div style={{fontSize:11,color:activeMsg===i?'#9ca3af':'#9ca3af',marginTop:2}}>{m.time}</div>
                  </button>
                ))}
              </div>
              <div style={s.card}>
                {activeMsg !== null ? (
                  <>
                    <h3 style={s.cardTitle}>{messages[activeMsg].client}</h3>
                    <div style={{flex:1,overflowY:'auto',marginBottom:12,display:'flex',flexDirection:'column',gap:10}}>
                      {messages[activeMsg].thread.map((t,i) => (
                        <div key={i} style={{display:'flex',justifyContent:t.from==='admin'?'flex-end':'flex-start'}}>
                          <div style={{maxWidth:'75%',padding:'8px 12px',borderRadius:10,fontSize:13,
                            background:t.from==='admin'?'#1a1a2e':'#f3f4f6',
                            color:t.from==='admin'?'#fff':'#111827'}}>
                            {t.text}
                            <div style={{fontSize:10,opacity:0.6,marginTop:4,textAlign:t.from==='admin'?'right':'left'}}>{t.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <input value={replyText} onChange={e=>setReplyText(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&sendReply()}
                        style={{...s.inp,flex:1}} placeholder="Type a reply…"/>
                      <button onClick={sendReply} style={s.saveSmBtn}>Send</button>
                    </div>
                  </>
                ) : (
                  <div style={s.emptyState}>Select a conversation to view messages</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {section==='orders' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Orders</h1>
            <p style={s.pageSub}>{orders.length} orders · {orders.filter(o=>o.urgent).length} urgent</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {orders.map(o => (
                <div key={o.id} style={{...s.card,...(o.urgent?{borderLeft:'3px solid #dc2626'}:{})}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:700,color:'#111827'}}>{o.id}</span>
                        <StatusBadge status={o.status}/>
                        {o.urgent && <span style={{fontSize:11,background:'#fee2e2',color:'#991b1b',padding:'2px 6px',borderRadius:4,fontWeight:600}}>URGENT</span>}
                      </div>
                      <div style={{fontSize:13,color:'#374151',fontWeight:500}}>{o.client}</div>
                      <div style={{fontSize:13,color:'#6b7280'}}>{o.items}</div>
                      <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{o.date}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:20,fontWeight:700,color:'#111827'}}>${o.total.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                    {['new','printing','review','shipped'].map(st => (
                      <button key={st} onClick={()=>updateOrderStatus(o.id,st)}
                        style={{...s.clientActionBtn,...(o.status===st?{background:'#1a1a2e',color:'#fff'}:{})}}>
                        {st.charAt(0).toUpperCase()+st.slice(1)}
                      </button>
                    ))}
                    <button onClick={()=>{setSection('messages');setActiveMsg(messages.findIndex(m=>m.client===o.client));}}
                      style={s.clientActionBtn}>💬 Message Client</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {section==='products' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Products</h1>
            <p style={s.pageSub}>Manage your product catalog</p>
            <div style={{display:'flex',gap:12,marginBottom:20}}>
              <a href="/admin/products" style={s.primaryBtn}>+ Upload New Product with AI</a>
            </div>
            <div style={s.card}>
              <p style={{color:'#6b7280',fontSize:14}}>
                Your saved products will appear here. Use the AI upload tool to add products — Claude will automatically fill in all details from a photo.
              </p>
              <div style={{marginTop:16,padding:20,background:'#f9fafb',borderRadius:8,textAlign:'center',color:'#9ca3af',fontSize:14}}>
                No products saved yet — click "Upload New Product with AI" above to get started.
              </div>
            </div>
          </div>
        )}

        {/* ── ARTWORK ── */}
        {section==='artwork' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Artwork Review</h1>
            <p style={s.pageSub}>{artwork.filter(a=>a.status==='pending').length} files pending approval</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {artwork.map(a => (
                <div key={a.id} style={{...s.card,...(a.status==='pending'?{borderLeft:'3px solid #f59e0b'}:{})}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:14,fontWeight:600,color:'#111827'}}>🎨 {a.file}</span>
                        <StatusBadge status={a.status}/>
                      </div>
                      <div style={{fontSize:13,color:'#6b7280'}}>{a.client} · Uploaded {a.uploaded}</div>
                      {a.notes && <div style={{fontSize:12,color:'#92400e',marginTop:4}}>{a.notes}</div>}
                    </div>
                    {a.status==='pending' && (
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>approveArtwork(a.id)} style={{...s.saveSmBtn,background:'#059669'}}>✓ Approve</button>
                        <button onClick={()=>rejectArtwork(a.id,'Resolution too low — need 300dpi')} style={{...s.saveSmBtn,background:'#dc2626'}}>✗ Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BILLING ── */}
        {section==='billing' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Billing</h1>
            <p style={s.pageSub}>Manage invoices, fees, and discounts</p>

            <div style={s.statsGrid}>
              {[
                { label:'Total Outstanding', value:'$'+invoices.filter(i=>i.status==='pending'||i.status==='overdue').reduce((sum,i)=>sum+i.amount,0).toFixed(2), icon:'💰' },
                { label:'Overdue', value:'$'+invoices.filter(i=>i.status==='overdue').reduce((sum,i)=>sum+i.amount,0).toFixed(2), icon:'🔴' },
                { label:'Paid This Month', value:'$'+invoices.filter(i=>i.status==='paid').reduce((sum,i)=>sum+i.amount,0).toFixed(2), icon:'✅' },
              ].map(stat=>(
                <div key={stat.label} style={s.statCard}>
                  <div style={{fontSize:24,marginBottom:6}}>{stat.icon}</div>
                  <div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{stat.value}</div>
                  <div style={{fontSize:13,color:'#6b7280'}}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Invoices</h3>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:'1px solid #e5e7eb'}}>
                    {['Invoice','Client','Amount','Issued','Due','Status','Actions'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',color:'#6b7280',fontWeight:600,fontSize:12}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv=>(
                    <tr key={inv.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'10px 10px',fontWeight:600,color:'#111827'}}>{inv.id}</td>
                      <td style={{padding:'10px 10px',color:'#374151'}}>{inv.client}</td>
                      <td style={{padding:'10px 10px',fontWeight:600}}>${inv.amount.toFixed(2)}</td>
                      <td style={{padding:'10px 10px',color:'#6b7280'}}>{inv.issued}</td>
                      <td style={{padding:'10px 10px',color:'#6b7280'}}>{inv.due}</td>
                      <td style={{padding:'10px 10px'}}><StatusBadge status={inv.waived?'waived':inv.status}/></td>
                      <td style={{padding:'10px 10px'}}>
                        {inv.status!=='paid' && !inv.waived && (
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>markInvoicePaid(inv.id)} style={{...s.clientActionBtn,fontSize:11}}>Mark Paid</button>
                            <button onClick={()=>waiveInvoice(inv.id)} style={{...s.clientActionBtn,fontSize:11,color:'#dc2626'}}>Waive Fee</button>
                          </div>
                        )}
                        {inv.waived && <span style={{fontSize:12,color:'#6b7280'}}>Fee waived</span>}
                        {inv.status==='paid' && !inv.waived && <span style={{fontSize:12,color:'#059669'}}>Paid ✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Apply Discount to Client</h3>
              <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
                <div>
                  <label style={s.label}>Client</label>
                  <select style={s.inp} value={discountClient||''} onChange={e=>setDiscountClient(e.target.value)}>
                    <option value="">Select client…</option>
                    {clients.map(c=><option key={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Amount</label>
                  <input type="number" style={{...s.inp,width:100}} value={discountAmt} onChange={e=>setDiscountAmt(e.target.value)} placeholder="10"/>
                </div>
                <div>
                  <label style={s.label}>Type</label>
                  <select style={s.inp} value={discountType} onChange={e=>setDiscountType(e.target.value)}>
                    <option value="percent">Percent (%)</option>
                    <option value="dollar">Dollar ($)</option>
                  </select>
                </div>
                <button onClick={applyDiscount} style={s.primaryBtn}>Apply Discount</button>
              </div>
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {section==='inventory' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Inventory</h1>
            <p style={s.pageSub}>{inventory.filter(i=>i.status!=='ok').length} items need attention</p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {inventory.map(item=>(
                <div key={item.id} style={{...s.card,...(item.status==='critical'?{borderLeft:'3px solid #dc2626'}:item.status==='low'?{borderLeft:'3px solid #f59e0b'}:{})}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:14,fontWeight:600,color:'#111827'}}>{item.name}</span>
                        <StatusBadge status={item.status}/>
                      </div>
                      <div style={{fontSize:13,color:'#6b7280'}}>SKU: {item.sku} · Min stock: {item.min} units</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:28,fontWeight:700,color:item.status==='critical'?'#dc2626':item.status==='low'?'#f59e0b':'#059669'}}>{item.qty}</div>
                      <div style={{fontSize:11,color:'#6b7280'}}>units in stock</div>
                    </div>
                  </div>
                  <div style={{marginTop:10,background:'#f3f4f6',borderRadius:6,height:6,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.min(100,(item.qty/Math.max(item.min*2,item.qty))*100)}%`,
                      background:item.status==='critical'?'#dc2626':item.status==='low'?'#f59e0b':'#059669',
                      borderRadius:6,transition:'width 0.3s'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ORDER DESK ── */}
        {section==='orderdesk' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Order Desk</h1>
            <p style={s.pageSub}>Webhook connection & incoming order feed</p>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Webhook Status</h3>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:10,height:10,background:'#10b981',borderRadius:'50%',animation:'pulse 2s infinite'}}/>
                <span style={{fontSize:14,fontWeight:600,color:'#059669'}}>Connected — Order Desk sync active</span>
                <span style={{fontSize:12,color:'#6b7280'}}>Last ping: 4 minutes ago</span>
              </div>
              <div style={{background:'#f9fafb',borderRadius:8,padding:16}}>
                <div style={{fontSize:12,fontWeight:600,color:'#6b7280',marginBottom:8}}>Webhook URL</div>
                <div style={{fontFamily:'monospace',fontSize:12,color:'#374151',background:'#fff',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb',wordBreak:'break-all'}}>
                  https://sanda-portal.vercel.app/api/webhooks/orderdesk
                </div>
              </div>
              <div style={{marginTop:12,display:'flex',gap:8}}>
                <button style={s.clientActionBtn}>Test Webhook</button>
                <button style={s.clientActionBtn}>View Logs</button>
                <button style={s.clientActionBtn}>Reconnect</button>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Recent Incoming Orders</h3>
              {orders.map(o=>(
                <div key={o.id} style={s.listRow}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{o.id} · {o.client}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>{o.items}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <StatusBadge status={o.status}/>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>{o.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {section==='settings' && (
          <div style={s.section}>
            <h1 style={s.pageTitle}>Settings</h1>
            <p style={s.pageSub}>Portal configuration & preferences</p>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Admin Access</h3>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={s.label}>Admin Password</label>
                  <div style={{display:'flex',gap:8}}>
                    <input type="password" placeholder="New password" style={{...s.inp,flex:1}}/>
                    <button style={s.saveSmBtn}>Update</button>
                  </div>
                </div>
                <div>
                  <label style={s.label}>Admin Email (for alerts)</label>
                  <div style={{display:'flex',gap:8}}>
                    <input type="email" placeholder="admin@sascreenprinting.com" style={{...s.inp,flex:1}}/>
                    <button style={s.saveSmBtn}>Save</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Notifications</h3>
              {[
                'Email me on new orders',
                'Email me on new client messages',
                'Email me when artwork is uploaded',
                'Email me when inventory is low',
                'Email me when invoices are overdue',
              ].map(pref=>(
                <label key={pref} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #f3f4f6',cursor:'pointer',fontSize:14,color:'#374151'}}>
                  <input type="checkbox" defaultChecked style={{width:16,height:16}}/>
                  {pref}
                </label>
              ))}
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Business Info</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[
                  ['Business Name','S&A Screen Printing'],
                  ['Phone','(973) 555-0100'],
                  ['Email','info@sascreenprinting.com'],
                  ['Address','123 Print Ave, Newark NJ'],
                  ['Tax Rate (%)','7'],
                  ['Default Net Terms','30'],
                ].map(([label,placeholder])=>(
                  <div key={label}>
                    <label style={s.label}>{label}</label>
                    <input style={s.inp} defaultValue={placeholder}/>
                  </div>
                ))}
              </div>
              <button style={{...s.primaryBtn,marginTop:16}}>Save Business Info</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg:'#f3f4f6', color:'#6b7280' };
  return (
    <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>
      {status}
    </span>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  loginBg:      { minHeight:'100vh',background:'#0f0f1a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif" },
  loginCard:    { background:'#1a1a2e',border:'1px solid rgba(232,160,32,0.2)',borderRadius:16,padding:'44px 40px',width:320,textAlign:'center' },
  loginTitle:   { color:'#fff',fontSize:22,fontWeight:700,margin:'0 0 4px' },
  loginSub:     { color:'#6b7280',fontSize:13,marginBottom:28 },
  loginInput:   { width:'100%',padding:'11px 14px',background:'#0f0f1a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff',fontSize:14,textAlign:'center',outline:'none',fontFamily:'inherit',boxSizing:'border-box' },
  loginBtn:     { width:'100%',padding:'12px 0',background:'#e8a020',color:'#1a1a2e',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer' },
  shell:        { display:'flex',minHeight:'100vh',fontFamily:"'Inter',sans-serif",background:'#f3f4f6' },
  sidebar:      { width:220,background:'#1a1a2e',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50,overflowY:'auto' },
  sidebarTop:   { padding:'16px 12px 8px' },
  logo:         { display:'flex',alignItems:'center',gap:8,padding:'8px 8px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',marginBottom:8 },
  urgentBanner: { background:'rgba(220,38,38,0.15)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:6,padding:'6px 10px',fontSize:11,color:'#fca5a5',lineHeight:1.4 },
  nav:          { flex:1,padding:'4px 8px',display:'flex',flexDirection:'column',gap:2 },
  navBtn:       { display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:8,background:'transparent',border:'none',color:'#9ca3af',fontSize:13,cursor:'pointer',width:'100%',transition:'all 0.15s' },
  navBtnActive: { background:'rgba(232,160,32,0.15)',color:'#e8a020' },
  navBadge:     { background:'#374151',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10,minWidth:18,textAlign:'center' },
  sidebarBottom:{ padding:'12px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',gap:8 },
  portalLink:   { color:'#6b7280',fontSize:12,textDecoration:'none',textAlign:'center' },
  signOutBtn:   { background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#6b7280',padding:'6px',borderRadius:6,fontSize:12,cursor:'pointer' },
  main:         { flex:1,marginLeft:220,overflowY:'auto',minHeight:'100vh' },
  section:      { padding:'28px 28px',maxWidth:1100 },
  pageTitle:    { fontSize:24,fontWeight:700,color:'#111827',margin:'0 0 4px' },
  pageSub:      { fontSize:14,color:'#6b7280',marginBottom:24 },
  alertBanner:  { display:'flex',alignItems:'center',gap:12,background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:14,color:'#991b1b' },
  alertBannerBtn:{ marginLeft:'auto',background:'#dc2626',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,fontWeight:600,cursor:'pointer' },
  statsGrid:    { display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:24 },
  statCard:     { background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:'16px',textAlign:'center' },
  dashGrid:     { display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 },
  card:         { background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:20,marginBottom:16 },
  cardTitle:    { fontSize:15,fontWeight:600,color:'#111827',marginBottom:14,marginTop:0 },
  listRow:      { display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f3f4f6',gap:12 },
  viewAllBtn:   { background:'none',border:'none',color:'#e8a020',fontSize:13,cursor:'pointer',padding:'8px 0',fontWeight:500 },
  alertRow:     { background:'#fff',borderRadius:8,border:'1px solid #e5e7eb',padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:16 },
  alertActionBtn:{ background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' },
  alertDismissBtn:{ background:'transparent',border:'1px solid #d1d5db',color:'#6b7280',borderRadius:6,padding:'5px 10px',fontSize:12,cursor:'pointer' },
  clientCard:   { background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:20,marginBottom:14 },
  clientActionBtn:{ background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:6,padding:'5px 12px',fontSize:12,fontWeight:500,cursor:'pointer',color:'#374151' },
  msgThread:    { background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:'12px',textAlign:'left',cursor:'pointer',transition:'all 0.15s' },
  inp:          { padding:'7px 9px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,color:'#111827',background:'#fff',fontFamily:'inherit' },
  label:        { display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.4,marginBottom:5 },
  saveSmBtn:    { padding:'7px 14px',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' },
  cancelSmBtn:  { padding:'7px 14px',background:'transparent',border:'1px solid #d1d5db',color:'#6b7280',borderRadius:6,fontSize:13,cursor:'pointer' },
  primaryBtn:   { padding:'9px 18px',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',textDecoration:'none',display:'inline-block' },
  emptyState:   { textAlign:'center',padding:'40px',color:'#9ca3af',fontSize:14 },
};
