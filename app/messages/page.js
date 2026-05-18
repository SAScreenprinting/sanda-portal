'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useMobile } from '@/hooks/useMobile'

const themes = {
  classic:  { name:'Classic',  sidebar:'#EFEDE8', sidebarText:'#666', sidebarActive:'#1a1a1a', sidebarActiveTxt:'white', main:'#F5F5F0', card:'white',    cardText:'#1a1a1a', cardSub:'#aaa', accent:'#1a1a1a', accentText:'white', logoFilter:'none' },
  midnight: { name:'Midnight', sidebar:'#0f0f0f', sidebarText:'#666', sidebarActive:'white',   sidebarActiveTxt:'#0f0f0f', main:'#1a1a1a', card:'#242424', cardText:'white',   cardSub:'#555', accent:'white',   accentText:'#1a1a1a', logoFilter:'invert(1)' },
  ocean:    { name:'Ocean',    sidebar:'#0a1628', sidebarText:'#4a7fa5', sidebarActive:'#2196f3', sidebarActiveTxt:'white', main:'#0d1f35', card:'#0f2744', cardText:'white',   cardSub:'#4a7fa5', accent:'#2196f3', accentText:'white', logoFilter:'invert(1)' },
  forest:   { name:'Forest',   sidebar:'#0f1f0f', sidebarText:'#4a7a4a', sidebarActive:'#4caf50', sidebarActiveTxt:'white', main:'#141f14', card:'#1a2e1a', cardText:'white',   cardSub:'#4a7a4a', accent:'#4caf50', accentText:'white', logoFilter:'invert(1)' },
  sunset:   { name:'Sunset',   sidebar:'#1a0f0a', sidebarText:'#a06040', sidebarActive:'#ff6b35', sidebarActiveTxt:'white', main:'#1f1510', card:'#2a1f15', cardText:'white',   cardSub:'#a06040', accent:'#ff6b35', accentText:'white', logoFilter:'invert(1)' },
  lavender: { name:'Lavender', sidebar:'#f0eef8', sidebarText:'#8878c3', sidebarActive:'#7c6bc4', sidebarActiveTxt:'white', main:'#f5f3ff', card:'white',    cardText:'#2d2460', cardSub:'#9b8fd4', accent:'#7c6bc4', accentText:'white', logoFilter:'none' },
}

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
]

const STATUS_STYLE = {
  open:        { bg:'#fef3c7', color:'#92400e', label:'Open' },
  in_progress: { bg:'#dbeafe', color:'#1e40af', label:'In Progress' },
  resolved:    { bg:'#d1fae5', color:'#065f46', label:'Resolved' },
}

const MOCK_INQUIRIES = [
  { id:'mock-1', inquiry_number:'INQ-0002', title:'Artwork file question for Order #1051', status:'in_progress', updated_at: new Date(Date.now()-3600000*2).toISOString(), created_at: new Date(Date.now()-3600000*5).toISOString(), last_message:{ body:'Thanks for the update! We\'ll have the revised file over shortly.', is_admin:false } },
  { id:'mock-2', inquiry_number:'INQ-0001', title:'Timeline for jersey delivery',          status:'resolved',    updated_at: new Date(Date.now()-86400000*3).toISOString(),  created_at: new Date(Date.now()-86400000*5).toISOString(),  last_message:{ body:'Your jerseys shipped today — tracking number sent to your email.', is_admin:true } },
]

function fmtDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function MessagesPage() {
  const router  = useRouter()
  const supabase = createClient()
  const bottomRef = useRef(null)
  const isMobile  = useMobile()

  const [themeName, setThemeName]         = useState('classic')
  const [profile, setProfile]             = useState(null)
  const [userId, setUserId]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  // Inquiry list
  const [inquiries, setInquiries]         = useState([])

  // Thread view
  const [view, setView]                   = useState('list')  // 'list' | 'thread'
  const [activeInquiry, setActiveInquiry] = useState(null)
  const [thread, setThread]               = useState([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [replyText, setReplyText]         = useState('')
  const [sending, setSending]             = useState(false)

  // New inquiry modal
  const [showNew, setShowNew]             = useState(false)
  const [newForm, setNewForm]             = useState({ title:'', body:'' })
  const [submitting, setSubmitting]       = useState(false)
  const [submitErr, setSubmitErr]         = useState('')

  const t = themes[themeName]

  const loadInquiries = useCallback(async (uid) => {
    const res = await fetch(`/api/inquiries/list?clientId=${uid}`)
    const data = await res.json()
    if (data.inquiries?.length) {
      setInquiries(data.inquiries)
    } else {
      setInquiries(MOCK_INQUIRIES)
    }
  }, [])

  const loadThread = useCallback(async (inquiryId) => {
    setThreadLoading(true)
    const res = await fetch(`/api/inquiries/${inquiryId}`)
    const data = await res.json()
    setThread(data.messages || [])
    setThreadLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
  }, [])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setUserId(user.id)

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof) {
      setProfile(prof)
      if (prof.theme && themes[prof.theme]) setThemeName(prof.theme)
    }

    await loadInquiries(user.id)
    setLoading(false)
  }, [supabase, router, loadInquiries])

  useEffect(() => { loadData() }, [loadData])

  // Scroll to bottom when thread loads
  useEffect(() => {
    if (view === 'thread') bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [thread, view])

  async function openThread(inquiry) {
    setActiveInquiry(inquiry)
    setView('thread')
    setReplyText('')
    if (!inquiry.id.startsWith('mock-')) {
      await loadThread(inquiry.id)
    } else {
      // Mock thread
      setThread([
        { id:'mt1', body: inquiry.id === 'mock-1'
          ? 'Hi, I uploaded the artwork file yesterday but wanted to confirm it looked right before you start production.'
          : 'Hey, just wanted to check on the timeline for when our jerseys will be ready.',
          is_admin:false, created_at: new Date(Date.now()-3600000*5).toISOString() },
        { id:'mt2', body: inquiry.id === 'mock-1'
          ? 'Thanks for the heads up! We\'re reviewing it now and will let you know by end of day.'
          : 'Hi! Your jerseys are currently in printing. Expected completion is May 20.',
          is_admin:true, created_at: new Date(Date.now()-3600000*4).toISOString() },
        ...(inquiry.id === 'mock-1' ? [{ id:'mt3', body:'Thanks for the update! We\'ll have the revised file over shortly.', is_admin:false, created_at: new Date(Date.now()-3600000*2).toISOString() }] : []),
        ...(inquiry.id === 'mock-2' ? [{ id:'mt3', body:'Your jerseys shipped today — tracking number sent to your email.', is_admin:true, created_at: new Date(Date.now()-86400000*3).toISOString() }] : []),
      ])
    }
  }

  async function sendReply(e) {
    e.preventDefault()
    if (!replyText.trim() || !userId || sending) return
    if (activeInquiry?.id?.startsWith('mock-')) return

    setSending(true)
    const res = await fetch(`/api/inquiries/${activeInquiry.id}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ senderId: userId, body: replyText, isAdmin: false }),
    })
    if (res.ok) {
      setReplyText('')
      await loadThread(activeInquiry.id)
      await loadInquiries(userId)
    }
    setSending(false)
  }

  async function submitNewInquiry(e) {
    e.preventDefault()
    if (!newForm.title.trim() || !newForm.body.trim() || !userId) return
    setSubmitting(true)
    setSubmitErr('')

    const res = await fetch('/api/inquiries/create', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ clientId: userId, title: newForm.title, body: newForm.body }),
    })
    const data = await res.json()
    if (!res.ok) { setSubmitErr(data.error || 'Something went wrong.'); setSubmitting(false); return }

    setShowNew(false)
    setNewForm({ title:'', body:'' })
    setSubmitting(false)
    await loadInquiries(userId)
    // Auto-open the new inquiry
    if (data.inquiry) {
      const full = { ...data.inquiry, last_message: null }
      setActiveInquiry(full)
      setView('thread')
      await loadThread(data.inquiry.id)
    }
  }

  const displayName = profile?.business_name || profile?.contact_name || 'Client'
  const initial     = displayName[0]?.toUpperCase() || '?'
  const openCount   = inquiries.filter(i => i.status === 'open' || i.status === 'in_progress').length

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:t.main, fontFamily:'Inter, sans-serif' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:140, cursor:'pointer' }} />
      )}

      {/* Sidebar */}
      <div style={{ width:'220px', background:t.sidebar, display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between', transform: isMobile && !sidebarOpen ? 'translateX(-220px)' : 'none', transition:'transform 0.25s ease', zIndex:150 }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ position:'absolute', top:'14px', right:'14px', background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:t.sidebarText, lineHeight:1, padding:'4px' }}>✕</button>
        )}
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px', filter:t.logoFilter }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:t.accent, display:'flex', alignItems:'center', justifyContent:'center', color:t.accentText, fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>
              {loading ? '…' : initial}
            </div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText }}>{loading ? '—' : displayName}</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const active = item.id === 'messages'
              return (
                <a key={item.id} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', textDecoration:'none', background:active?t.sidebarActive:'transparent', color:active?t.sidebarActiveTxt:t.sidebarText, fontSize:'13px', fontWeight:active?'600':'400' }}>
                  <span style={{ fontSize:'16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); }}
          style={{ display:'block', width:'100%', padding:'8px 12px', background:'transparent', border:'none', color:t.sidebarText, fontSize:'12px', cursor:'pointer', textAlign:'center' }}>
          Sign Out
        </button>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft: isMobile ? 0 : '220px', display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>

        {isMobile && (
          <div style={{ flexShrink:0, padding:'12px 16px', background:t.sidebar, borderBottom:`1px solid ${t.cardSub}20`, display:'flex', alignItems:'center', gap:'12px' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:t.sidebarText, lineHeight:1, padding:'2px 4px' }}>☰</button>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'80px', filter:t.logoFilter }}/>
          </div>
        )}

        <div style={{ flex:1, overflow:'auto', padding: isMobile ? '16px 14px' : '36px 32px' }}>

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
                <div>
                  <h1 style={{ fontSize:'26px', fontWeight:'700', color:t.cardText, margin:'0 0 4px' }}>Support & Inquiries</h1>
                  <p style={{ fontSize:'14px', color:t.cardSub, margin:0 }}>
                    {loading ? '—' : `${inquiries.length} total · ${openCount} open`}
                  </p>
                </div>
                <button onClick={() => setShowNew(true)}
                  style={{ padding:'10px 20px', background:t.accent, color:t.accentText, borderRadius:'10px', fontSize:'13px', fontWeight:'600', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                  + New Inquiry
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign:'center', padding:'60px', color:t.cardSub }}>Loading…</div>
              ) : inquiries.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 20px' }}>
                  <div style={{ fontSize:'40px', marginBottom:'16px' }}>✉️</div>
                  <div style={{ fontSize:'16px', fontWeight:'600', color:t.cardText, marginBottom:'8px' }}>No inquiries yet</div>
                  <div style={{ fontSize:'13px', color:t.cardSub, marginBottom:'24px' }}>Have a question or concern? Submit an inquiry and we'll get back to you.</div>
                  <button onClick={() => setShowNew(true)}
                    style={{ padding:'11px 24px', background:t.accent, color:t.accentText, border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>
                    Submit Your First Inquiry
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {inquiries.map(inq => {
                    const st = STATUS_STYLE[inq.status] || STATUS_STYLE.open
                    return (
                      <button key={inq.id} onClick={() => openThread(inq)}
                        style={{ background:t.card, border:`1px solid ${t.cardSub}20`, borderRadius:'14px', padding:'20px 22px', textAlign:'left', cursor:'pointer', width:'100%', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', transition:'box-shadow 0.15s' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', gap:'12px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                            <span style={{ fontSize:'12px', fontWeight:'700', color:t.cardSub, fontFamily:'monospace', flexShrink:0 }}>{inq.inquiry_number}</span>
                            <span style={{ fontSize:'14px', fontWeight:'600', color:t.cardText, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inq.title}</span>
                          </div>
                          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', background:st.bg, color:st.color, flexShrink:0 }}>{st.label}</span>
                        </div>
                        {inq.last_message && (
                          <p style={{ fontSize:'13px', color:t.cardSub, margin:'0 0 8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {inq.last_message.is_admin ? '↩ S&A: ' : 'You: '}{inq.last_message.body}
                          </p>
                        )}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontSize:'12px', color:t.cardSub }}>{fmtDate(inq.updated_at)}</span>
                          <span style={{ fontSize:'12px', color:t.accent, fontWeight:'600' }}>View thread →</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── THREAD VIEW ── */}
          {view === 'thread' && activeInquiry && (
            <>
              {/* Thread header */}
              <div style={{ marginBottom:'20px' }}>
                <button onClick={() => { setView('list'); setActiveInquiry(null); setThread([]); }}
                  style={{ background:'none', border:'none', color:t.cardSub, fontSize:'13px', cursor:'pointer', padding:0, marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                  ← Back to inquiries
                </button>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:t.cardSub, fontFamily:'monospace', marginBottom:'4px' }}>{activeInquiry.inquiry_number}</div>
                    <h2 style={{ fontSize:'20px', fontWeight:'700', color:t.cardText, margin:0 }}>{activeInquiry.title}</h2>
                  </div>
                  {(() => { const st = STATUS_STYLE[activeInquiry.status] || STATUS_STYLE.open; return (
                    <span style={{ fontSize:'12px', fontWeight:'700', padding:'5px 12px', borderRadius:'20px', background:st.bg, color:st.color, flexShrink:0 }}>{st.label}</span>
                  )})()}
                </div>
              </div>

              {/* Message thread */}
              <div style={{ background:t.card, borderRadius:'14px', border:`1px solid ${t.cardSub}20`, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0, maxHeight: isMobile ? '55vh' : '480px', marginBottom:'16px' }}>
                <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
                  {threadLoading ? (
                    <div style={{ textAlign:'center', color:t.cardSub, padding:'40px', fontSize:'13px' }}>Loading thread…</div>
                  ) : thread.length === 0 ? (
                    <div style={{ textAlign:'center', color:t.cardSub, padding:'40px', fontSize:'13px' }}>No messages yet.</div>
                  ) : (
                    thread.map((msg, i) => {
                      const isClient = !msg.is_admin
                      const time = new Date(msg.created_at).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true })
                      return (
                        <div key={msg.id || i} style={{ display:'flex', flexDirection:'column', alignItems:isClient?'flex-end':'flex-start', gap:'3px' }}>
                          <span style={{ fontSize:'11px', color:t.cardSub, fontWeight:'500', paddingLeft:isClient?0:'4px', paddingRight:isClient?'4px':0 }}>
                            {isClient ? 'You' : 'S&A Team'} · {time}
                          </span>
                          <div style={{ maxWidth:'78%', padding:'11px 15px', borderRadius:'14px', fontSize:'13px', lineHeight:'1.6', background:isClient?t.accent:t.cardSub+'20', color:isClient?t.accentText:t.cardText, borderBottomRightRadius:isClient?'4px':'14px', borderBottomLeftRadius:isClient?'14px':'4px' }}>
                            {msg.body}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef}/>
                </div>
              </div>

              {/* Reply box */}
              {activeInquiry.status !== 'resolved' ? (
                <form onSubmit={sendReply} style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e); } }}
                    placeholder="Type your reply… (Enter to send)"
                    rows={3}
                    style={{ flex:1, background:t.card, border:`1px solid ${t.cardSub}30`, borderRadius:'10px', padding:'11px 14px', fontSize:'13px', color:t.cardText, outline:'none', resize:'none', fontFamily:'inherit', lineHeight:'1.5' }}
                  />
                  <button type="submit" disabled={!replyText.trim() || sending}
                    style={{ padding:'11px 22px', background:t.accent, color:t.accentText, border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', opacity:(!replyText.trim()||sending)?0.5:1, whiteSpace:'nowrap', alignSelf:'stretch' }}>
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                </form>
              ) : (
                <div style={{ padding:'14px 18px', background:STATUS_STYLE.resolved.bg, borderRadius:'10px', fontSize:'13px', color:STATUS_STYLE.resolved.color, fontWeight:'500', textAlign:'center' }}>
                  ✓ This inquiry has been resolved. <button onClick={() => setShowNew(true)} style={{ background:'none', border:'none', color:STATUS_STYLE.resolved.color, fontSize:'13px', cursor:'pointer', textDecoration:'underline', fontWeight:'600' }}>Open a new inquiry?</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── NEW INQUIRY MODAL ── */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}
          onClick={e => e.target===e.currentTarget && setShowNew(false)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'36px', maxWidth:'500px', width:'100%', position:'relative' }}>
            <button onClick={() => setShowNew(false)}
              style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>×</button>

            <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>New Inquiry</h2>
            <p style={{ fontSize:'13px', color:'#9ca3af', margin:'0 0 24px' }}>We'll respond as soon as possible — usually within 1 business day.</p>

            <form onSubmit={submitNewInquiry} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>
                  Subject / Title *
                </label>
                <input required
                  value={newForm.title}
                  onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Question about Order #1051, Artwork approval, Rush request…"
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none' }}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'700', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>
                  Description *
                </label>
                <textarea required
                  value={newForm.body}
                  onChange={e => setNewForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Describe your question or issue in detail. Include any relevant order numbers, dates, or file names."
                  rows={5}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:'1.6' }}
                />
              </div>

              {submitErr && (
                <div style={{ padding:'10px 14px', background:'#fee2e2', borderRadius:'8px', fontSize:'13px', color:'#991b1b' }}>{submitErr}</div>
              )}

              <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
                <button type="button" onClick={() => setShowNew(false)}
                  style={{ flex:1, padding:'11px', background:'#f3f4f6', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', color:'#374151' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex:2, padding:'11px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:submitting?'default':'pointer', opacity:submitting?0.7:1 }}>
                  {submitting ? 'Submitting…' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
