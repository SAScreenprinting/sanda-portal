'use client';
import { downloadFile } from '@/lib/downloadFile';
import '@/components/portal.css';
import { Icon } from '@/components/PortalShell';
import { useState, useEffect, useRef } from 'react';
import '@/components/admin.css';
import AdminDashboard from './sections/Dashboard';
import AdminClients from './sections/Clients';
import AdminOrders from './sections/Orders';
import AdminBilling from './sections/Billing';
import AdminSettings from './sections/Settings';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sanda2024admin';

const NAV = [
  { id:'dashboard', icon:'', label:'Dashboard' },
  { id:'clients',   icon:'', label:'Clients' },
  { id:'requests',  icon:'', label:'Requests' },
  { id:'messages',  icon:'', label:'Messages' },
  { id:'orders',    icon:'', label:'Orders' },
  { id:'designs',   icon:'', label:'Designs' },
  { id:'pricing',   icon:'', label:'Pricing' },
  { id:'samples',   icon:'', label:'Samples' },
  { id:'artwork',   icon:'', label:'Artwork' },
  { id:'billing',   icon:'', label:'Billing' },
  { id:'poddesk',   icon:'', label:'S&A POD' },
  { id:'settings',  icon:'', label:'Settings' },
];

const SC = {
  new:      {bg:'rgba(96,165,250,0.14)',color:'#93c5fd'},
  printing: {bg:'rgba(255,200,0,0.14)',color:'#ffc800'},
  review:   {bg:'rgba(167,139,250,0.14)',color:'#c4b5fd'},
  shipped:  {bg:'rgba(52,211,153,0.14)',color:'#34d399'},
  overdue:  {bg:'rgba(248,113,113,0.14)',color:'#fca5a5'},
  active:   {bg:'rgba(52,211,153,0.14)',color:'#34d399'},
  vip:      {bg:'rgba(255,200,0,0.14)',color:'#ffc800'},
  new_c:    {bg:'rgba(96,165,250,0.14)',color:'#93c5fd'},
  pending:  {bg:'rgba(255,200,0,0.14)',color:'#ffc800'},
  paid:     {bg:'rgba(52,211,153,0.14)',color:'#34d399'},
  waived:   {bg:'#141417',color:'#b3b3bc'},
  approved: {bg:'rgba(52,211,153,0.14)',color:'#34d399'},
  rejected: {bg:'rgba(248,113,113,0.14)',color:'#fca5a5'},
  low:      {bg:'rgba(255,200,0,0.14)',color:'#ffc800'},
  critical: {bg:'rgba(248,113,113,0.14)',color:'#fca5a5'},
  ok:       {bg:'rgba(52,211,153,0.14)',color:'#34d399'},
};

function Badge({ status, label }) {
  const c = SC[status] || {bg:'#141417',color:'#b3b3bc'};
  return <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,background:c.bg,color:c.color,whiteSpace:'nowrap'}}>{label||status}</span>;
}

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [section, setSection]     = useState('dashboard');
  const [designs, setDesigns]     = useState([]);
  const [priceData, setPriceData]   = useState({ products: [], pricing: {} });
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceEdit, setPriceEdit]   = useState({});
  const [priceSaved, setPriceSaved] = useState('');
  const [sampleList, setSampleList] = useState([]);
  const [podOrders, setPodOrders]   = useState(null);
  const [podFilter, setPodFilter]   = useState('open');
  const [podOpen, setPodOpen]       = useState(null);
  const [podTrack, setPodTrack]     = useState({ carrier:'USPS', number:'' });
  const [podMsg, setPodMsg]         = useState('');
  const [podBusy, setPodBusy]       = useState(false);
  const [podView, setPodView]       = useState(null);
  const [podBg, setPodBg]           = useState('checker');
  const [podZoom, setPodZoom]       = useState(1);
  const loadPodOrders = () => fetch('/api/pod-orders?all=true', { cache:'no-store' }).then(r=>r.json()).then(d=>setPodOrders(d.orders||[])).catch(()=>setPodOrders([]));
  async function podAct(id, body) {
    setPodBusy(true); setPodMsg('');
    const res = await fetch(`/api/pod-orders/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const out = await res.json().catch(()=>({}));
    setPodMsg((res.ok ? 'ok:' : 'err:') + (out.ok || out.error || 'Done.'));
    setPodBusy(false);
    await loadPodOrders();
  }
  const loadPricing = () => { setPriceLoading(true); fetch('/api/admin/pricing', { cache:'no-store' }).then(r=>r.json()).then(d=>{ setPriceData({ products:d.products||[], pricing:d.pricing||{} }); setPriceLoading(false); }).catch(()=>setPriceLoading(false)); };
  const loadSamples = () => fetch('/api/samples?admin=true', { cache:'no-store' }).then(r=>r.json()).then(d=>setSampleList(d.samples||[])).catch(()=>{});
  async function savePriceRow(p) {
    const e = priceEdit[p.id] || {};
    const cur = priceData.pricing[p.id] || {};
    const body = { productId:p.id, title:p.title, base_cost: e.base_cost ?? cur.base_cost ?? 0, print_cost: e.print_cost ?? cur.print_cost ?? 0, shipping_cost: e.shipping_cost ?? cur.shipping_cost ?? 0, suggested_price: e.suggested_price ?? cur.suggested_price ?? '' };
    const res = await fetch('/api/admin/pricing', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) { setPriceSaved(p.id); setTimeout(()=>setPriceSaved(''),1800); loadPricing(); setPriceEdit(x=>{ const n={...x}; delete n[p.id]; return n; }); }
  }
  async function updateSample(id, patch) {
    setSampleList(l => l.map(s => s.id===id ? { ...s, ...patch } : s));
    await fetch('/api/samples', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, ...patch }) });
  }
  const [designFilter, setDesignFilter] = useState('Submitted');
  const [reviewing, setReviewing]   = useState(null);
  const [denying, setDenying]       = useState(false);
  const [denyNote, setDenyNote]     = useState('');
  const [viewerBg, setViewerBg]     = useState('checker');
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [skuDraft, setSkuDraft] = useState({});
  async function saveSku(id) {
    const v = skuDraft[id];
    if (v === undefined) return;
    const res = await fetch(`/api/designs/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sku: v }) });
    const out = await res.json().catch(()=>({}));
    if (res.ok) setDesigns(list => list.map(d => d.id === id ? { ...d, product: { ...(d.product||{}), sku: out.sku } } : d));
    setSkuDraft(x => { const n = { ...x }; delete n[id]; return n; });
  }
  const pickViewer = (f) => { setViewerFile(f); setViewerZoom(1); };
  const [designsLoading, setDesignsLoading] = useState(false);
  const [artwork, setArtwork]     = useState([]);
  const [artworkLoading, setArtworkLoading] = useState(false);
  const [artworkClientFilter, setArtworkClientFilter] = useState('all');
  const [artworkStatusFilter, setArtworkStatusFilter] = useState('pending');
  const [artworkNotes, setArtworkNotes]   = useState({});   // { [id]: noteText }
  const [artworkAdminUpClient, setArtworkAdminUpClient] = useState('');
  const [artworkAdminUpLabel, setArtworkAdminUpLabel]   = useState('');
  const [artworkAdminUploading, setArtworkAdminUploading] = useState(false);
  const [artworkAdminUpMsg, setArtworkAdminUpMsg]       = useState('');
  const artworkFileRef = useRef();

  // Requests state
  const [requests, setRequests] = useState([]);
  const [clientProfiles, setClientProfiles] = useState([]);

  useEffect(() => {
    fetch('/api/requests/list').then(r => r.json()).then(d => { if (d.requests) setRequests(d.requests); }).catch(()=>{});
    fetch('/api/profiles/list').then(r => r.json()).then(d => { if (d.profiles) setClientProfiles(d.profiles); }).catch(()=>{});
  }, []);

  // Inquiries state
  const [inquiries, setInquiries]           = useState([]);
  const [activeInquiry, setActiveInquiry]   = useState(null);
  const [inqThread, setInqThread]           = useState([]);
  const [inqReply, setInqReply]             = useState('');
  const [inqSending, setInqSending]         = useState(false);
  const [inqFilter, setInqFilter]           = useState('all');
  const [inqLoading, setInqLoading]         = useState(false);

  const loadInquiries = () => {
    setInqLoading(true);
    fetch('/api/inquiries/list?admin=true')
      .then(r => r.json())
      .then(d => { if (d.inquiries) setInquiries(d.inquiries); setInqLoading(false); })
      .catch(() => setInqLoading(false));
  };

  const loadInqThread = (id) => {
    fetch(`/api/inquiries/${id}`)
      .then(r => r.json())
      .then(d => { if (d.messages) setInqThread(d.messages); });
  };

  const loadArtwork = () => {
    setArtworkLoading(true);
    fetch('/api/artwork/list?admin=true')
      .then(r => r.json())
      .then(d => { if (d.artwork) setArtwork(d.artwork); setArtworkLoading(false); })
      .catch(() => setArtworkLoading(false));
  };

  const loadDesigns = () => {
    setDesignsLoading(true);
    fetch('/api/designs/list?admin=true', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.designs) setDesigns(d.designs); setDesignsLoading(false); })
      .catch(() => setDesignsLoading(false));
  };

  async function setDesignStatus(id, status, note) {
    setDesigns(list => list.map(d => d.id === id ? { ...d, product: { ...(d.product || {}), status, reviewNote: status === 'Denied' ? (note || '') : '' } } : d));
    await fetch(`/api/designs/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status, note }) }).then(r => r.json()).catch(() => ({})).then(out => { if (out.sku) setDesigns(list => list.map(d => d.id === id ? { ...d, product: { ...(d.product||{}), sku: out.sku } } : d)); });
  }

  useEffect(() => { loadDesigns(); }, []);

  useEffect(() => {
    if (section === 'designs') loadDesigns();
    if (section === 'pricing') loadPricing();
    if (section === 'samples') loadSamples();
    if (section === 'poddesk') loadPodOrders();
    if (section === 'messages') loadInquiries();
    if (section === 'artwork')  loadArtwork();
  }, [section]);

  async function openInquiry(inq) {
    setActiveInquiry(inq);
    setInqReply('');
    loadInqThread(inq.id);
  }

  async function sendInqReply() {
    if (!inqReply.trim() || !activeInquiry) return;
    setInqSending(true);
    const res = await fetch(`/api/inquiries/${activeInquiry.id}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ senderId: 'admin', body: inqReply, isAdmin: true }),
    });
    if (res.ok) {
      setInqReply('');
      loadInqThread(activeInquiry.id);
      loadInquiries();
      // Update status to in_progress in local state
      setActiveInquiry(a => a ? { ...a, status:'in_progress' } : a);
    }
    setInqSending(false);
  }

  async function updateInqStatus(id, status) {
    await fetch('/api/inquiries/list', {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id, status }),
    });
    setInquiries(list => list.map(i => i.id === id ? { ...i, status } : i));
    if (activeInquiry?.id === id) setActiveInquiry(a => ({ ...a, status }));
  }

  const INQ_STATUS = {
    open:        { bg:'rgba(255,200,0,0.14)', color:'#ffc800', label:'Open' },
    in_progress: { bg:'rgba(96,165,250,0.14)', color:'#93c5fd', label:'In Progress' },
    resolved:    { bg:'rgba(52,211,153,0.14)', color:'#34d399', label:'Resolved' },
  };

  async function updateRequestStatus(id, status) {
    await fetch('/api/requests/list', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) });
    setRequests(r => r.map(x => x.id === id ? { ...x, status } : x));
  }

  function login(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) setAuthed(true);
    else { setPwErr('Incorrect password.'); setPw(''); }
  }

  // Artwork
  async function approveArt(id) {
    await fetch('/api/artwork/update', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status:'approved' }) });
    setArtwork(a => a.map(x => x.id===id ? {...x, status:'approved'} : x));
  }
  async function rejectArt(id) {
    const notes = artworkNotes[id]?.trim() || '';
    await fetch('/api/artwork/update', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status:'rejected', admin_notes: notes || 'Rejected by admin' }) });
    setArtwork(a => a.map(x => x.id===id ? {...x, status:'rejected', admin_notes: notes || 'Rejected by admin'} : x));
  }
  async function saveArtNote(id) {
    const notes = artworkNotes[id]?.trim() || '';
    await fetch('/api/artwork/update', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, admin_notes: notes }) });
    setArtwork(a => a.map(x => x.id===id ? {...x, admin_notes: notes} : x));
  }
  async function adminUploadArt(fileList) {
    if (!artworkAdminUpClient || !fileList?.length) return;
    setArtworkAdminUploading(true);
    setArtworkAdminUpMsg('');
    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', artworkAdminUpClient);
      if (artworkAdminUpLabel.trim()) fd.append('label', artworkAdminUpLabel.trim());
      const res  = await fetch('/api/artwork/upload', { method:'POST', body:fd });
      const data = await res.json();
      if (!res.ok) { setArtworkAdminUpMsg(` ${data.error}`); setArtworkAdminUploading(false); return; }
    }
    // Auto-approve admin uploads
    const res2 = await fetch('/api/artwork/list?admin=true');
    const d2   = await res2.json();
    if (d2.artwork) {
      // approve the newest ones just uploaded by this admin for this client
      const newest = d2.artwork.filter(a => a.client_id === artworkAdminUpClient && a.status === 'pending').slice(0, fileList.length);
      for (const a of newest) {
        await fetch('/api/artwork/update', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:a.id, status:'approved', label: artworkAdminUpLabel.trim()||null }) });
      }
    }
    setArtworkAdminUpMsg(` ${fileList.length} file${fileList.length>1?'s':''} uploaded & approved`);
    setArtworkAdminUpLabel('');
    setTimeout(() => setArtworkAdminUpMsg(''), 4000);
    setArtworkAdminUploading(false);
    loadArtwork();
  }

  // Sidebar badges, counted from the real tables (see /api/admin/overview).
  const [badges, setBadges] = useState({});
  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/overview', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (!d.attention) return;
      setBadges({
        orders: d.orders?.awaitingArtwork, requests: d.attention.newRequests, messages: d.attention.openInquiries,
        designs: d.attention.designsToReview, artwork: d.attention.artworkPending, samples: d.attention.sampleRequests,
        billing: d.invoices?.overdueCount,
      });
    }).catch(() => {});
  }, [authed, section]);
  const urgentCount = badges.billing || 0;

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={s.loginBg}><div style={s.loginCard}><img src="/logo.png" alt="S&A" style={{height:64,display:'block',margin:'0 auto 18px'}}/><h1 style={s.loginTitle}>S&A Admin</h1><p style={s.loginSub}>Command Center · Staff Only</p><form onSubmit={login} style={{display:'flex',flexDirection:'column',gap:10}}><input type="password" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} style={s.loginInput} autoFocus/>
          {pwErr && <p style={{color:'#f87171',fontSize:13,margin:0}}>{pwErr}</p>}
          <button type="submit" style={s.loginBtn}>Enter Admin</button></form></div></div>
  );

  // ── SHELL ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.shell}><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#374151;border-radius:2px} input:focus,select:focus,textarea:focus{outline:2px solid #e8a020;outline-offset:-1px} @media print{.no-print{display:none!important}}`}</style>

      {/* Sidebar */}
      <aside style={s.sidebar}><div style={{padding:'16px 12px 8px'}}><div style={s.logo}><img src="/logo.png" alt="" style={{height:34,display:'block'}}/><span style={{fontSize:12,fontWeight:700,color:'#fff',letterSpacing:3,textTransform:'uppercase',lineHeight:1.35,fontFamily:"var(--font-sora),sans-serif"}}>S&A<br/><span style={{color:'#ffc800'}}>Admin</span></span></div>
          {urgentCount>0 && <div style={s.urgentBanner}> {urgentCount} overdue invoice{urgentCount>1?'s':''}</div>}
        </div><nav style={s.nav}>
          {NAV.map(item=>{
            const badge = badges[item.id] || 0;
            return (
              <button key={item.id} onClick={()=>setSection(item.id)} style={{...s.navBtn,...(section===item.id?s.navActive:{})}}><span style={{display:'grid',placeItems:'center',width:20}}><Icon name={item.id==='dashboard'?'dashboard':item.id==='messages'?'messages':item.id==='orders'?'orders':item.id==='designs'?'designs':item.id==='poddesk'?'orderdesk':item.id==='pricing'?'billing':item.id==='samples'?'orders':item.id==='artwork'?'artwork':item.id==='billing'?'billing':item.id==='settings'?'settings':item.id} size={17}/></span><span style={{flex:1,textAlign:'left'}}>{item.label}</span>
                {badge>0 && <span style={{...s.navBadge,...(item.id==='billing'?{background:'#dc2626'}:{})}}>{badge}</span>}
              </button>
            );
          })}
        </nav><div style={s.sideBottom}><a href="/dashboard" style={{color:'#b3b3bc',fontSize:12,textDecoration:'none',textAlign:'center'}}>← Client Portal</a><button onClick={()=>setAuthed(false)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'#b3b3bc',padding:'6px',borderRadius:10,fontSize:12,cursor:'pointer'}}>Sign Out</button></div></aside>

      {/* Main */}
      <main style={s.main}>

        {section==='dashboard' && <AdminDashboard go={setSection} />}
        {section==='clients' && <AdminClients />}

        {/* INQUIRIES */}
        {section==='messages' && (
          <div style={s.sec}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:10}}><div><h1 style={s.h1}>Client Inquiries</h1><p style={s.sub}>{inquiries.filter(i=>i.status==='open').length} open · {inquiries.filter(i=>i.status==='in_progress').length} in progress</p></div><button onClick={loadInquiries} style={{background:'#ffc800',color:'#000',border:'none',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                ↻ Refresh
              </button></div>

            {/* Status filter */}
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
              {[['all','All'],['open','Open'],['in_progress','In Progress'],['resolved','Resolved']].map(([val,label])=>(
                <button key={val} onClick={()=>setInqFilter(val)}
                  style={{padding:'5px 14px',borderRadius:10,border:'none',background:inqFilter===val?'#ffc800':'#141417',color:inqFilter===val?'#fff':'#b3b3bc',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  {label}
                </button>
              ))}
            </div><div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16,minHeight:500}}>

              {/* Inquiry list */}
              <div style={{display:'flex',flexDirection:'column',gap:8,overflowY:'auto',maxHeight:600}}>
                {inqLoading && <div style={{color:'#a0a0a9',fontSize:13,padding:'20px',textAlign:'center'}}>Loading…</div>}
                {!inqLoading && inquiries.filter(i=>inqFilter==='all'||i.status===inqFilter).length===0 && (
                  <div style={{color:'#a0a0a9',fontSize:13,padding:'40px 20px',textAlign:'center'}}>No inquiries yet.</div>
                )}
                {inquiries.filter(i=>inqFilter==='all'||i.status===inqFilter).map(inq=>{
                  const st = INQ_STATUS[inq.status]||INQ_STATUS.open;
                  const clientName = inq.client?.business_name || inq.client?.contact_name || 'Client';
                  const isActive = activeInquiry?.id===inq.id;
                  return (
                    <button key={inq.id} onClick={()=>openInquiry(inq)}
                      style={{...s.msgBtn,...(isActive?{background:'rgba(255,200,0,0.1)',color:'#fff',borderColor:'#ffc800'}:{}),textAlign:'left',padding:'12px 14px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4,gap:6}}><span style={{fontSize:11,fontWeight:700,fontFamily:'monospace',color:isActive?'#ffc800':'#a0a0a9',flexShrink:0}}>{inq.inquiry_number}</span><span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:10,background:st.bg,color:st.color,flexShrink:0}}>{st.label}</span></div><div style={{fontSize:13,fontWeight:600,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:isActive?'#fff':'#f4f4f5'}}>{inq.title}</div><div style={{fontSize:12,color:isActive?'#d1d5db':'#b3b3bc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clientName}</div>
                      {inq.last_message && (
                        <div style={{fontSize:11,color:isActive?'#a0a0a9':'#a0a0a9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>
                          {inq.last_message.is_admin?'You: ':'Client: '}{inq.last_message.body}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Thread panel */}
              <div style={s.card}>
                {activeInquiry ? (
                  <>
                    {/* Inquiry header */}
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,gap:12,flexWrap:'wrap'}}><div><div style={{fontSize:11,fontWeight:700,fontFamily:'monospace',color:'#a0a0a9',marginBottom:3}}>{activeInquiry.inquiry_number}</div><h3 style={{...s.cardTitle,margin:0}}>{activeInquiry.title}</h3><div style={{fontSize:12,color:'#b3b3bc',marginTop:2}}>
                          {activeInquiry.client?.business_name || activeInquiry.client?.contact_name || 'Client'}
                        </div></div><div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                        {/* Status changer */}
                        <select value={activeInquiry.status} onChange={e=>updateInqStatus(activeInquiry.id,e.target.value)}
                          style={{padding:'5px 10px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',color:'#e4e4e7',background:'#121214'}}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select></div></div>

                    {/* Messages */}
                    <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16,minHeight:220,maxHeight:380,overflowY:'auto',padding:'4px'}}>
                      {inqThread.length===0 && (
                        <div style={{color:'#a0a0a9',fontSize:13,textAlign:'center',padding:'40px 0'}}>Loading thread…</div>
                      )}
                      {inqThread.map((msg,i)=>(
                        <div key={msg.id||i} style={{display:'flex',flexDirection:'column',alignItems:msg.is_admin?'flex-end':'flex-start',gap:2}}><span style={{fontSize:11,color:'#a0a0a9',paddingLeft:msg.is_admin?0:4,paddingRight:msg.is_admin?4:0}}>
                            {msg.is_admin?'You (S&A)':'Client'} · {new Date(msg.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true})}
                          </span><div style={{maxWidth:'78%',padding:'9px 13px',borderRadius:10,fontSize:13,lineHeight:'1.55',background:msg.is_admin?'#ffc800':'#141417',color:msg.is_admin?'#fff':'#f4f4f5',borderBottomRightRadius:msg.is_admin?3:12,borderBottomLeftRadius:msg.is_admin?12:3}}>
                            {msg.body}
                          </div></div>
                      ))}
                    </div>

                    {/* Reply */}
                    {activeInquiry.status!=='resolved' ? (
                      <div style={{display:'flex',gap:8}}><input
                          value={inqReply}
                          onChange={e=>setInqReply(e.target.value)}
                          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendInqReply()}
                          style={{...s.inp,flex:1}}
                          placeholder={`Reply to ${activeInquiry.client?.business_name||'client'}…`}
                        /><button onClick={sendInqReply} disabled={!inqReply.trim()||inqSending} style={{...s.saveBtn,opacity:(!inqReply.trim()||inqSending)?0.5:1}}>
                          {inqSending?'Sending…':'Send'}
                        </button></div>
                    ) : (
                      <div style={{padding:'10px 14px',background:'rgba(52,211,153,0.14)',borderRadius:10,fontSize:12,color:'#34d399',fontWeight:600,textAlign:'center'}}>
                         Inquiry resolved. Change status above to reopen.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={s.empty}>Select an inquiry to view the thread and reply</div>
                )}
              </div></div></div>
        )}

        {section==='orders' && <AdminOrders />}

        {/* REQUESTS */}
        {section==='requests' && (
          <div style={s.sec}><h1 style={s.h1}>Product Requests</h1><p style={s.sub}>{requests.filter(r=>r.status==='pending').length} pending · {requests.length} total</p>

            {requests.length === 0 ? (
              <div style={{...s.card,...s.empty}}><div style={{fontSize:36,marginBottom:10}}></div><div style={{fontWeight:600,color:'#e4e4e7',marginBottom:4}}>No requests yet</div><div style={{fontSize:13}}>Client product requests will appear here.</div></div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {requests.map(r => {
                  const clientName = r.profiles?.business_name || r.profiles?.contact_name || r.profiles?.email || 'Unknown client';
                  const statusStyle = r.status==='pending' ? {bg:'rgba(255,200,0,0.14)',color:'#ffc800'} : r.status==='sourced' ? {bg:'rgba(52,211,153,0.14)',color:'#34d399'} : r.status==='declined' ? {bg:'rgba(248,113,113,0.14)',color:'#fca5a5'} : {bg:'rgba(96,165,250,0.14)',color:'#93c5fd'};
                  return (
                    <div key={r.id} style={{...s.card,...(r.status==='pending'?{borderLeft:'3px solid #f59e0b'}:{})}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}><span style={{fontSize:14,fontWeight:700,color:'#f4f4f5'}}>{r.garment_name}</span><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,background:statusStyle.bg,color:statusStyle.color}}>{r.status}</span></div><div style={{fontSize:13,color:'#b3b3bc',marginBottom:4}}>
                             {clientName}
                            {r.brand && <> · Brand: <strong>{r.brand}</strong></>}
                            {r.sku && <> · SKU: <strong>{r.sku}</strong></>}
                          </div>
                          {r.notes && <div style={{fontSize:12,color:'#b3b3bc',fontStyle:'italic'}}>"{r.notes}"</div>}
                          <div style={{fontSize:11,color:'#a0a0a9',marginTop:6}}>{new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          {r.status==='pending' && <><button onClick={()=>updateRequestStatus(r.id,'reviewed')} style={s.smBtn}>Mark Reviewed</button><button onClick={()=>updateRequestStatus(r.id,'sourced')} style={{...s.smBtn,color:'#34d399',borderColor:'rgba(52,211,153,0.4)'}}> Sourced</button><button onClick={()=>updateRequestStatus(r.id,'declined')} style={{...s.smBtn,color:'#dc2626',borderColor:'rgba(248,113,113,0.4)'}}>Decline</button></>}
                          {r.status==='reviewed' && <><button onClick={()=>updateRequestStatus(r.id,'sourced')} style={{...s.smBtn,color:'#34d399',borderColor:'rgba(52,211,153,0.4)'}}> Mark Sourced</button><button onClick={()=>updateRequestStatus(r.id,'declined')} style={{...s.smBtn,color:'#dc2626',borderColor:'rgba(248,113,113,0.4)'}}>Decline</button></>}
                          <button onClick={()=>{setSection('messages');}} style={s.smBtn}> Message</button></div></div></div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ARTWORK */}
        {section==='designs' && (
          <div style={s.sec}><h1 style={s.h1}>Designs</h1><p style={{...s.sub,color:'#e4e4e7'}}>Review what POD clients create in the Design Studio. Open a design to look at the artwork, then approve it or send it back with a reason.</p><div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
              {['All','Submitted','Approved','In Setup','Live','Denied'].map(f=>(
                <button key={f} onClick={()=>setDesignFilter(f)} style={{padding:'7px 14px',border:'1px solid '+(designFilter===f?'#ffc800':'#34343a'),background:designFilter===f?'#ffc800':'#121214',color:designFilter===f?'#fff':'#f4f4f5',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  {f}{f!=='All' ? ` (${designs.filter(d=>(d.product?.status||'Submitted')===f).length})` : ''}
                </button>
              ))}
            </div>
            {designsLoading && designs.length===0 && <div style={{color:'#e4e4e7',padding:20}}>Loading…</div>}
            {!designsLoading && designs.length===0 && <div style={{...s.card,textAlign:'center',color:'#e4e4e7'}}>No designs yet.</div>}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
              {designs.filter(d=>designFilter==='All'||(d.product?.status||'Submitted')===designFilter).map(d=>{
                const st = d.product?.status || 'Submitted';
                const stc = ({Submitted:['rgba(255,200,0,0.14)','#ffc800'],Approved:['rgba(52,211,153,0.14)','#34d399'],Denied:['rgba(248,113,113,0.14)','#fca5a5'],'In Setup':['rgba(96,165,250,0.14)','#93c5fd'],Live:['rgba(52,211,153,0.14)','#34d399']})[st] || ['#141417','#f4f4f5'];
                const who = d.client?.business_name || d.client?.contact_name || 'Client';
                const first = Object.values(d.decorations?.previews || {})[0] || d.thumbnail;
                return (
                  <div key={d.id} onClick={()=>{setReviewing(d);setDenyNote('');setDenying(false);setViewerBg('checker');setViewerFile(null);setViewerZoom(1);}} style={{...s.card,padding:0,overflow:'hidden',cursor:'pointer',...(st==='Submitted'?{borderLeft:'4px solid #f59e0b'}:{})}}>
                    <div style={{background:'#fff',borderBottom:'1px solid #e5e7eb',height:190,display:'grid',placeItems:'center'}}>
                      {first && <img src={first} alt="" style={{maxWidth:'100%',maxHeight:190,objectFit:'contain'}}/>}
                    </div><div style={{padding:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:6}}><strong style={{fontSize:16,color:'#f4f4f5'}}>{d.name}</strong><span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:10,background:stc[0],color:stc[1]}}>{st}</span></div><div style={{fontSize:14,color:'#f4f4f5',fontWeight:600}}>{who}</div><div style={{fontSize:13,color:'#e4e4e7',margin:'3px 0 6px'}}>{d.product?.productTitle}{d.product?.variantTitle?` · ${d.product.variantTitle}`:''}</div>{d.product?.sku && <div style={{fontSize:12,color:'#ffc800',fontWeight:700,letterSpacing:0.5,margin:'0 0 10px'}}>SKU {d.product.sku}</div>}
                      {st==='Submitted' ? (
                        <div style={{display:'flex',gap:8}} onClick={e=>e.stopPropagation()}><button onClick={()=>setDesignStatus(d.id,'Approved')} style={{flex:1,padding:'9px',background:'#16a34a',color:'#fff',border:'none',borderRadius:10,fontWeight:700,fontSize:13,cursor:'pointer'}}>Approve</button><button onClick={()=>{setReviewing(d);setDenyNote('');setDenying(true);setViewerFile(null);}} style={{flex:1,padding:'9px',background:'#121214',color:'#fca5a5',border:'1px solid rgba(248,113,113,0.4)',borderRadius:10,fontWeight:700,fontSize:13,cursor:'pointer'}}>Deny</button></div>
                      ) : <div style={{fontSize:13,color:'#93c5fd',fontWeight:600}}>Open to review</div>}
                    </div></div>
                );
              })}
            </div>

            {reviewing && (() => {
              const d = designs.find(x=>x.id===reviewing.id) || reviewing;
              const st = d.product?.status || 'Submitted';
              const files = d.decorations?.printFiles || [];
              const previews = Object.entries(d.decorations?.previews || {});
              const bgStyle = viewerBg==='checker'
                ? {backgroundColor:'#fff',backgroundImage:'linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%),linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%)',backgroundSize:'20px 20px',backgroundPosition:'0 0,10px 10px'}
                : {background: viewerBg==='black' ? '#000' : '#fff'};
              const shown = viewerFile || (files[0] ? {url:files[0].url,label:`${files[0].viewName} · ${files[0].printAreaLabel} (print file)`,file:`${d.name}-${files[0].viewName}-${files[0].printAreaLabel}.png`.replace(/[^a-zA-Z0-9._-]+/g,'-')} : (previews[0] ? {url:previews[0][1],label:`${previews[0][0]} preview`} : null));
              return (
                <div onClick={e=>{if(e.target===e.currentTarget)setReviewing(null);}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{background:'#121214',borderRadius:10,width:'100%',maxWidth:1100,maxHeight:'92vh',overflow:'auto',display:'grid',gridTemplateColumns:'minmax(0,1.5fr) minmax(300px,1fr)'}}><div style={{padding:20,borderRight:'1px solid rgba(255,255,255,0.08)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:8,flexWrap:'wrap'}}><div style={{fontSize:14,fontWeight:700,color:'#f4f4f5'}}>{shown?.label || 'No image'}</div><div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}><button onClick={()=>setViewerZoom(z=>Math.max(1,+(z/1.5).toFixed(2)))} disabled={viewerZoom<=1} title="Zoom out" style={{width:32,height:30,fontSize:18,fontWeight:700,border:'1px solid #34343a',background:'#121214',color:'#f4f4f5',borderRadius:10,cursor:viewerZoom<=1?'default':'pointer',opacity:viewerZoom<=1?0.4:1}}>−</button><button onClick={()=>setViewerZoom(1)} title="Fit to window" style={{minWidth:58,height:30,fontSize:12,fontWeight:700,border:'1px solid #34343a',background:'#121214',color:'#f4f4f5',borderRadius:10,cursor:'pointer'}}>{viewerZoom===1?'Fit':Math.round(viewerZoom*100)+'%'}</button><button onClick={()=>setViewerZoom(z=>Math.min(12,+(z*1.5).toFixed(2)))} title="Zoom in" style={{width:32,height:30,fontSize:18,fontWeight:700,border:'1px solid #34343a',background:'#121214',color:'#f4f4f5',borderRadius:10,cursor:'pointer'}}>+</button><span style={{width:8}}/>
                          {[['checker','Checker'],['white','White'],['black','Black']].map(([k,l])=>(
                            <button key={k} onClick={()=>setViewerBg(k)} style={{padding:'5px 11px',fontSize:12,fontWeight:600,border:'1px solid '+(viewerBg===k?'#ffc800':'#34343a'),background:viewerBg===k?'#ffc800':'#121214',color:viewerBg===k?'#fff':'#f4f4f5',borderRadius:10,cursor:'pointer'}}>{l}</button>
                          ))}
                        </div></div><div style={{...bgStyle,borderRadius:10,border:'1px solid #34343a',height:'62vh',minHeight:380,overflow:'auto',display:'flex',alignItems:viewerZoom>1?'flex-start':'center',justifyContent:viewerZoom>1?'flex-start':'center',padding:12}}>
                        {shown && <img src={shown.url} alt="" draggable={false} style={viewerZoom===1?{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}:{width:(viewerZoom*100)+'%',maxWidth:'none',height:'auto',flex:'none',imageRendering:viewerZoom>=4?'pixelated':'auto'}}/>}
                      </div>
                      {shown && shown.file && (
                        <button onClick={()=>downloadFile(shown.url, shown.file)} style={{marginTop:12,padding:'10px 16px',background:'#ffc800',color:'#000',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer'}}>Download this print file</button>
                      )}
                      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                        {previews.map(([view,url])=>(
                          <button key={'p'+view} onClick={()=>pickViewer({url,label:`${view} preview`})} style={{padding:'6px 12px',fontSize:12,fontWeight:600,border:'1px solid #34343a',background:'#121214',color:'#f4f4f5',borderRadius:10,cursor:'pointer'}}>{view} preview</button>
                        ))}
                        {files.map(f=>(
                          <button key={f.url} onClick={()=>pickViewer({url:f.url,label:`${f.viewName} · ${f.printAreaLabel} (print file)`,file:`${d.name}-${f.viewName}-${f.printAreaLabel}.png`.replace(/[^a-zA-Z0-9._-]+/g,'-')})} style={{padding:'6px 12px',fontSize:12,fontWeight:600,border:'1px solid #2563eb',background:'rgba(96,165,250,0.12)',color:'#93c5fd',borderRadius:10,cursor:'pointer'}}>Print file: {f.viewName} · {f.printAreaLabel}</button>
                        ))}
                      </div></div><div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div style={{fontSize:20,fontWeight:800,color:'#f4f4f5'}}>{d.name}</div><div style={{fontSize:14,color:'#e4e4e7',marginTop:2}}>{d.client?.business_name || d.client?.contact_name || 'Client'}{d.client?.email?` · ${d.client.email}`:''}</div></div><button onClick={()=>setReviewing(null)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#e4e4e7'}}>×</button></div><div style={{fontSize:14,color:'#f4f4f5',lineHeight:1.6}}><div><strong>Product:</strong> {d.product?.productTitle}</div>
                        {d.product?.variantTitle && <div><strong>Variant:</strong> {d.product.variantTitle}</div>}
                        <div><strong>Submitted:</strong> {new Date(d.created_at).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})}</div><div><strong>Status:</strong> {st}</div>{d.product?.sku && (<div style={{marginTop:10}}><label style={{fontSize:12,fontWeight:700,color:'#b3b3bc',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:5}}>SKU</label><div style={{display:'flex',gap:6}}><input value={skuDraft[d.id] ?? d.product.sku} onChange={e=>setSkuDraft(x=>({...x,[d.id]:e.target.value}))} style={{flex:1,minWidth:0,padding:'9px 10px',border:'1px solid #34343a',background:'#070708',color:'#ffc800',fontWeight:700,fontSize:14,borderRadius:10,letterSpacing:0.5}}/><button onClick={()=>saveSku(d.id)} disabled={skuDraft[d.id]===undefined || skuDraft[d.id]===d.product.sku} style={{padding:'9px 14px',background:'#ffc800',color:'#000',border:'none',fontWeight:800,fontSize:13,cursor:'pointer',opacity:(skuDraft[d.id]===undefined||skuDraft[d.id]===d.product.sku)?0.4:1}}>Save</button><button onClick={()=>navigator.clipboard?.writeText(d.product.sku)} style={{padding:'9px 12px',background:'transparent',color:'#f4f4f5',border:'1px solid #34343a',fontWeight:700,fontSize:13,cursor:'pointer'}}>Copy</button></div></div>)}
                        {d.product?.reviewNote && <div style={{marginTop:6,padding:'8px 10px',background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.35)',borderRadius:10,color:'#fca5a5'}}><strong>Reason sent to client:</strong> {d.product.reviewNote}</div>}
                      </div>

                      {denying ? (
                        <div><label style={{fontSize:13,fontWeight:700,color:'#f4f4f5',display:'block',marginBottom:6}}>Why is it being denied? The client sees this.</label><textarea value={denyNote} onChange={e=>setDenyNote(e.target.value)} rows={4} placeholder="Low resolution logo, please upload a vector file" style={{width:'100%',padding:10,border:'1px solid #34343a',borderRadius:10,fontSize:14,color:'#f4f4f5',boxSizing:'border-box'}}/><div style={{display:'flex',gap:8,marginTop:10}}><button disabled={!denyNote.trim()} onClick={async()=>{await setDesignStatus(d.id,'Denied',denyNote.trim());setDenying(false);setReviewing(null);}} style={{flex:1,padding:'11px',background:denyNote.trim()?'#dc2626':'#fca5a5',color:'#fff',border:'none',borderRadius:10,fontWeight:700,cursor:denyNote.trim()?'pointer':'default'}}>Send denial</button><button onClick={()=>setDenying(false)} style={{padding:'11px 16px',background:'#121214',border:'1px solid #34343a',color:'#f4f4f5',borderRadius:10,fontWeight:600,cursor:'pointer'}}>Cancel</button></div></div>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          {(st==='Submitted'||st==='Denied') && <button onClick={async()=>{await setDesignStatus(d.id,'Approved');setReviewing(null);}} style={{padding:'12px',background:'#16a34a',color:'#fff',border:'none',borderRadius:10,fontWeight:800,fontSize:15,cursor:'pointer'}}>Approve</button>}
                          {st!=='Denied' && <button onClick={()=>{setDenying(true);setDenyNote('');}} style={{padding:'12px',background:'#121214',color:'#fca5a5',border:'1px solid rgba(248,113,113,0.4)',borderRadius:10,fontWeight:800,fontSize:15,cursor:'pointer'}}>Deny with a reason</button>}
                          {(st==='Approved'||st==='In Setup'||st==='Live') && (
                            <div><label style={{fontSize:13,fontWeight:700,color:'#f4f4f5',display:'block',marginBottom:6}}>Setup stage</label><select value={st} onChange={e=>setDesignStatus(d.id,e.target.value)} style={{width:'100%',padding:'10px',border:'1px solid #34343a',borderRadius:10,fontSize:14,color:'#f4f4f5'}}>
                                {['Approved','In Setup','Live'].map(o=><option key={o}>{o}</option>)}
                              </select></div>
                          )}
                        </div>
                      )}
                    </div></div></div>
              );
            })()}
          </div>
        )}

        {section==='pricing' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Pricing</h1>
            <p style={{...s.sub,color:'#e4e4e7'}}>Enter what each product costs you. Clients see one number, their total cost per item, and use it to work out their profit. Nothing is guessed: products with no numbers show clients that pricing is coming.</p>
            {priceLoading && priceData.products.length===0 && <div style={{color:'#e4e4e7',padding:20}}>Loading…</div>}
            <div style={{...s.card,padding:0,overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:760}}>
                <thead><tr>{['Product','Blank cost','Print cost','Shipping','Suggested price','Client pays',''].map(h=><th key={h} style={{textAlign:'left',padding:'12px 14px',fontSize:11,letterSpacing:1.5,textTransform:'uppercase',color:'#b3b3bc',borderBottom:'1px solid #222226'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {priceData.products.map(p=>{
                    const cur = priceData.pricing[p.id] || {};
                    const e = priceEdit[p.id] || {};
                    const val = (k) => e[k] ?? (cur[k] ?? '');
                    const total = ['base_cost','print_cost','shipping_cost'].reduce((t,k)=>t+(parseFloat(val(k))||0),0);
                    const inp = (k) => <input type="number" min="0" step="0.01" value={val(k)} onChange={ev=>setPriceEdit(x=>({...x,[p.id]:{...(x[p.id]||{}),[k]:ev.target.value}}))} placeholder="0.00" style={{width:88,padding:'7px 8px',background:'#070708',border:'1px solid #34343a',color:'#f4f4f5',fontSize:13,borderRadius:10}}/>;
                    return (
                      <tr key={p.id} style={{borderBottom:'1px solid #1c1c20'}}>
                        <td style={{padding:'10px 14px',color:'#f4f4f5',maxWidth:280}}>{p.title}</td>
                        <td style={{padding:'10px 14px'}}>{inp('base_cost')}</td>
                        <td style={{padding:'10px 14px'}}>{inp('print_cost')}</td>
                        <td style={{padding:'10px 14px'}}>{inp('shipping_cost')}</td>
                        <td style={{padding:'10px 14px'}}>{inp('suggested_price')}</td>
                        <td style={{padding:'10px 14px',color:'#ffc800',fontWeight:700}}>${total.toFixed(2)}</td>
                        <td style={{padding:'10px 14px'}}><button onClick={()=>savePriceRow(p)} disabled={!priceEdit[p.id]} style={{padding:'7px 14px',background:'#ffc800',color:'#000',border:'none',fontWeight:800,fontSize:12,cursor:'pointer',opacity:priceEdit[p.id]?1:0.35}}>{priceSaved===p.id?'Saved':'Save'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section==='samples' && (
          <div style={s.sec}>
            <h1 style={s.h1}>Samples</h1>
            <p style={{...s.sub,color:'#e4e4e7'}}>Sample requests from clients for approved designs.</p>
            {sampleList.length===0 && <div style={{...s.card,textAlign:'center',color:'#e4e4e7'}}>No sample requests yet.</div>}
            <div style={{display:'grid',gap:12}}>
              {sampleList.map(sm=>(
                <div key={sm.id} style={{...s.card,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap',justifyContent:'space-between'}}>
                  <div style={{minWidth:240}}>
                    <div style={{fontWeight:700,color:'#f4f4f5'}}>{sm.design?.name || 'Design'} <span style={{color:'#ffc800',fontWeight:700}}>{sm.design?.product?.sku ? '· '+sm.design.product.sku : ''}</span></div>
                    <div style={{fontSize:13,color:'#e4e4e7',marginTop:3}}>{sm.client?.business_name || sm.client?.contact_name || 'Client'} · {sm.quantity} sample{sm.quantity>1?'s':''}{sm.size_note?` · ${sm.size_note}`:''}</div>
                    <div style={{fontSize:12,color:'#b3b3bc',marginTop:2}}>{new Date(sm.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                    <select value={sm.status} onChange={e=>updateSample(sm.id,{status:e.target.value})} style={{padding:'9px 10px',background:'#070708',border:'1px solid #34343a',color:'#f4f4f5',fontSize:13,borderRadius:10}}>
                      <option value="requested">Requested</option><option value="in_production">In production</option><option value="shipped">Shipped</option>
                    </select>
                    <input defaultValue={sm.tracking_number||''} placeholder="Tracking number" onBlur={e=>{ if ((e.target.value||'')!==(sm.tracking_number||'')) updateSample(sm.id,{tracking_number:e.target.value}); }} style={{padding:'9px 10px',background:'#070708',border:'1px solid #34343a',color:'#f4f4f5',fontSize:13,borderRadius:10,width:180}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section==='poddesk' && (() => {
          const LBL = { new:'New', in_production:'In production', shipped:'Shipped', cancelled:'Cancelled' };
          const TONE = { new:['rgba(255,200,0,0.14)','#ffc800'], in_production:['rgba(96,165,250,0.14)','#93c5fd'], shipped:['rgba(52,211,153,0.14)','#34d399'], cancelled:['rgba(248,113,113,0.14)','#fca5a5'] };
          const list = (podOrders||[]).filter(o => podFilter==='all' ? true : podFilter==='open' ? (o.status==='new'||o.status==='in_production') : o.status===podFilter);
          const open = podOrders && podOpen ? podOrders.find(o=>o.id===podOpen) : null;
          const bgStyle = podBg==='checker'
            ? {backgroundColor:'#fff',backgroundImage:'linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%),linear-gradient(45deg,#d1d5db 25%,transparent 25%,transparent 75%,#d1d5db 75%)',backgroundSize:'20px 20px',backgroundPosition:'0 0,10px 10px'}
            : {background: podBg==='black' ? '#000' : '#fff'};
          return (
          <div style={s.sec}>
            <h1 style={s.h1}>S&A POD</h1>
            <p style={{...s.sub,color:'#e4e4e7'}}>Sales of POD client designs. Print each order, then ship it with a tracking number. The tracking number goes straight to the client's store and emails their customer.</p>
            <div style={{display:'flex',gap:8,marginBottom:18,flexWrap:'wrap'}}>
              {[['open','Open'],['new','New'],['in_production','In production'],['shipped','Shipped'],['cancelled','Cancelled'],['all','All']].map(([k,l])=>(
                <button key={k} onClick={()=>setPodFilter(k)} style={{padding:'8px 14px',border:'1px solid '+(podFilter===k?'#ffc800':'#34343a'),background:podFilter===k?'#ffc800':'transparent',color:podFilter===k?'#000':'#f4f4f5',fontSize:13,fontWeight:700,cursor:'pointer'}}>{l}{podOrders?` (${podOrders.filter(o=>k==='all'?true:k==='open'?(o.status==='new'||o.status==='in_production'):o.status===k).length})`:''}</button>
              ))}
            </div>
            {podOrders===null && <div style={{color:'#e4e4e7',padding:20}}>Loading…</div>}
            {podOrders && list.length===0 && <div style={{...s.card,textAlign:'center',color:'#e4e4e7'}}>No orders here yet. When a customer buys a client's POD product, it appears here.</div>}
            <div style={{display:'grid',gap:10}}>
              {list.map(o=>(
                <div key={o.id} onClick={()=>{setPodOpen(o.id);setPodMsg('');setPodView(null);setPodZoom(1);setPodTrack({carrier:o.trackingCarrier||'USPS',number:o.trackingNumber||''});}} style={{...s.card,cursor:'pointer',display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontWeight:800,color:'#f4f4f5',fontSize:15}}>{o.name} <span style={{color:'#b3b3bc',fontWeight:500,fontSize:13}}>· {o.shop}</span></div>
                    <div style={{fontSize:13,color:'#e4e4e7',marginTop:3}}>{o.items.map(i=>`${i.quantity}x ${i.design?.name||i.title}`).join(', ')||'Order'}</div>
                    <div style={{fontSize:12,color:'#b3b3bc',marginTop:2}}>{o.customerName||'Customer'} · {new Date(o.placedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}{o.trackingNumber?` · ${o.trackingCarrier||''} ${o.trackingNumber}`:''}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',background:(TONE[o.status]||TONE.new)[0],color:(TONE[o.status]||TONE.new)[1]}}>{LBL[o.status]||o.status}</span>
                </div>
              ))}
            </div>

            {open && (
              <div onClick={e=>{if(e.target===e.currentTarget)setPodOpen(null);}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div style={{background:'#121214',border:'1px solid #34343a',borderTop:'3px solid #ffc800',width:'100%',maxWidth:1100,maxHeight:'92vh',overflow:'auto',display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(300px,1fr)'}}>
                  <div style={{padding:20,borderRight:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'#b3b3bc',marginBottom:10}}>Print files</div>
                    {open.items.length===0 && <div style={{color:'#e4e4e7'}}>No POD designs matched on this order.</div>}
                    {open.items.map(it=>(
                      <div key={it.id} style={{marginBottom:18}}>
                        <div style={{fontWeight:700,color:'#f4f4f5'}}>{it.quantity}x {it.design?.name||it.title} <span style={{color:'#ffc800',fontWeight:700}}>{it.sku||''}</span></div>
                        <div style={{fontSize:13,color:'#e4e4e7',margin:'2px 0 8px'}}>{it.title}{it.variantTitle?` · ${it.variantTitle}`:''}</div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          {(it.design?.printFiles||[]).map(f=>(
                            <button key={f.url} onClick={()=>{setPodView({url:f.url,label:`${it.design.name} · ${f.viewName} · ${f.printAreaLabel}`,file:`${open.name.replace('#','')}-${f.viewName}-${f.printAreaLabel}.png`.replace(/[^a-zA-Z0-9._-]+/g,'-')});setPodZoom(1);}} style={{padding:'7px 12px',fontSize:12,fontWeight:700,border:'1px solid #ffc800',background:'rgba(255,200,0,0.1)',color:'#ffc800',cursor:'pointer'}}>{f.viewName} · {f.printAreaLabel}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {podView && (
                      <div>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',alignItems:'center',margin:'6px 0 10px'}}>
                          <div style={{fontSize:13,fontWeight:700,color:'#f4f4f5'}}>{podView.label}</div>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            <button onClick={()=>setPodZoom(z=>Math.max(1,+(z/1.5).toFixed(2)))} disabled={podZoom<=1} style={{width:32,height:30,fontSize:18,fontWeight:700,border:'1px solid #34343a',background:'transparent',color:'#f4f4f5',cursor:'pointer',opacity:podZoom<=1?0.4:1}}>−</button>
                            <button onClick={()=>setPodZoom(1)} style={{minWidth:56,height:30,fontSize:12,fontWeight:700,border:'1px solid #34343a',background:'transparent',color:'#f4f4f5',cursor:'pointer'}}>{podZoom===1?'Fit':Math.round(podZoom*100)+'%'}</button>
                            <button onClick={()=>setPodZoom(z=>Math.min(12,+(z*1.5).toFixed(2)))} style={{width:32,height:30,fontSize:18,fontWeight:700,border:'1px solid #34343a',background:'transparent',color:'#f4f4f5',cursor:'pointer'}}>+</button>
                            {[['checker','Checker'],['white','White'],['black','Black']].map(([k,l])=>(<button key={k} onClick={()=>setPodBg(k)} style={{padding:'0 11px',height:30,fontSize:12,fontWeight:700,border:'1px solid '+(podBg===k?'#ffc800':'#34343a'),background:podBg===k?'#ffc800':'transparent',color:podBg===k?'#000':'#f4f4f5',cursor:'pointer'}}>{l}</button>))}
                          </div>
                        </div>
                        <div style={{...bgStyle,height:'50vh',overflow:'auto',display:'flex',alignItems:podZoom>1?'flex-start':'center',justifyContent:podZoom>1?'flex-start':'center',padding:12,border:'1px solid #34343a'}}>
                          <img src={podView.url} alt="" draggable={false} style={podZoom===1?{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}:{width:(podZoom*100)+'%',maxWidth:'none',height:'auto',flex:'none',imageRendering:podZoom>=4?'pixelated':'auto'}}/>
                        </div>
                        <button onClick={()=>downloadFile(podView.url,podView.file)} style={{marginTop:12,padding:'10px 16px',background:'#ffc800',color:'#000',border:'none',fontWeight:800,fontSize:13,cursor:'pointer'}}>Download this print file</button>
                      </div>
                    )}
                  </div>
                  <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div><div style={{fontSize:22,fontWeight:800,color:'#f4f4f5'}}>{open.name}</div><div style={{fontSize:13,color:'#b3b3bc'}}>{open.shop}</div></div>
                      <button onClick={()=>setPodOpen(null)} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#e4e4e7'}}>×</button>
                    </div>
                    <span style={{alignSelf:'flex-start',fontSize:12,fontWeight:700,padding:'4px 12px',background:(TONE[open.status]||TONE.new)[0],color:(TONE[open.status]||TONE.new)[1]}}>{LBL[open.status]||open.status}</span>
                    <div style={{fontSize:14,color:'#e4e4e7',lineHeight:1.7}}>
                      <div style={{fontWeight:700,color:'#f4f4f5'}}>Ship to</div>
                      <div>{open.customerName||'Customer'}</div>
                      <div>{[open.shipTo?.address1,open.shipTo?.address2].filter(Boolean).join(', ')}</div>
                      <div>{[open.shipTo?.city,open.shipTo?.province_code||open.shipTo?.province,open.shipTo?.zip].filter(Boolean).join(', ')}</div>
                      <div>{open.shipTo?.country}</div>
                      {open.customerEmail && <div style={{color:'#b3b3bc'}}>{open.customerEmail}</div>}
                    </div>
                    {podMsg && <div style={{padding:'10px 12px',border:'1px solid '+(podMsg.startsWith('ok:')?'rgba(52,211,153,0.5)':'rgba(248,113,113,0.5)'),color:podMsg.startsWith('ok:')?'#34d399':'#fca5a5',fontSize:13}}>{podMsg.slice(podMsg.indexOf(':')+1)}</div>}
                    {open.status==='new' && <button disabled={podBusy} onClick={()=>podAct(open.id,{intent:'in_production'})} style={{padding:'12px',background:'#ffc800',color:'#000',border:'none',fontWeight:800,fontSize:14,cursor:'pointer'}}>Start production</button>}
                    {open.status!=='cancelled' && (
                      <div style={{display:'grid',gap:8}}>
                        <div style={{fontWeight:700,color:'#f4f4f5',fontSize:14}}>Shipping</div>
                        <select value={podTrack.carrier} onChange={e=>setPodTrack(t=>({...t,carrier:e.target.value}))} style={{padding:'10px',background:'#070708',border:'1px solid #34343a',color:'#f4f4f5',fontSize:14,borderRadius:10}}>
                          {['USPS','UPS','FedEx','DHL','Other'].map(c=><option key={c}>{c}</option>)}
                        </select>
                        <input value={podTrack.number} onChange={e=>setPodTrack(t=>({...t,number:e.target.value}))} placeholder="Tracking number" style={{padding:'10px',background:'#070708',border:'1px solid #34343a',color:'#f4f4f5',fontSize:14,borderRadius:10}}/>
                        <button disabled={podBusy||!podTrack.number.trim()} onClick={()=>podAct(open.id,{intent:'ship',tracking:podTrack.number,carrier:podTrack.carrier})} style={{padding:'12px',background:open.status==='in_production'?'#ffc800':'transparent',color:open.status==='in_production'?'#000':'#f4f4f5',border:open.status==='in_production'?'none':'1px solid #34343a',fontWeight:800,fontSize:14,cursor:'pointer',opacity:podTrack.number.trim()?1:0.5}}>{open.status==='shipped'?'Update tracking':'Mark shipped'}</button>
                        <div style={{fontSize:12,color:'#b3b3bc'}}>Sends the tracking number to {open.shop} and emails the customer.</div>
                      </div>
                    )}
                    {open.status==='shipped' && !open.trackingSent && <div style={{fontSize:13,color:'#ffc800'}}>Marked shipped, but the tracking number has not reached the store yet. Use Update tracking to retry.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {section==='artwork' && (
          <div style={s.sec}><h1 style={s.h1}>Design Vault</h1><p style={s.sub}>Manage client artwork — approve, reject, and upload on behalf of clients</p>

            {/* Stats row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[
                {label:'On File',    value:artwork.filter(a=>a.status==='approved').length, color:'#34d399'},
                {label:'Pending',    value:artwork.filter(a=>a.status==='pending').length,  color:'#ffc800'},
                {label:'Total Files',value:artwork.length,                                  color:'#e4e4e7'},
              ].map(st=>(
                <div key={st.label} style={s.statCard}><div style={{fontSize:11,color:'#b3b3bc',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>{st.label}</div><div style={{fontSize:22,fontWeight:700,color:st.color}}>{st.value}</div></div>
              ))}
            </div>

            {/* Admin upload panel */}
            <div style={{...s.card,marginBottom:20,borderLeft:'3px solid #6366f1'}}><h3 style={{...s.cardTitle,marginBottom:14}}> Upload Artwork for a Client</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}><div><label style={{fontSize:12,fontWeight:600,color:'#b3b3bc',display:'block',marginBottom:4}}>Client</label><select value={artworkAdminUpClient} onChange={e=>setArtworkAdminUpClient(e.target.value)} style={{...s.inp,width:'100%'}}><option value=''>— Select client —</option>
                    {clientProfiles.map(p=>(
                      <option key={p.id} value={p.id}>{p.business_name || p.contact_name}</option>
                    ))}
                  </select></div><div><label style={{fontSize:12,fontWeight:600,color:'#b3b3bc',display:'block',marginBottom:4}}>Design Label</label><input type='text' placeholder='e.g. Main Logo, Jersey Front…' value={artworkAdminUpLabel} onChange={e=>setArtworkAdminUpLabel(e.target.value)} style={{...s.inp,width:'100%'}}/></div></div><input ref={artworkFileRef} type='file' multiple accept='.svg,.ai,.pdf,.png,.jpg,.jpeg,.eps,.gif,.webp' style={{display:'none'}} onChange={e=>adminUploadArt(e.target.files)}/><button onClick={()=>artworkAdminUpClient&&artworkFileRef.current?.click()} disabled={!artworkAdminUpClient||artworkAdminUploading}
                style={{...s.saveBtn,background:'#6366f1',opacity:(!artworkAdminUpClient||artworkAdminUploading)?0.5:1}}>
                {artworkAdminUploading?'Uploading…':'Choose Files & Upload'}
              </button>
              {!artworkAdminUpClient&&<span style={{fontSize:12,color:'#a0a0a9',marginLeft:10}}>Select a client first</span>}
              {artworkAdminUpMsg&&<div style={{marginTop:10,padding:'8px 12px',borderRadius:10,fontSize:13,background:artworkAdminUpMsg.startsWith('')?'rgba(52,211,153,0.14)':'rgba(248,113,113,0.14)',color:artworkAdminUpMsg.startsWith('')?'#34d399':'#fca5a5'}}>{artworkAdminUpMsg}</div>}
            </div>

            {/* Filters */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[['pending',' Pending'],['approved',' On File'],['rejected',' Rejected'],['all','All']].map(([val,label])=>(
                <button key={val} onClick={()=>setArtworkStatusFilter(val)}
                  style={{padding:'6px 14px',borderRadius:10,border:'none',background:artworkStatusFilter===val?'#ffc800':'#141417',color:artworkStatusFilter===val?'white':'#b3b3bc',fontSize:13,cursor:'pointer',fontWeight:artworkStatusFilter===val?'600':'400'}}>
                  {label}
                </button>
              ))}
              <div style={{marginLeft:'auto'}}><select value={artworkClientFilter} onChange={e=>setArtworkClientFilter(e.target.value)} style={{...s.inp,fontSize:12,padding:'6px 10px'}}><option value='all'>All Clients</option>
                  {[...new Map(artwork.map(a=>[a.client_id,a.client])).entries()].map(([id,cl])=>(
                    <option key={id} value={id}>{cl?.business_name||cl?.contact_name||'Unknown'}</option>
                  ))}
                </select></div></div>

            {artworkLoading ? (
              <div style={{textAlign:'center',padding:'40px',color:'#a0a0a9'}}>Loading artwork…</div>
            ) : (
              (() => {
                const filtered = artwork
                  .filter(a => artworkStatusFilter==='all' || a.status===artworkStatusFilter)
                  .filter(a => artworkClientFilter==='all' || a.client_id===artworkClientFilter);

                if (!filtered.length) return (
                  <div style={{textAlign:'center',padding:'48px',color:'#a0a0a9'}}><div style={{fontSize:32,marginBottom:8}}></div>
                    {artwork.length===0 ? 'No artwork uploaded yet.' : 'No files match this filter.'}
                  </div>
                );

                return filtered.map(a=>{
                  const clientName = a.client?.business_name || a.client?.contact_name || 'Unknown Client';
                  const dateStr    = new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
                  const isPending  = a.status==='pending';
                  const isApproved = a.status==='approved';
                  const isRejected = a.status==='rejected';
                  const noteVal    = artworkNotes[a.id] ?? (a.admin_notes || '');
                  return (
                    <div key={a.id} style={{...s.card,borderLeft:`3px solid ${isPending?'#f59e0b':isApproved?'#10b981':'#ef4444'}`,marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}><div style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}><span style={{fontSize:14,fontWeight:700,color:'#f4f4f5'}}>
                              {a.label || a.file_name}
                            </span><Badge status={a.status==='approved'?'approved':a.status==='rejected'?'rejected':'pending'}/></div>
                          {a.label && <div style={{fontSize:11,color:'#a0a0a9',marginBottom:2,wordBreak:'break-all'}}>{a.file_name}</div>}
                          <div style={{fontSize:13,color:'#b3b3bc'}}><strong style={{color:'#e4e4e7'}}>{clientName}</strong> · {dateStr}
                            {a.file_size ? ` · ${(a.file_size/1024/1024).toFixed(1)} MB` : ''}
                          </div>
                          {a.file_url&&<a href={a.file_url} target='_blank' rel='noopener noreferrer' style={{fontSize:12,color:'#6366f1',fontWeight:500}}>View file →</a>}
                        </div>
                        {isPending&&(
                          <div style={{display:'flex',gap:8,flexShrink:0}}><button onClick={()=>approveArt(a.id)} style={{...s.saveBtn,background:'#059669',padding:'7px 14px'}}> Approve</button><button onClick={()=>rejectArt(a.id)}  style={{...s.saveBtn,background:'#dc2626',padding:'7px 14px'}}> Reject</button></div>
                        )}
                        {isApproved&&(
                          <button onClick={()=>rejectArt(a.id)} style={{...s.cancelBtn,fontSize:12,padding:'6px 12px'}}>Move to Rejected</button>
                        )}
                        {isRejected&&(
                          <button onClick={()=>approveArt(a.id)} style={{...s.saveBtn,background:'#059669',padding:'7px 14px',fontSize:12}}> Approve</button>
                        )}
                      </div>

                      {/* Notes */}
                      <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center'}}><input
                          placeholder={isRejected?'Rejection reason for client…':'Add note for client…'}
                          value={noteVal}
                          onChange={e=>setArtworkNotes(n=>({...n,[a.id]:e.target.value}))}
                          style={{...s.inp,flex:1,fontSize:12,padding:'6px 10px'}}
                        /><button onClick={()=>saveArtNote(a.id)} style={{...s.saveBtn,padding:'6px 14px',fontSize:12}}>Save Note</button></div></div>
                  );
                });
              })()
            )}
          </div>
        )}

        {section==='billing' && <AdminBilling />}

        {section==='settings' && <AdminSettings />}
      </main>

    </div>
  );
}

const s = {
  loginBg:    {minHeight:'100vh',background:'#070708',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"var(--font-dm),'DM Sans',sans-serif"},
  loginCard:  {background:'#040405',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'44px 40px',width:320,textAlign:'center'},
  loginTitle: {color:'#fff',fontSize:22,fontWeight:700,margin:'0 0 4px'},
  loginSub:   {color:'#b3b3bc',fontSize:13,marginBottom:28},
  loginInput: {width:'100%',padding:'11px 14px',background:'#070708',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#fff',fontSize:14,textAlign:'center',outline:'none',fontFamily:'inherit',boxSizing:'border-box'},
  loginBtn:   {width:'100%',padding:'12px 0',background:'#ffc800',color:'#000000',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'},
  shell:      {display:'flex',minHeight:'100vh',fontFamily:"var(--font-dm),'DM Sans',sans-serif",background:'#070708',color:'#f4f4f5'},
  sidebar:    {width:236,background:'#040405',borderRight:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50,overflowY:'auto'},
  logo:       {display:'flex',alignItems:'center',gap:8,padding:'8px 8px 16px',borderBottom:'1px solid rgba(255,255,255,0.08)',marginBottom:8},
  urgentBanner:{background:'rgba(220,38,38,0.15)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:10,padding:'6px 10px',fontSize:11,color:'#fca5a5',lineHeight:1.4,marginTop:8},
  nav:        {flex:1,padding:'4px 8px',display:'flex',flexDirection:'column',gap:2},
  navBtn:     {display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:'transparent',border:'none',color:'#a0a0a9',fontSize:13,cursor:'pointer',width:'100%',transition:'all 0.15s'},
  navActive:  {background:'rgba(255,200,0,0.12)',color:'#fff'},
  navBadge:   {background:'#2a2a30',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10,minWidth:18,textAlign:'center'},
  sideBottom: {padding:'12px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',gap:8},
  main:       {flex:1,marginLeft:236,overflowY:'auto',minHeight:'100vh'},
  sec:        {padding:'32px 36px',maxWidth:1200},
  h1:         {fontSize:30,fontWeight:700,color:'#f4f4f5',margin:'0 0 4px',fontFamily:"var(--font-sora),'Sora',sans-serif",letterSpacing:'-0.02em'},
  sub:        {fontSize:14,color:'#b3b3bc',marginBottom:24},
  alertBanner:{display:'flex',alignItems:'center',gap:12,background:'rgba(248,113,113,0.14)',border:'1px solid rgba(248,113,113,0.4)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:14,color:'#fca5a5'},
  alertBannerBtn:{marginLeft:'auto',background:'#dc2626',color:'#fff',border:'none',borderRadius:10,padding:'4px 12px',fontSize:12,fontWeight:600,cursor:'pointer'},
  statsGrid:  {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:24},
  statCard:   {background:'#121214',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',padding:16,textAlign:'center'},
  card:       {background:'#121214',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',padding:20},
  cardTitle:  {fontSize:15,fontWeight:600,color:'#f4f4f5',marginBottom:14,marginTop:0},
  row:        {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #1c1c20',gap:12},
  viewAll:    {background:'none',border:'none',color:'#ffc800',fontSize:13,cursor:'pointer',padding:'8px 0',fontWeight:500},
  alertRow:   {background:'#121214',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:16},
  goBtn:      {background:'#ffc800',color:'#000',border:'none',borderRadius:10,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer'},
  dimBtn:     {background:'transparent',border:'1px solid #34343a',color:'#b3b3bc',borderRadius:10,padding:'5px 10px',fontSize:12,cursor:'pointer'},
  clientCard: {background:'#121214',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',padding:20,marginBottom:14},
  smBtn:      {background:'#141417',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'5px 12px',fontSize:12,fontWeight:500,cursor:'pointer',color:'#e4e4e7'},
  msgBtn:     {background:'#121214',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'12px',textAlign:'left',cursor:'pointer',transition:'all 0.15s',width:'100%'},
  inp:        {padding:'7px 9px',border:'1px solid #34343a',borderRadius:10,fontSize:13,color:'#f4f4f5',background:'#121214',fontFamily:'inherit',boxSizing:'border-box',width:'100%'},
  label:      {display:'block',fontSize:12.5,fontWeight:600,color:'#b3b3bc',textTransform:'none',letterSpacing:0,marginBottom:5},
  saveBtn:    {padding:'8px 18px',background:'#ffc800',color:'#000',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},
  cancelBtn:  {padding:'7px 14px',background:'transparent',border:'1px solid #34343a',color:'#b3b3bc',borderRadius:10,fontSize:13,cursor:'pointer'},
  tabs:       {display:'flex',gap:4,marginBottom:20,background:'#141417',padding:4,borderRadius:10,width:'fit-content'},
  tab:        {padding:'7px 16px',background:'transparent',border:'none',borderRadius:10,fontSize:13,fontWeight:500,color:'#b3b3bc',cursor:'pointer'},
  tabActive:  {background:'#121214',color:'#f4f4f5',fontWeight:600,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'},
  empty:      {textAlign:'center',padding:'40px',color:'#a0a0a9',fontSize:14},
};
