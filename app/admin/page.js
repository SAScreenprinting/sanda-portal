'use client';
import { useState, useEffect, useRef } from 'react';
import { DEFAULT_PRODUCTS, toAdminFormat } from '@/lib/products';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sanda2024admin';
const TAX_RATE = 0.07;

const INIT_CLIENTS = [
  { id:1, name:'Riverside Youth Sports', email:'coach@riversidefc.com', phone:'(201) 555-0182', orders:12, balance:245.00, status:'active', lastOrder:'2d ago', notes:'Prefers rush orders. Net 30.' },
  { id:2, name:'East Side Brewing Co.',  email:'merch@eastsidebrew.com', phone:'(973) 555-0134', orders:8,  balance:0,      status:'active', lastOrder:'1w ago', notes:'Always pays on time.' },
  { id:3, name:'Lakewood FC',            email:'admin@lakewoodfc.com',   phone:'(732) 555-0199', orders:5,  balance:180.00, status:'active', lastOrder:'3d ago', notes:'Youth league — discount applied.' },
  { id:4, name:'Northside Academy',      email:'office@northside.edu',   phone:'(201) 555-0167', orders:3,  balance:342.00, status:'new',    lastOrder:'1h ago',  notes:'' },
  { id:5, name:'Summit CrossFit',        email:'hello@summitcf.com',     phone:'(908) 555-0211', orders:15, balance:0,      status:'vip',    lastOrder:'4d ago',  notes:'VIP — 10% standing discount.' },
];

const INIT_ORDERS = [
  { id:'#1051', client:'Northside Academy',      items:'24x T-Shirts, Front Print',  total:342.00, status:'new',      date:'1h ago',  urgent:false, discount:0 },
  { id:'#1050', client:'Summit CrossFit',        items:'48x Hoodies, Full Back',      total:876.00, status:'printing', date:'2d ago',  urgent:false, discount:10 },
  { id:'#1049', client:'Lakewood FC',            items:'36x Jerseys, Name+Number',   total:540.00, status:'review',   date:'3d ago',  urgent:false, discount:0 },
  { id:'#1048', client:'East Side Brewing Co.',  items:'60x T-Shirts, 2-color',      total:480.00, status:'shipped',  date:'1w ago',  urgent:false, discount:0 },
  { id:'#1042', client:'Riverside Youth Sports', items:'100x T-Shirts, 3-color',     total:950.00, status:'overdue',  date:'12d ago', urgent:true,  discount:0 },
];

const INIT_INVOICES = [
  { id:'INV-093', client:'Northside Academy',      amount:342.00, issued:'2026-05-10', due:'2026-06-09', status:'pending', items:[{desc:'24x T-Shirts, Front Print',qty:24,price:10.50},{desc:'Setup fee',qty:1,price:90.00}], note:'' },
  { id:'INV-091', client:'Lakewood FC',            amount:180.00, issued:'2026-04-10', due:'2026-05-10', status:'overdue', items:[{desc:'36x Jerseys',qty:36,price:5.00}], note:'' },
  { id:'INV-089', client:'East Side Brewing Co.',  amount:480.00, issued:'2026-04-02', due:'2026-05-02', status:'paid',    items:[{desc:'60x T-Shirts',qty:60,price:8.00}], note:'' },
  { id:'INV-090', client:'Summit CrossFit',        amount:876.00, issued:'2026-04-08', due:'2026-05-08', status:'paid',    items:[{desc:'48x Hoodies',qty:48,price:18.25}], note:'' },
  { id:'INV-088', client:'Riverside Youth Sports', amount:245.00, issued:'2026-03-28', due:'2026-04-27', status:'overdue', items:[{desc:'100x T-Shirts',qty:100,price:2.45}], note:'' },
  { id:'INV-085', client:'Summit CrossFit',        amount:320.00, issued:'2026-02-15', due:'2026-03-15', status:'paid',    items:[{desc:'24x Polos',qty:24,price:13.33}], note:'' },
  { id:'INV-081', client:'East Side Brewing Co.',  amount:210.00, issued:'2026-01-20', due:'2026-02-19', status:'paid',    items:[{desc:'30x Tank Tops',qty:30,price:7.00}], note:'' },
  { id:'INV-079', client:'Riverside Youth Sports', amount:540.00, issued:'2025-12-05', due:'2026-01-04', status:'paid',    items:[{desc:'60x Hoodies',qty:60,price:9.00}], note:'' },
];

const INIT_INVENTORY = [
  { id:1, sku:'PC54-WHT', name:'Port & Company PC54 White', qty:12, min:24, status:'low' },
  { id:2, sku:'PC54-BLK', name:'Port & Company PC54 Black', qty:88, min:24, status:'ok' },
  { id:3, sku:'PC78H-NVY', name:'PC78H Navy Hoodie',        qty:34, min:12, status:'ok' },
  { id:4, sku:'NF0A3LHB',  name:'New Era Snapback Black',   qty:5,  min:12, status:'critical' },
  { id:5, sku:'ST850-GRY', name:'Sport-Tek ST850 Gray',     qty:60, min:24, status:'ok' },
];

const INIT_ARTWORK = [
  { id:1, client:'Lakewood FC',       file:'lfc_jersey_front_v2.ai', uploaded:'3h ago', status:'pending',  notes:'' },
  { id:2, client:'Lakewood FC',       file:'lfc_jersey_back_v2.ai',  uploaded:'3h ago', status:'pending',  notes:'' },
  { id:3, client:'Lakewood FC',       file:'lfc_sleeve_patch.ai',    uploaded:'3h ago', status:'pending',  notes:'' },
  { id:4, client:'Summit CrossFit',   file:'scf_logo_final.svg',     uploaded:'2d ago', status:'approved', notes:'Looks great' },
  { id:5, client:'East Side Brewing', file:'esb_hop_design.pdf',     uploaded:'5d ago', status:'rejected', notes:'Need 300dpi' },
];

const INIT_MESSAGES = [
  { id:1, client:'East Side Brewing Co.',  msg:'When will our order ship?',      time:'45m ago', read:false, thread:[{from:'client',text:'Just checking on order #1048 — when does it ship?',time:'45m ago'}] },
  { id:2, client:'Riverside Youth Sports', msg:'Can we add 10 more shirts?',     time:'2h ago',  read:false, thread:[{from:'client',text:'Is it too late to add 10 more shirts to #1042?',time:'2h ago'}] },
  { id:3, client:'Summit CrossFit',        msg:'Thanks for the fast turnaround!',time:'4d ago',  read:true,  thread:[{from:'client',text:'Just got the hoodies — they look amazing!',time:'4d ago'},{from:'admin',text:"So glad you love them! Let us know for the next batch.",time:'4d ago'}] },
];

const INIT_ALERTS = [
  { id:1, level:'urgent', title:'Order #1042 overdue',        detail:'Print deadline passed 2 days ago',              section:'orders' },
  { id:2, level:'urgent', title:'Payment past due',           detail:'Riverside Youth Sports — INV-088 overdue 5 days',section:'billing' },
  { id:3, level:'action', title:'Artwork needs approval',     detail:'Lakewood FC uploaded 3 files',                  section:'artwork' },
  { id:4, level:'action', title:'Low inventory',              detail:'PC54 White — only 12 units left',               section:'inventory' },
  { id:5, level:'action', title:'New client message',         detail:'East Side Brewing: "When will our order ship?"', section:'messages' },
  { id:6, level:'info',   title:'New order received',         detail:'Order #1051 from Northside Academy — $342.00',  section:'orders' },
  { id:7, level:'info',   title:'Webhook connected',          detail:'Order Desk sync active — last ping 4 min ago',  section:'orderdesk' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PRODUCT_KEY = 'sanda_products';
const PRODUCT_CATEGORIES = ['T-Shirts','Hoodies','Sweatshirts','Polos','Jackets','Hats','Beanies','Bags','Other'];
const DECORATION_OPTIONS = ['Screen Print','Embroidery','DTG','Sublimation','Heat Transfer','Vinyl'];
const BLANK_PRODUCT = { name:'', brand:'', sku:'', category:'T-Shirts', price:'', colors:'', printAreas:'', decorations:[], frontImage:'', backImage:'' };
const NAV = [
  { id:'dashboard', icon:'📊', label:'Dashboard' },
  { id:'alerts',    icon:'🔔', label:'Alerts' },
  { id:'clients',   icon:'👥', label:'Clients' },
  { id:'requests',  icon:'📋', label:'Requests' },
  { id:'messages',  icon:'💬', label:'Messages' },
  { id:'orders',    icon:'📦', label:'Orders' },
  { id:'products',  icon:'🏷️', label:'Products' },
  { id:'artwork',   icon:'🎨', label:'Artwork' },
  { id:'billing',   icon:'💰', label:'Billing' },
  { id:'inventory', icon:'📋', label:'Inventory' },
  { id:'orderdesk', icon:'🚚', label:'Order Desk' },
  { id:'settings',  icon:'⚙️', label:'Settings' },
];

const SC = {
  new:      {bg:'#dbeafe',color:'#1e40af'},
  printing: {bg:'#fef3c7',color:'#92400e'},
  review:   {bg:'#ede9fe',color:'#5b21b6'},
  shipped:  {bg:'#d1fae5',color:'#065f46'},
  overdue:  {bg:'#fee2e2',color:'#991b1b'},
  active:   {bg:'#d1fae5',color:'#065f46'},
  vip:      {bg:'#fef3c7',color:'#92400e'},
  new_c:    {bg:'#dbeafe',color:'#1e40af'},
  pending:  {bg:'#fef3c7',color:'#92400e'},
  paid:     {bg:'#d1fae5',color:'#065f46'},
  waived:   {bg:'#f3f4f6',color:'#6b7280'},
  approved: {bg:'#d1fae5',color:'#065f46'},
  rejected: {bg:'#fee2e2',color:'#991b1b'},
  low:      {bg:'#fef3c7',color:'#92400e'},
  critical: {bg:'#fee2e2',color:'#991b1b'},
  ok:       {bg:'#d1fae5',color:'#065f46'},
};

function Badge({ status, label }) {
  const c = SC[status] || {bg:'#f3f4f6',color:'#6b7280'};
  return <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{label||status}</span>;
}

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [section, setSection]     = useState('dashboard');
  const [alerts, setAlerts]       = useState(INIT_ALERTS);
  const [clients, setClients]     = useState(INIT_CLIENTS);
  const [orders, setOrders]       = useState(INIT_ORDERS);
  const [invoices, setInvoices]   = useState(INIT_INVOICES);
  const [inventory]               = useState(INIT_INVENTORY);
  const [artwork, setArtwork]     = useState(INIT_ARTWORK);
  const [messages, setMessages]   = useState(INIT_MESSAGES);
  const [activeMsg, setActiveMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editNote, setEditNote]   = useState(null);
  const [noteText, setNoteText]   = useState('');

  // Billing state
  const [billingTab, setBillingTab]     = useState('invoices');
  const [previewInv, setPreviewInv]     = useState(null);
  const [newInv, setNewInv]             = useState({ client:'', due:'', note:'' });
  const [lineItems, setLineItems]       = useState([{desc:'',qty:'',price:''}]);
  const [createMsg, setCreateMsg]       = useState('');
  const [reportType, setReportType]     = useState('monthly');
  const [reportYear, setReportYear]     = useState('2026');

  // Requests state
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch('/api/requests/list').then(r => r.json()).then(d => { if (d.requests) setRequests(d.requests); }).catch(()=>{});
  }, []);

  async function updateRequestStatus(id, status) {
    await fetch('/api/requests/list', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) });
    setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
  }

  // Products state
  const [products, setProducts]             = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = new
  const [productForm, setProductForm]       = useState(BLANK_PRODUCT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRODUCT_KEY);
      if (stored === null) {
        // First visit: seed with the default studio catalog
        const seeded = DEFAULT_PRODUCTS.map(toAdminFormat);
        localStorage.setItem(PRODUCT_KEY, JSON.stringify(seeded));
        setProducts(seeded);
      } else {
        setProducts(JSON.parse(stored));
      }
    } catch {}
  }, []);

  function setPF(field, val) { setProductForm(f => ({ ...f, [field]: val })); }

  function handleProductImage(field, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setPF(field, e.target.result);
    reader.readAsDataURL(file);
  }

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(BLANK_PRODUCT);
    setShowProductModal(true);
  }

  function openEditProduct(p) {
    setEditingProduct(p.id);
    setProductForm({ name:p.name, brand:p.brand, sku:p.sku, category:p.category, price:String(p.price), colors:p.colors, printAreas:p.printAreas, decorations:p.decorations||[], frontImage:p.frontImage||'', backImage:p.backImage||'' });
    setShowProductModal(true);
  }

  function saveProduct() {
    if (!productForm.name || !productForm.sku) return;
    const entry = { ...productForm, price: parseFloat(productForm.price) || 0, id: editingProduct || Date.now() };
    let updated;
    if (editingProduct) {
      updated = products.map(p => p.id === editingProduct ? entry : p);
    } else {
      updated = [entry, ...products];
    }
    setProducts(updated);
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(updated));
    setShowProductModal(false);
  }

  function deleteProduct(id) {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(updated));
  }

  function toggleDecoration(val) {
    setPF('decorations', productForm.decorations.includes(val)
      ? productForm.decorations.filter(d => d !== val)
      : [...productForm.decorations, val]);
  }

  // Create client state
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [createClientForm, setCreateClientForm] = useState({ email:'', password:'', business_name:'', contact_name:'', phone:'' });
  const [createClientMsg, setCreateClientMsg] = useState('');
  const [createClientLoading, setCreateClientLoading] = useState(false);

  async function handleCreateClient(e) {
    e.preventDefault();
    setCreateClientLoading(true);
    setCreateClientMsg('');
    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createClientForm),
      });
      const data = await res.json();
      if (!res.ok) { setCreateClientMsg('⚠ ' + data.error); }
      else {
        setCreateClientMsg('✓ Account created! They can log in now.');
        setCreateClientForm({ email:'', password:'', business_name:'', contact_name:'', phone:'' });
        setTimeout(() => { setShowCreateClient(false); setCreateClientMsg(''); }, 2500);
      }
    } catch {
      setCreateClientMsg('⚠ Network error. Try again.');
    }
    setCreateClientLoading(false);
  }

  // Discount state
  const [discountTarget, setDiscountTarget] = useState('client'); // 'client' | 'order'
  const [discountClient, setDiscountClient] = useState('');
  const [discountOrder, setDiscountOrder]   = useState('');
  const [discountAmt, setDiscountAmt]       = useState('');
  const [discountType, setDiscountType]     = useState('percent');
  const [discountMsg, setDiscountMsg]       = useState('');

  function login(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) setAuthed(true);
    else { setPwErr('Incorrect password.'); setPw(''); }
  }

  // Orders
  function updateOrderStatus(id, status) { setOrders(o => o.map(x => x.id===id ? {...x,status,urgent:status==='overdue'} : x)); }

  // Invoices
  function waiveInv(id)    { setInvoices(i => i.map(x => x.id===id ? {...x,status:'waived'} : x)); }
  function markPaid(id)    { setInvoices(i => i.map(x => x.id===id ? {...x,status:'paid'} : x)); }

  // Create invoice
  function setLine(idx,field,val) { setLineItems(l => l.map((x,i) => i===idx ? {...x,[field]:val} : x)); }
  function addLine()    { setLineItems(l => [...l,{desc:'',qty:'',price:''}]); }
  function removeLine(idx) { setLineItems(l => l.filter((_,i)=>i!==idx)); }
  function createInvoice() {
    if (!newInv.client||!newInv.due||lineItems.some(l=>!l.desc||!l.qty||!l.price)) { setCreateMsg('⚠ Fill in all fields.'); return; }
    const items = lineItems.map(l=>({desc:l.desc,qty:Number(l.qty),price:Number(l.price)}));
    const sub = items.reduce((s,i)=>s+i.qty*i.price,0);
    const total = parseFloat((sub*(1+TAX_RATE)).toFixed(2));
    const id = `INV-${100+invoices.length+1}`;
    const today = new Date().toISOString().split('T')[0];
    setInvoices(inv=>[{id,client:newInv.client,amount:total,issued:today,due:newInv.due,status:'pending',items,note:newInv.note},...inv]);
    setCreateMsg(`✓ ${id} created!`);
    setNewInv({client:'',due:'',note:''});
    setLineItems([{desc:'',qty:'',price:''}]);
    setTimeout(()=>setCreateMsg(''),4000);
  }

  // Discounts
  function applyDiscount() {
    if (discountTarget==='client' && !discountClient) { setDiscountMsg('⚠ Select a client.'); return; }
    if (discountTarget==='order' && !discountOrder)   { setDiscountMsg('⚠ Select an order.'); return; }
    if (!discountAmt) { setDiscountMsg('⚠ Enter an amount.'); return; }
    const target = discountTarget==='client' ? discountClient : discountOrder;
    const suffix = discountType==='percent' ? '%' : '$';
    if (discountTarget==='order') {
      setOrders(o => o.map(x => x.id===discountOrder ? {...x, discount:Number(discountAmt)} : x));
    }
    setDiscountMsg(`✓ ${discountAmt}${suffix} discount applied to ${target}`);
    setDiscountClient(''); setDiscountOrder(''); setDiscountAmt('');
    setTimeout(()=>setDiscountMsg(''),4000);
  }

  // Artwork
  function approveArt(id) { setArtwork(a=>a.map(x=>x.id===id?{...x,status:'approved'}:x)); }
  function rejectArt(id)  { setArtwork(a=>a.map(x=>x.id===id?{...x,status:'rejected',notes:'Rejected by admin'}:x)); }

  // Messages
  function sendReply() {
    if (!replyText.trim()||activeMsg===null) return;
    setMessages(m=>m.map((x,i)=>i===activeMsg?{...x,thread:[...x.thread,{from:'admin',text:replyText,time:'just now'}],read:true}:x));
    setReplyText('');
  }

  // Tax reports
  const paidInv = invoices.filter(i=>i.status==='paid');
  const yr = parseInt(reportYear);
  function monthlyData() {
    return MONTHS.map((m,idx)=>{
      const matched = paidInv.filter(i=>{ const d=new Date(i.issued); return d.getFullYear()===yr&&d.getMonth()===idx; });
      const rev = matched.reduce((s,i)=>s+i.amount,0);
      return { label:m, revenue:rev, tax:rev*TAX_RATE, count:matched.length };
    });
  }
  function quarterlyData() {
    return ['Q1 (Jan-Mar)','Q2 (Apr-Jun)','Q3 (Jul-Sep)','Q4 (Oct-Dec)'].map((label,q)=>{
      const months=[0,1,2].map(m=>m+q*3);
      const matched=paidInv.filter(i=>{ const d=new Date(i.issued); return d.getFullYear()===yr&&months.includes(d.getMonth()); });
      const rev=matched.reduce((s,i)=>s+i.amount,0);
      return { label, revenue:rev, tax:rev*TAX_RATE, count:matched.length };
    });
  }
  function yearlyData() {
    const years=[...new Set(paidInv.map(i=>new Date(i.issued).getFullYear()))].sort((a,b)=>b-a);
    return years.map(y=>{ const m=paidInv.filter(i=>new Date(i.issued).getFullYear()===y); const rev=m.reduce((s,i)=>s+i.amount,0); return {label:String(y),revenue:rev,tax:rev*TAX_RATE,count:m.length}; });
  }
  const reportData = reportType==='monthly'?monthlyData():reportType==='quarterly'?quarterlyData():yearlyData();
  const totalRev = reportData.reduce((s,r)=>s+r.revenue,0);
  const totalTax = reportData.reduce((s,r)=>s+r.tax,0);

  const urgentCount = alerts.filter(a=>a.level==='urgent').length;
  const unreadCount = messages.filter(m=>!m.read).length;
  const pendingArt  = artwork.filter(a=>a.status==='pending').length;

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={s.loginBg}>
      <div style={s.loginCard}>
        <div style={{fontSize:40,marginBottom:12}}>⚡</div>
        <h1 style={s.loginTitle}>S&A Admin</h1>
        <p style={s.loginSub}>Command Center · Staff Only</p>
        <form onSubmit={login} style={{display:'flex',flexDirection:'column',gap:10}}>
          <input type="password" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} style={s.loginInput} autoFocus/>
          {pwErr && <p style={{color:'#f87171',fontSize:13,margin:0}}>{pwErr}</p>}
          <button type="submit" style={s.loginBtn}>Enter Admin</button>
        </form>
      </div>
    </div>
  );

  // ── SHELL ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.shell}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#374151;border-radius:2px} input:focus,select:focus,textarea:focus{outline:2px solid #e8a020;outline-offset:-1px} @media print{.no-print{display:none!important}}`}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={{padding:'16px 12px 8px'}}>
          <div style={s.logo}>
            <span style={{fontSize:20}}>⚡</span>
            <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>S&A Admin</span>
          </div>
          {urgentCount>0 && <div style={s.urgentBanner}>🔴 {urgentCount} urgent item{urgentCount>1?'s':''}</div>}
        </div>
        <nav style={s.nav}>
          {NAV.map(item=>{
            const badge = item.id==='alerts'?alerts.filter(a=>a.level!=='info').length:item.id==='messages'?unreadCount:item.id==='artwork'?pendingArt:0;
            return (
              <button key={item.id} onClick={()=>setSection(item.id)} style={{...s.navBtn,...(section===item.id?s.navActive:{})}}>
                <span style={{fontSize:16}}>{item.icon}</span>
                <span style={{flex:1,textAlign:'left'}}>{item.label}</span>
                {badge>0 && <span style={{...s.navBadge,...(item.id==='alerts'&&urgentCount>0?{background:'#dc2626'}:{})}}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={s.sideBottom}>
          <a href="/dashboard" style={{color:'#6b7280',fontSize:12,textDecoration:'none',textAlign:'center'}}>← Client Portal</a>
          <button onClick={()=>setAuthed(false)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#6b7280',padding:'6px',borderRadius:6,fontSize:12,cursor:'pointer'}}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>

        {/* DASHBOARD */}
        {section==='dashboard' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Dashboard</h1>
            <p style={s.sub}>Here's what needs your attention today.</p>
            {urgentCount>0 && <div style={s.alertBanner}>🔴 <strong>{urgentCount} urgent alert{urgentCount>1?'s':''}</strong> need immediate attention. <button onClick={()=>setSection('alerts')} style={s.alertBannerBtn}>View →</button></div>}
            <div style={s.statsGrid}>
              {[
                {label:'Active Clients',   value:clients.length,                                       icon:'👥'},
                {label:'Open Orders',      value:orders.filter(o=>o.status!=='shipped').length,         icon:'📦'},
                {label:'Pending Artwork',  value:pendingArt,                                            icon:'🎨'},
                {label:'Unpaid Invoices',  value:invoices.filter(i=>i.status==='pending'||i.status==='overdue').length, icon:'💰'},
                {label:'Unread Messages',  value:unreadCount,                                           icon:'💬'},
                {label:'Low Stock Items',  value:inventory.filter(i=>i.status!=='ok').length,           icon:'📋'},
              ].map(st=>(
                <div key={st.label} style={s.statCard}>
                  <div style={{fontSize:26,marginBottom:6}}>{st.icon}</div>
                  <div style={{fontSize:30,fontWeight:700,color:'#111827'}}>{st.value}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>{st.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Recent Orders</h3>
                {orders.slice(0,4).map(o=>(
                  <div key={o.id} style={s.row}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{o.id} · {o.client}</div><div style={{fontSize:12,color:'#6b7280'}}>{o.items}</div></div>
                    <div style={{textAlign:'right'}}><Badge status={o.status}/><div style={{fontSize:12,color:'#6b7280',marginTop:3}}>${o.total.toFixed(2)}</div></div>
                  </div>
                ))}
                <button onClick={()=>setSection('orders')} style={s.viewAll}>View all orders →</button>
              </div>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Pending Actions</h3>
                {alerts.filter(a=>a.level!=='info').slice(0,5).map(a=>(
                  <div key={a.id} style={s.row}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{a.level==='urgent'?'🔴':'🟡'} {a.title}</div><div style={{fontSize:12,color:'#6b7280'}}>{a.detail}</div></div>
                  </div>
                ))}
                <button onClick={()=>setSection('alerts')} style={s.viewAll}>View all alerts →</button>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS */}
        {section==='alerts' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Alerts</h1>
            <p style={s.sub}>{alerts.length} active alerts</p>
            {['urgent','action','info'].map(level=>{
              const items=alerts.filter(a=>a.level===level);
              if(!items.length) return null;
              return (
                <div key={level} style={{marginBottom:24}}>
                  <h3 style={{fontSize:12,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>
                    {level==='urgent'?'🔴 Urgent':level==='action'?'🟡 Action Needed':'🟢 Info'}
                  </h3>
                  {items.map(a=>(
                    <div key={a.id} style={{...s.alertRow,...(level==='urgent'?{borderLeft:'3px solid #dc2626'}:level==='action'?{borderLeft:'3px solid #f59e0b'}:{borderLeft:'3px solid #10b981'})}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{a.title}</div>
                        <div style={{fontSize:13,color:'#6b7280',marginTop:2}}>{a.detail}</div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>setSection(a.section)} style={s.goBtn}>Go →</button>
                        <button onClick={()=>setAlerts(al=>al.filter(x=>x.id!==a.id))} style={s.dimBtn}>Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {!alerts.length && <div style={s.empty}>✅ All clear — no alerts!</div>}
          </div>
        )}

        {/* CLIENTS */}
        {section==='clients' && (
          <div style={s.sec}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
              <div>
                <h1 style={s.h1}>Clients</h1>
                <p style={s.sub}>{clients.length} clients</p>
              </div>
              <button onClick={()=>setShowCreateClient(true)}
                style={{background:'#e8a020',color:'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                + Create Client Account
              </button>
            </div>

            {/* Create Client Modal */}
            {showCreateClient && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}
                onClick={e=>e.target===e.currentTarget&&setShowCreateClient(false)}>
                <div style={{background:'#fff',borderRadius:16,padding:32,width:420,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
                  <h2 style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:4}}>Create Client Account</h2>
                  <p style={{fontSize:13,color:'#6b7280',marginBottom:20}}>Client will be able to log in to the portal immediately.</p>
                  <form onSubmit={handleCreateClient} style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:4}}>Business Name</label>
                        <input value={createClientForm.business_name} onChange={e=>setCreateClientForm(f=>({...f,business_name:e.target.value}))}
                          placeholder="Riverside FC" style={{...s.inp,width:'100%'}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:4}}>Contact Name</label>
                        <input value={createClientForm.contact_name} onChange={e=>setCreateClientForm(f=>({...f,contact_name:e.target.value}))}
                          placeholder="John Smith" style={{...s.inp,width:'100%'}}/>
                      </div>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:4}}>Email Address *</label>
                      <input type="email" required value={createClientForm.email} onChange={e=>setCreateClientForm(f=>({...f,email:e.target.value}))}
                        placeholder="coach@riversidefc.com" style={{...s.inp,width:'100%'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:4}}>Phone</label>
                      <input value={createClientForm.phone} onChange={e=>setCreateClientForm(f=>({...f,phone:e.target.value}))}
                        placeholder="(201) 555-0182" style={{...s.inp,width:'100%'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:4}}>Temporary Password *</label>
                      <div style={{position:'relative'}}>
                        <input type={showCreatePw?'text':'password'} required minLength={6} value={createClientForm.password} onChange={e=>setCreateClientForm(f=>({...f,password:e.target.value}))}
                          placeholder="Min 6 characters" style={{...s.inp,width:'100%',paddingRight:36}}/>
                        <button type="button" onClick={()=>setShowCreatePw(p=>!p)}
                          style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:15,opacity:0.5}}>
                          {showCreatePw?'🙈':'👁'}
                        </button>
                      </div>
                    </div>
                    {createClientMsg && (
                      <div style={{padding:'8px 12px',borderRadius:8,background:createClientMsg.startsWith('✓')?'#d1fae5':'#fee2e2',color:createClientMsg.startsWith('✓')?'#065f46':'#991b1b',fontSize:13}}>
                        {createClientMsg}
                      </div>
                    )}
                    <div style={{display:'flex',gap:8,marginTop:4}}>
                      <button type="submit" disabled={createClientLoading}
                        style={{flex:1,background:'#e8a020',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:14,fontWeight:700,cursor:'pointer',opacity:createClientLoading?0.7:1}}>
                        {createClientLoading ? 'Creating…' : 'Create Account'}
                      </button>
                      <button type="button" onClick={()=>{setShowCreateClient(false);setCreateClientMsg('');}}
                        style={{padding:'10px 16px',background:'#f3f4f6',border:'none',borderRadius:8,fontSize:14,cursor:'pointer',color:'#374151'}}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {clients.map(c=>(
              <div key={c.id} style={s.clientCard}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:15,fontWeight:700,color:'#111827'}}>{c.name}</span>
                      <Badge status={c.status==='new'?'new_c':c.status}/>
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>{c.email} · {c.phone}</div>
                    <div style={{fontSize:13,color:'#6b7280'}}>{c.orders} orders · Last order {c.lastOrder}</div>
                    {c.notes && <div style={{fontSize:12,color:'#92400e',background:'#fef3c7',padding:'3px 8px',borderRadius:4,marginTop:6,display:'inline-block'}}>{c.notes}</div>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:20,fontWeight:700,color:c.balance>0?'#dc2626':'#059669'}}>${c.balance.toFixed(2)}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>{c.balance>0?'balance due':'paid up'}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                  <button onClick={()=>{const i=messages.findIndex(m=>m.client===c.name);setActiveMsg(i>=0?i:null);setSection('messages');}} style={s.smBtn}>💬 Message</button>
                  <button onClick={()=>setSection('billing')} style={s.smBtn}>💰 Billing</button>
                  <button onClick={()=>{setSection('billing');setBillingTab('discount');setDiscountClient(c.name);}} style={s.smBtn}>🏷️ Discount</button>
                  <button onClick={()=>{setEditNote(c.id);setNoteText(c.notes);}} style={s.smBtn}>📝 Note</button>
                </div>
                {editNote===c.id && (
                  <div style={{marginTop:10,display:'flex',gap:8}}>
                    <input value={noteText} onChange={e=>setNoteText(e.target.value)} style={{...s.inp,flex:1}} placeholder="Add note…"/>
                    <button onClick={()=>{setClients(cl=>cl.map(x=>x.id===c.id?{...x,notes:noteText}:x));setEditNote(null);}} style={s.saveBtn}>Save</button>
                    <button onClick={()=>setEditNote(null)} style={s.cancelBtn}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MESSAGES */}
        {section==='messages' && (
          <div style={s.sec}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
              <div>
                <h1 style={s.h1}>Messages</h1>
                <p style={s.sub}>{unreadCount} unread</p>
              </div>
              <button onClick={()=>{
                // Start new conversation: pick a client not already in messages
                const existingClients = messages.map(m=>m.client);
                const newClient = clients.find(c=>!existingClients.includes(c.name));
                if (newClient) {
                  const newThread = {id:Date.now(),client:newClient.name,msg:'',time:'just now',read:true,thread:[]};
                  setMessages(ms=>[...ms,newThread]);
                  setActiveMsg(messages.length);
                } else {
                  setActiveMsg(0);
                }
                setSection('messages');
              }} style={{background:'#e8a020',color:'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                + New Message
              </button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:16,minHeight:480}}>
              {/* Thread list + new conversation picker */}
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {/* Start conversation with any client */}
                <select onChange={e=>{
                  const name = e.target.value;
                  if (!name) return;
                  const existing = messages.findIndex(m=>m.client===name);
                  if (existing>=0) { setActiveMsg(existing); }
                  else {
                    const newThread = {id:Date.now(),client:name,msg:'',time:'just now',read:true,thread:[]};
                    setMessages(ms=>{setActiveMsg(ms.length);return [...ms,newThread];});
                  }
                  e.target.value='';
                }} style={{...s.inp,marginBottom:6,fontSize:12,color:'#6b7280'}}>
                  <option value="">✉ Message a client…</option>
                  {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {messages.map((m,i)=>(
                  <button key={m.id} onClick={()=>{setActiveMsg(i);setMessages(ms=>ms.map((x,j)=>j===i?{...x,read:true}:x));}}
                    style={{...s.msgBtn,...(activeMsg===i?{background:'#1a1a2e',color:'#fff'}:{})}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:600}}>{m.client}</span>
                      {!m.read&&<span style={{width:8,height:8,background:'#e8a020',borderRadius:'50%',marginTop:3}}/>}
                    </div>
                    <div style={{fontSize:12,color:activeMsg===i?'#d1d5db':'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.msg||'New conversation'}</div>
                    <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{m.time}</div>
                  </button>
                ))}
              </div>
              <div style={s.card}>
                {activeMsg!==null&&messages[activeMsg] ? (
                  <>
                    <h3 style={s.cardTitle}>{messages[activeMsg].client}</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14,minHeight:200,maxHeight:400,overflowY:'auto'}}>
                      {messages[activeMsg].thread.length===0 && (
                        <div style={{color:'#9ca3af',fontSize:13,textAlign:'center',padding:'40px 0'}}>Start the conversation below.</div>
                      )}
                      {messages[activeMsg].thread.map((t,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:t.from==='admin'?'flex-end':'flex-start'}}>
                          <div style={{maxWidth:'75%',padding:'8px 12px',borderRadius:10,fontSize:13,background:t.from==='admin'?'#1a1a2e':'#f3f4f6',color:t.from==='admin'?'#fff':'#111827'}}>
                            {t.text}<div style={{fontSize:10,opacity:0.6,marginTop:3,textAlign:t.from==='admin'?'right':'left'}}>{t.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <input value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendReply()} style={{...s.inp,flex:1}} placeholder={`Reply to ${messages[activeMsg].client}…`}/>
                      <button onClick={sendReply} style={s.saveBtn}>Send</button>
                    </div>
                  </>
                ) : <div style={s.empty}>Select a conversation or start a new one</div>}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {section==='orders' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Orders</h1>
            <p style={s.sub}>{orders.length} orders · {orders.filter(o=>o.urgent).length} urgent</p>
            {orders.map(o=>(
              <div key={o.id} style={{...s.card,...(o.urgent?{borderLeft:'3px solid #dc2626'}:{}),marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:15,fontWeight:700}}>{o.id}</span>
                      <Badge status={o.status}/>
                      {o.urgent&&<span style={{fontSize:11,background:'#fee2e2',color:'#991b1b',padding:'2px 6px',borderRadius:4,fontWeight:600}}>URGENT</span>}
                      {o.discount>0&&<span style={{fontSize:11,background:'#fef3c7',color:'#92400e',padding:'2px 6px',borderRadius:4,fontWeight:600}}>{o.discount}% OFF</span>}
                    </div>
                    <div style={{fontSize:13,fontWeight:500,color:'#374151'}}>{o.client}</div>
                    <div style={{fontSize:13,color:'#6b7280'}}>{o.items} · {o.date}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:20,fontWeight:700}}>${o.discount>0?(o.total*(1-o.discount/100)).toFixed(2):o.total.toFixed(2)}</div>
                    {o.discount>0&&<div style={{fontSize:12,color:'#6b7280',textDecoration:'line-through'}}>${o.total.toFixed(2)}</div>}
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                  {['new','printing','review','shipped','overdue'].map(st=>(
                    <button key={st} onClick={()=>updateOrderStatus(o.id,st)}
                      style={{...s.smBtn,...(o.status===st?{background:'#1a1a2e',color:'#fff',borderColor:'#1a1a2e'}:{})}}>
                      {st.charAt(0).toUpperCase()+st.slice(1)}
                    </button>
                  ))}
                  <button onClick={()=>{setSection('billing');setBillingTab('discount');setDiscountTarget('order');setDiscountOrder(o.id);}} style={{...s.smBtn,color:'#e8a020'}}>🏷️ Discount</button>
                  <button onClick={()=>{const i=messages.findIndex(m=>m.client===o.client);setActiveMsg(i>=0?i:null);setSection('messages');}} style={s.smBtn}>💬 Message</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REQUESTS */}
        {section==='requests' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Product Requests</h1>
            <p style={s.sub}>{requests.filter(r=>r.status==='pending').length} pending · {requests.length} total</p>

            {requests.length === 0 ? (
              <div style={{...s.card,...s.empty}}>
                <div style={{fontSize:36,marginBottom:10}}>📋</div>
                <div style={{fontWeight:600,color:'#374151',marginBottom:4}}>No requests yet</div>
                <div style={{fontSize:13}}>Client product requests will appear here.</div>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {requests.map(r => {
                  const clientName = r.profiles?.business_name || r.profiles?.contact_name || r.profiles?.email || 'Unknown client';
                  const statusStyle = r.status==='pending' ? {bg:'#fef3c7',color:'#92400e'} : r.status==='sourced' ? {bg:'#d1fae5',color:'#065f46'} : r.status==='declined' ? {bg:'#fee2e2',color:'#991b1b'} : {bg:'#dbeafe',color:'#1e40af'};
                  return (
                    <div key={r.id} style={{...s.card,...(r.status==='pending'?{borderLeft:'3px solid #f59e0b'}:{})}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                            <span style={{fontSize:14,fontWeight:700,color:'#111827'}}>{r.garment_name}</span>
                            <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:statusStyle.bg,color:statusStyle.color}}>{r.status}</span>
                          </div>
                          <div style={{fontSize:13,color:'#6b7280',marginBottom:4}}>
                            👤 {clientName}
                            {r.brand && <> · Brand: <strong>{r.brand}</strong></>}
                            {r.sku && <> · SKU: <strong>{r.sku}</strong></>}
                          </div>
                          {r.notes && <div style={{fontSize:12,color:'#6b7280',fontStyle:'italic'}}>"{r.notes}"</div>}
                          <div style={{fontSize:11,color:'#9ca3af',marginTop:6}}>{new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                        </div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          {r.status==='pending' && <>
                            <button onClick={()=>updateRequestStatus(r.id,'reviewed')} style={s.smBtn}>Mark Reviewed</button>
                            <button onClick={()=>updateRequestStatus(r.id,'sourced')} style={{...s.smBtn,color:'#059669',borderColor:'#6ee7b7'}}>✓ Sourced</button>
                            <button onClick={()=>updateRequestStatus(r.id,'declined')} style={{...s.smBtn,color:'#dc2626',borderColor:'#fca5a5'}}>Decline</button>
                          </>}
                          {r.status==='reviewed' && <>
                            <button onClick={()=>updateRequestStatus(r.id,'sourced')} style={{...s.smBtn,color:'#059669',borderColor:'#6ee7b7'}}>✓ Mark Sourced</button>
                            <button onClick={()=>updateRequestStatus(r.id,'declined')} style={{...s.smBtn,color:'#dc2626',borderColor:'#fca5a5'}}>Decline</button>
                          </>}
                          <button onClick={()=>{setSection('messages');}} style={s.smBtn}>💬 Message</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {section==='products' && (
          <div style={s.sec}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
              <div>
                <h1 style={s.h1}>Products</h1>
                <p style={s.sub}>{products.length} product{products.length!==1?'s':''} in catalog</p>
              </div>
              <button onClick={openAddProduct} style={{background:'#e8a020',color:'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                + Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div style={{...s.card,...s.empty}}>
                <div style={{fontSize:40,marginBottom:12}}>🏷️</div>
                <div style={{fontWeight:600,color:'#374151',marginBottom:6}}>No products yet</div>
                <div style={{fontSize:13}}>Click "+ Add Product" to build your catalog.</div>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
                {products.map(p=>(
                  <div key={p.id} style={{background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',overflow:'hidden'}}>
                    <div style={{height:160,background:'#f9fafb',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
                      {p.frontImage
                        ? <img src={p.frontImage} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                        : <span style={{fontSize:40,opacity:0.3}}>👕</span>
                      }
                      {p.category && (
                        <span style={{position:'absolute',top:8,left:8,fontSize:10,fontWeight:700,background:'#1a1a2e',color:'#e8a020',padding:'2px 8px',borderRadius:10}}>
                          {p.category}
                        </span>
                      )}
                    </div>
                    <div style={{padding:'14px 16px'}}>
                      <div style={{fontSize:14,fontWeight:700,color:'#111827',marginBottom:2}}>{p.name}</div>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:6}}>{p.brand} · {p.sku}</div>
                      {p.price>0 && <div style={{fontSize:13,fontWeight:600,color:'#059669',marginBottom:8}}>${parseFloat(p.price).toFixed(2)}</div>}
                      {p.colors && <div style={{fontSize:11,color:'#9ca3af',marginBottom:10}} title={p.colors}>🎨 {p.colors.split(',').map(c=>c.trim()).filter(Boolean).join(' · ')}</div>}
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>openEditProduct(p)} style={{...s.smBtn,flex:1}}>✏️ Edit</button>
                        <button onClick={()=>{ if(confirm('Delete this product?')) deleteProduct(p.id); }} style={{...s.smBtn,color:'#dc2626',borderColor:'#fca5a5'}}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add / Edit Product Modal */}
            {showProductModal && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:999,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'24px 16px',overflowY:'auto'}}
                onClick={e=>e.target===e.currentTarget&&setShowProductModal(false)}>
                <div style={{background:'#fff',borderRadius:16,padding:28,width:'100%',maxWidth:560,marginTop:8,marginBottom:24}}>
                  <h2 style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:20}}>{editingProduct?'Edit Product':'Add Product'}</h2>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                    <div>
                      <label style={s.label}>Product Name *</label>
                      <input value={productForm.name} onChange={e=>setPF('name',e.target.value)} placeholder="Port & Company PC54" style={s.inp}/>
                    </div>
                    <div>
                      <label style={s.label}>Brand</label>
                      <input value={productForm.brand} onChange={e=>setPF('brand',e.target.value)} placeholder="Port & Company" style={s.inp}/>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                    <div>
                      <label style={s.label}>SKU *</label>
                      <input value={productForm.sku} onChange={e=>setPF('sku',e.target.value)} placeholder="PC54" style={s.inp}/>
                    </div>
                    <div>
                      <label style={s.label}>Category</label>
                      <select value={productForm.category} onChange={e=>setPF('category',e.target.value)} style={s.inp}>
                        {PRODUCT_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Base Price ($)</label>
                      <input type="number" min="0" step="0.01" value={productForm.price} onChange={e=>setPF('price',e.target.value)} placeholder="8.50" style={s.inp}/>
                    </div>
                  </div>

                  <div style={{marginBottom:12}}>
                    <label style={s.label}>Available Colors <span style={{fontWeight:400,textTransform:'none'}}>(comma-separated)</span></label>
                    <input value={productForm.colors} onChange={e=>setPF('colors',e.target.value)} placeholder="White, Black, Navy, Red, Royal" style={s.inp}/>
                  </div>

                  <div style={{marginBottom:12}}>
                    <label style={s.label}>Print Areas <span style={{fontWeight:400,textTransform:'none'}}>(comma-separated)</span></label>
                    <input value={productForm.printAreas} onChange={e=>setPF('printAreas',e.target.value)} placeholder="Front, Back, Left Sleeve, Right Sleeve" style={s.inp}/>
                  </div>

                  <div style={{marginBottom:16}}>
                    <label style={s.label}>Decoration Methods</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {DECORATION_OPTIONS.map(d=>(
                        <button key={d} type="button" onClick={()=>toggleDecoration(d)}
                          style={{padding:'5px 12px',borderRadius:20,border:'1px solid',fontSize:12,cursor:'pointer',fontWeight:500,
                            background:productForm.decorations.includes(d)?'#1a1a2e':'#f9fafb',
                            color:productForm.decorations.includes(d)?'#e8a020':'#6b7280',
                            borderColor:productForm.decorations.includes(d)?'#1a1a2e':'#e5e7eb'}}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
                    {[['frontImage','Front Image'],['backImage','Back Image']].map(([field,label])=>(
                      <div key={field}>
                        <label style={s.label}>{label}</label>
                        {productForm[field] && (
                          <div style={{position:'relative',marginBottom:6}}>
                            <img src={productForm[field]} alt={label} style={{width:'100%',height:100,objectFit:'contain',borderRadius:8,border:'1px solid #e5e7eb',background:'#f9fafb'}}/>
                            <button onClick={()=>setPF(field,'')} style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'#dc2626',color:'#fff',border:'none',fontSize:12,cursor:'pointer',lineHeight:'20px'}}>×</button>
                          </div>
                        )}
                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                          <label style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',border:'1px dashed #d1d5db',borderRadius:6,cursor:'pointer',fontSize:12,color:'#6b7280'}}>
                            <span>📁 Upload file</span>
                            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleProductImage(field,e.target.files[0])}/>
                          </label>
                          <input value={productForm[field].startsWith('data:') ? '' : productForm[field]} onChange={e=>setPF(field,e.target.value)}
                            placeholder="or paste image URL…" style={{...s.inp,fontSize:12}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{display:'flex',gap:10}}>
                    <button onClick={saveProduct} disabled={!productForm.name||!productForm.sku}
                      style={{...s.saveBtn,flex:1,padding:'10px',fontSize:14,opacity:(!productForm.name||!productForm.sku)?0.5:1}}>
                      {editingProduct ? 'Save Changes' : 'Add Product'}
                    </button>
                    <button onClick={()=>setShowProductModal(false)} style={{...s.cancelBtn,padding:'10px 20px',fontSize:14}}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARTWORK */}
        {section==='artwork' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Artwork Review</h1>
            <p style={s.sub}>{pendingArt} files pending approval</p>
            {artwork.map(a=>(
              <div key={a.id} style={{...s.card,...(a.status==='pending'?{borderLeft:'3px solid #f59e0b'}:{}),marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:600}}>🎨 {a.file}</span>
                      <Badge status={a.status}/>
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>{a.client} · {a.uploaded}</div>
                    {a.notes&&<div style={{fontSize:12,color:'#92400e',marginTop:4}}>{a.notes}</div>}
                  </div>
                  {a.status==='pending'&&(
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>approveArt(a.id)} style={{...s.saveBtn,background:'#059669'}}>✓ Approve</button>
                      <button onClick={()=>rejectArt(a.id)}  style={{...s.saveBtn,background:'#dc2626'}}>✗ Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BILLING */}
        {section==='billing' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Billing</h1>
            <p style={s.sub}>Invoices, discounts, and tax reports</p>

            {/* Tabs */}
            <div style={s.tabs}>
              {[['invoices','📄 Invoices'],['create','➕ Create Invoice'],['discount','🏷️ Discounts'],['reports','📊 Tax Reports']].map(([id,label])=>(
                <button key={id} onClick={()=>setBillingTab(id)} style={{...s.tab,...(billingTab===id?s.tabActive:{})}}>{label}</button>
              ))}
            </div>

            {/* INVOICES */}
            {billingTab==='invoices' && (
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                  {[
                    {label:'Outstanding', value:'$'+invoices.filter(i=>i.status==='pending'||i.status==='overdue').reduce((s,i)=>s+i.amount,0).toFixed(2),color:'#dc2626'},
                    {label:'Overdue',     value:'$'+invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.amount,0).toFixed(2),color:'#f59e0b'},
                    {label:'Paid',        value:'$'+invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0).toFixed(2),color:'#059669'},
                    {label:'Total Billed',value:'$'+invoices.reduce((s,i)=>s+i.amount,0).toFixed(2),color:'#111827'},
                  ].map(st=>(
                    <div key={st.label} style={s.statCard}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>{st.label}</div>
                      <div style={{fontSize:20,fontWeight:700,color:st.color}}>{st.value}</div>
                    </div>
                  ))}
                </div>
                <div style={s.card}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:'2px solid #e5e7eb'}}>
                        {['Invoice','Client','Amount','Issued','Due','Status','Actions'].map(h=>(
                          <th key={h} style={{padding:'8px 10px',textAlign:'left',color:'#6b7280',fontWeight:600,fontSize:11,textTransform:'uppercase'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv=>{
                        const sc=SC[inv.status]||SC.pending;
                        return (
                          <tr key={inv.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                            <td style={{padding:'10px',fontWeight:700,color:'#111827'}}>{inv.id}</td>
                            <td style={{padding:'10px',color:'#374151'}}>{inv.client}</td>
                            <td style={{padding:'10px',fontWeight:600}}>${inv.amount.toFixed(2)}</td>
                            <td style={{padding:'10px',color:'#6b7280'}}>{inv.issued}</td>
                            <td style={{padding:'10px',color:'#6b7280'}}>{inv.due}</td>
                            <td style={{padding:'10px'}}><Badge status={inv.status}/></td>
                            <td style={{padding:'10px'}}>
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                <button onClick={()=>setPreviewInv(inv)} style={s.smBtn}>Preview</button>
                                {inv.status!=='paid'&&inv.status!=='waived'&&<>
                                  <button onClick={()=>markPaid(inv.id)} style={{...s.smBtn,color:'#059669'}}>Mark Paid</button>
                                  <button onClick={()=>waiveInv(inv.id)} style={{...s.smBtn,color:'#dc2626'}}>Waive</button>
                                </>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CREATE INVOICE */}
            {billingTab==='create' && (
              <div style={{maxWidth:700}}>
                <div style={{...s.card,marginBottom:16}}>
                  <h3 style={s.cardTitle}>Invoice Details</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div>
                      <label style={s.label}>Client</label>
                      <select style={s.inp} value={newInv.client} onChange={e=>setNewInv(n=>({...n,client:e.target.value}))}>
                        <option value="">Select client…</option>
                        {clients.map(c=><option key={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Due Date</label>
                      <input type="date" style={s.inp} value={newInv.due} onChange={e=>setNewInv(n=>({...n,due:e.target.value}))}/>
                    </div>
                    <div style={{gridColumn:'span 2'}}>
                      <label style={s.label}>Note (optional)</label>
                      <input style={s.inp} value={newInv.note} onChange={e=>setNewInv(n=>({...n,note:e.target.value}))} placeholder="e.g. Net 30, rush order…"/>
                    </div>
                  </div>
                </div>
                <div style={{...s.card,marginBottom:16}}>
                  <h3 style={s.cardTitle}>Line Items</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:8,marginBottom:8}}>
                    {['Description','Qty','Unit Price',''].map(h=><div key={h} style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase'}}>{h}</div>)}
                  </div>
                  {lineItems.map((line,idx)=>(
                    <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:8,marginBottom:8}}>
                      <input style={s.inp} value={line.desc} onChange={e=>setLine(idx,'desc',e.target.value)} placeholder="e.g. 24x T-Shirts"/>
                      <input style={s.inp} type="number" value={line.qty} onChange={e=>setLine(idx,'qty',e.target.value)} placeholder="24"/>
                      <input style={s.inp} type="number" step="0.01" value={line.price} onChange={e=>setLine(idx,'price',e.target.value)} placeholder="10.50"/>
                      <button onClick={()=>removeLine(idx)} style={{background:'#fee2e2',border:'none',borderRadius:6,color:'#dc2626',cursor:'pointer',fontSize:18,fontWeight:700}}>×</button>
                    </div>
                  ))}
                  <button onClick={addLine} style={{padding:'6px 14px',background:'transparent',border:'1px dashed #d1d5db',borderRadius:6,fontSize:13,color:'#6b7280',cursor:'pointer',marginTop:4}}>+ Add Line Item</button>
                  {lineItems.some(l=>l.qty&&l.price)&&(()=>{
                    const sub=lineItems.reduce((s,l)=>s+(Number(l.qty)||0)*(Number(l.price)||0),0);
                    const tax=sub*TAX_RATE;
                    return (
                      <div style={{marginTop:14,padding:14,background:'#f9fafb',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,fontSize:13}}>
                        <div style={{color:'#6b7280'}}>Subtotal: <strong>${sub.toFixed(2)}</strong></div>
                        <div style={{color:'#6b7280'}}>Tax (7%): <strong>${tax.toFixed(2)}</strong></div>
                        <div style={{fontSize:16,fontWeight:700,color:'#111827',borderTop:'1px solid #e5e7eb',paddingTop:6,marginTop:2}}>Total: ${(sub+tax).toFixed(2)}</div>
                      </div>
                    );
                  })()}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <button onClick={createInvoice} style={s.saveBtn}>Create Invoice</button>
                  {createMsg&&<span style={{fontSize:13,fontWeight:500,color:createMsg.startsWith('✓')?'#059669':'#dc2626'}}>{createMsg}</span>}
                </div>
              </div>
            )}

            {/* DISCOUNTS */}
            {billingTab==='discount' && (
              <div style={{maxWidth:600}}>
                <div style={s.card}>
                  <h3 style={s.cardTitle}>Apply Discount</h3>
                  <div style={{display:'flex',gap:8,marginBottom:16}}>
                    {[['client','By Client'],['order','By Order']].map(([id,label])=>(
                      <button key={id} onClick={()=>setDiscountTarget(id)}
                        style={{...s.tab,...(discountTarget===id?s.tabActive:{})}}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    {discountTarget==='client' ? (
                      <div>
                        <label style={s.label}>Client</label>
                        <select style={s.inp} value={discountClient} onChange={e=>setDiscountClient(e.target.value)}>
                          <option value="">Select client…</option>
                          {clients.map(c=><option key={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={s.label}>Order</label>
                        <select style={s.inp} value={discountOrder} onChange={e=>setDiscountOrder(e.target.value)}>
                          <option value="">Select order…</option>
                          {orders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.client} (${o.total.toFixed(2)})</option>)}
                        </select>
                      </div>
                    )}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:12}}>
                      <div>
                        <label style={s.label}>Discount Amount</label>
                        <input type="number" style={s.inp} value={discountAmt} onChange={e=>setDiscountAmt(e.target.value)} placeholder="10"/>
                      </div>
                      <div>
                        <label style={s.label}>Type</label>
                        <select style={s.inp} value={discountType} onChange={e=>setDiscountType(e.target.value)}>
                          <option value="percent">Percent (%)</option>
                          <option value="dollar">Dollar ($)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <button onClick={applyDiscount} style={s.saveBtn}>Apply Discount</button>
                      {discountMsg&&<span style={{fontSize:13,fontWeight:500,color:discountMsg.startsWith('✓')?'#059669':'#dc2626'}}>{discountMsg}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAX REPORTS */}
            {billingTab==='reports' && (
              <div>
                <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
                  <div style={{display:'flex',gap:4,background:'#f3f4f6',padding:4,borderRadius:8}}>
                    {[['monthly','Monthly'],['quarterly','Quarterly'],['yearly','Yearly']].map(([id,label])=>(
                      <button key={id} onClick={()=>setReportType(id)} style={{...s.tab,...(reportType===id?s.tabActive:{})}}>{label}</button>
                    ))}
                  </div>
                  {reportType!=='yearly'&&(
                    <select style={s.inp} value={reportYear} onChange={e=>setReportYear(e.target.value)}>
                      {['2026','2025','2024'].map(y=><option key={y}>{y}</option>)}
                    </select>
                  )}
                  <button onClick={()=>window.print()} style={{padding:'7px 14px',background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:6,fontSize:12,cursor:'pointer'}}>🖨 Print Report</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
                  {[
                    {label:'Total Revenue',    value:'$'+totalRev.toFixed(2),            color:'#059669'},
                    {label:'Tax Collected 7%', value:'$'+totalTax.toFixed(2),            color:'#e8a020'},
                    {label:'Net Revenue',      value:'$'+(totalRev-totalTax).toFixed(2), color:'#1a1a2e'},
                  ].map(st=>(
                    <div key={st.label} style={{...s.statCard,textAlign:'center'}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>{st.label}</div>
                      <div style={{fontSize:22,fontWeight:700,color:st.color}}>{st.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:'#fff',borderRadius:8,border:'1px solid #e5e7eb',overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr style={{background:'#1a1a2e'}}>
                        {['Period','Invoices','Revenue','Tax (7%)','Net'].map(h=>(
                          <th key={h} style={{padding:'10px 16px',textAlign:h==='Period'?'left':'right',color:'#e8a020',fontWeight:700,fontSize:12}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa'}}>
                          <td style={{padding:'10px 16px',fontWeight:600,color:'#111827'}}>{row.label}</td>
                          <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280'}}>{row.count}</td>
                          <td style={{padding:'10px 16px',textAlign:'right',fontWeight:600,color:'#059669'}}>${row.revenue.toFixed(2)}</td>
                          <td style={{padding:'10px 16px',textAlign:'right',color:'#e8a020'}}>${row.tax.toFixed(2)}</td>
                          <td style={{padding:'10px 16px',textAlign:'right',fontWeight:600,color:'#111827'}}>${(row.revenue-row.tax).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'#1a1a2e'}}>
                        <td style={{padding:'12px 16px',fontWeight:700,color:'#e8a020'}}>TOTAL</td>
                        <td style={{padding:'12px 16px',textAlign:'right',color:'#e8a020'}}>{reportData.reduce((s,r)=>s+r.count,0)}</td>
                        <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700,color:'#e8a020'}}>${totalRev.toFixed(2)}</td>
                        <td style={{padding:'12px 16px',textAlign:'right',color:'#e8a020'}}>${totalTax.toFixed(2)}</td>
                        <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700,color:'#e8a020'}}>${(totalRev-totalTax).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p style={{fontSize:12,color:'#9ca3af',marginTop:10}}>* Based on paid invoices only. Consult your accountant for official filing.</p>
              </div>
            )}
          </div>
        )}

        {/* INVENTORY */}
        {section==='inventory' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Inventory</h1>
            <p style={s.sub}>{inventory.filter(i=>i.status!=='ok').length} items need attention</p>
            {inventory.map(item=>(
              <div key={item.id} style={{...s.card,...(item.status==='critical'?{borderLeft:'3px solid #dc2626'}:item.status==='low'?{borderLeft:'3px solid #f59e0b'}:{}),marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:600}}>{item.name}</span>
                      <Badge status={item.status}/>
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>SKU: {item.sku} · Min: {item.min} units</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:26,fontWeight:700,color:item.status==='critical'?'#dc2626':item.status==='low'?'#f59e0b':'#059669'}}>{item.qty}</div>
                    <div style={{fontSize:11,color:'#6b7280'}}>in stock</div>
                  </div>
                </div>
                <div style={{marginTop:10,background:'#f3f4f6',borderRadius:6,height:6,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.min(100,(item.qty/Math.max(item.min*2,item.qty))*100)}%`,background:item.status==='critical'?'#dc2626':item.status==='low'?'#f59e0b':'#059669',borderRadius:6}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDER DESK */}
        {section==='orderdesk' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Order Desk</h1>
            <p style={s.sub}>Webhook connection & order feed</p>
            <div style={{...s.card,marginBottom:16}}>
              <h3 style={s.cardTitle}>Webhook Status</h3>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{width:10,height:10,background:'#10b981',borderRadius:'50%',animation:'pulse 2s infinite'}}/>
                <span style={{fontSize:14,fontWeight:600,color:'#059669'}}>Connected — Order Desk sync active</span>
                <span style={{fontSize:12,color:'#6b7280'}}>Last ping: 4 minutes ago</span>
              </div>
              <div style={{background:'#f9fafb',borderRadius:8,padding:14}}>
                <div style={{fontSize:12,fontWeight:600,color:'#6b7280',marginBottom:6}}>Webhook URL</div>
                <div style={{fontFamily:'monospace',fontSize:12,color:'#374151',background:'#fff',padding:'8px 12px',borderRadius:6,border:'1px solid #e5e7eb',wordBreak:'break-all'}}>
                  https://sanda-portal.vercel.app/api/webhooks/orderdesk
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button style={s.smBtn}>Test Webhook</button>
                <button style={s.smBtn}>View Logs</button>
                <button style={s.smBtn}>Reconnect</button>
              </div>
            </div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Recent Incoming Orders</h3>
              {orders.map(o=>(
                <div key={o.id} style={s.row}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{o.id} · {o.client}</div><div style={{fontSize:12,color:'#6b7280'}}>{o.items}</div></div>
                  <div style={{textAlign:'right'}}><Badge status={o.status}/><div style={{fontSize:12,color:'#6b7280',marginTop:3}}>{o.date}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {section==='settings' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Settings</h1>
            <p style={s.sub}>Portal configuration</p>
            <div style={{...s.card,marginBottom:16}}>
              <h3 style={s.cardTitle}>Admin Access</h3>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div><label style={s.label}>Admin Password</label><div style={{display:'flex',gap:8}}><input type="password" placeholder="New password" style={{...s.inp,flex:1}}/><button style={s.saveBtn}>Update</button></div></div>
                <div><label style={s.label}>Admin Email</label><div style={{display:'flex',gap:8}}><input type="email" placeholder="admin@sascreenprinting.com" style={{...s.inp,flex:1}}/><button style={s.saveBtn}>Save</button></div></div>
              </div>
            </div>
            <div style={{...s.card,marginBottom:16}}>
              <h3 style={s.cardTitle}>Notifications</h3>
              {['Email me on new orders','Email me on new messages','Email me when artwork is uploaded','Email me when inventory is low','Email me when invoices are overdue'].map(pref=>(
                <label key={pref} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #f3f4f6',cursor:'pointer',fontSize:14,color:'#374151'}}>
                  <input type="checkbox" defaultChecked style={{width:16,height:16}}/>{pref}
                </label>
              ))}
            </div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Business Info</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[['Business Name','S&A Screen Printing'],['Phone','(973) 555-0100'],['Email','info@sascreenprinting.com'],['Address','123 Print Ave, Newark NJ'],['Tax Rate (%)','7'],['Default Net Terms','30']].map(([label,val])=>(
                  <div key={label}><label style={s.label}>{label}</label><input style={s.inp} defaultValue={val}/></div>
                ))}
              </div>
              <button style={{...s.saveBtn,marginTop:16}}>Save Business Info</button>
            </div>
          </div>
        )}
      </main>

      {/* Invoice Preview Modal */}
      {previewInv && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,maxWidth:700,width:'100%',maxHeight:'92vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}} className="no-print">
              <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Invoice Preview — {previewInv.id}</h3>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>window.print()} style={{padding:'6px 14px',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>🖨 Print</button>
                <button onClick={()=>setPreviewInv(null)} style={{padding:'6px 14px',background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:6,fontSize:12,cursor:'pointer'}}>✕ Close</button>
              </div>
            </div>
            <div style={{fontFamily:"'Inter',sans-serif"}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}>
                <div>
                  <div style={{fontSize:20,fontWeight:800,color:'#1a1a2e'}}>S&A Screen Printing</div>
                  <div style={{fontSize:13,color:'#6b7280',lineHeight:1.7,marginTop:4}}>123 Print Ave, Newark NJ<br/>(973) 555-0100 · info@sascreenprinting.com</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:24,fontWeight:800,color:'#1a1a2e'}}>INVOICE</div>
                  <div style={{fontSize:18,fontWeight:700,color:'#e8a020'}}>{previewInv.id}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20,padding:14,background:'#f9fafb',borderRadius:8}}>
                <div><div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Bill To</div><div style={{fontSize:14,fontWeight:600}}>{previewInv.client}</div></div>
                <div><div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Details</div><div style={{fontSize:13,color:'#374151',lineHeight:1.7}}><div>Issued: {previewInv.issued}</div><div>Due: {previewInv.due}</div>{previewInv.note&&<div>Note: {previewInv.note}</div>}</div></div>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16}}>
                <thead><tr style={{background:'#1a1a2e'}}>{['Description','Qty','Unit Price','Total'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:h==='Description'?'left':'right',color:'#e8a020',fontSize:12,fontWeight:700}}>{h}</th>)}</tr></thead>
                <tbody>{previewInv.items.map((item,i)=><tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}><td style={{padding:'10px 12px',fontSize:13}}>{item.desc}</td><td style={{padding:'10px 12px',fontSize:13,textAlign:'right'}}>{item.qty}</td><td style={{padding:'10px 12px',fontSize:13,textAlign:'right'}}>${item.price.toFixed(2)}</td><td style={{padding:'10px 12px',fontSize:13,fontWeight:600,textAlign:'right'}}>${(item.qty*item.price).toFixed(2)}</td></tr>)}</tbody>
              </table>
              {(()=>{const sub=previewInv.items.reduce((s,i)=>s+i.qty*i.price,0);const tax=sub*TAX_RATE;return(<div style={{display:'flex',justifyContent:'flex-end'}}><div style={{width:200}}>{[['Subtotal',sub],['Tax (7%)',tax]].map(([label,val])=><div key={label} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:13,color:'#6b7280',borderBottom:'1px solid #f3f4f6'}}><span>{label}</span><span>${val.toFixed(2)}</span></div>)}<div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:16,fontWeight:700,color:'#111827'}}><span>Total</span><span>${(sub+tax).toFixed(2)}</span></div></div></div>);})()}
              <div style={{marginTop:20,padding:14,background:'#f9fafb',borderRadius:8,fontSize:13,color:'#6b7280',lineHeight:1.7}}><strong style={{color:'#111827'}}>Payment:</strong> Venmo · Zelle · Check · Bank Transfer<br/><strong style={{color:'#111827'}}>Questions?</strong> info@sascreenprinting.com · (973) 555-0100</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  loginBg:    {minHeight:'100vh',background:'#0f0f1a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif"},
  loginCard:  {background:'#1a1a2e',border:'1px solid rgba(232,160,32,0.2)',borderRadius:16,padding:'44px 40px',width:320,textAlign:'center'},
  loginTitle: {color:'#fff',fontSize:22,fontWeight:700,margin:'0 0 4px'},
  loginSub:   {color:'#6b7280',fontSize:13,marginBottom:28},
  loginInput: {width:'100%',padding:'11px 14px',background:'#0f0f1a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff',fontSize:14,textAlign:'center',outline:'none',fontFamily:'inherit',boxSizing:'border-box'},
  loginBtn:   {width:'100%',padding:'12px 0',background:'#e8a020',color:'#1a1a2e',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'},
  shell:      {display:'flex',minHeight:'100vh',fontFamily:"'Inter',sans-serif",background:'#f3f4f6'},
  sidebar:    {width:220,background:'#1a1a2e',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50,overflowY:'auto'},
  logo:       {display:'flex',alignItems:'center',gap:8,padding:'8px 8px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',marginBottom:8},
  urgentBanner:{background:'rgba(220,38,38,0.15)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:6,padding:'6px 10px',fontSize:11,color:'#fca5a5',lineHeight:1.4,marginTop:8},
  nav:        {flex:1,padding:'4px 8px',display:'flex',flexDirection:'column',gap:2},
  navBtn:     {display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:8,background:'transparent',border:'none',color:'#9ca3af',fontSize:13,cursor:'pointer',width:'100%',transition:'all 0.15s'},
  navActive:  {background:'rgba(232,160,32,0.15)',color:'#e8a020'},
  navBadge:   {background:'#374151',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10,minWidth:18,textAlign:'center'},
  sideBottom: {padding:'12px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',gap:8},
  main:       {flex:1,marginLeft:220,overflowY:'auto',minHeight:'100vh'},
  sec:        {padding:'28px',maxWidth:1100},
  h1:         {fontSize:24,fontWeight:700,color:'#111827',margin:'0 0 4px'},
  sub:        {fontSize:14,color:'#6b7280',marginBottom:24},
  alertBanner:{display:'flex',alignItems:'center',gap:12,background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:14,color:'#991b1b'},
  alertBannerBtn:{marginLeft:'auto',background:'#dc2626',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,fontWeight:600,cursor:'pointer'},
  statsGrid:  {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24},
  statCard:   {background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:16,textAlign:'center'},
  card:       {background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:20},
  cardTitle:  {fontSize:15,fontWeight:600,color:'#111827',marginBottom:14,marginTop:0},
  row:        {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f3f4f6',gap:12},
  viewAll:    {background:'none',border:'none',color:'#e8a020',fontSize:13,cursor:'pointer',padding:'8px 0',fontWeight:500},
  alertRow:   {background:'#fff',borderRadius:8,border:'1px solid #e5e7eb',padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:16},
  goBtn:      {background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer'},
  dimBtn:     {background:'transparent',border:'1px solid #d1d5db',color:'#6b7280',borderRadius:6,padding:'5px 10px',fontSize:12,cursor:'pointer'},
  clientCard: {background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:20,marginBottom:14},
  smBtn:      {background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:6,padding:'5px 12px',fontSize:12,fontWeight:500,cursor:'pointer',color:'#374151'},
  msgBtn:     {background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:'12px',textAlign:'left',cursor:'pointer',transition:'all 0.15s',width:'100%'},
  inp:        {padding:'7px 9px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,color:'#111827',background:'#fff',fontFamily:'inherit',boxSizing:'border-box',width:'100%'},
  label:      {display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.4,marginBottom:5},
  saveBtn:    {padding:'7px 16px',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},
  cancelBtn:  {padding:'7px 14px',background:'transparent',border:'1px solid #d1d5db',color:'#6b7280',borderRadius:6,fontSize:13,cursor:'pointer'},
  tabs:       {display:'flex',gap:4,marginBottom:20,background:'#f3f4f6',padding:4,borderRadius:8,width:'fit-content'},
  tab:        {padding:'7px 16px',background:'transparent',border:'none',borderRadius:6,fontSize:13,fontWeight:500,color:'#6b7280',cursor:'pointer'},
  tabActive:  {background:'#fff',color:'#111827',fontWeight:600,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'},
  empty:      {textAlign:'center',padding:'40px',color:'#9ca3af',fontSize:14},
};
