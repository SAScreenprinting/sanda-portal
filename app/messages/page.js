'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef(null)

  const [themeName, setThemeName] = useState('classic')
  const [profile, setProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const t = themes[themeName]

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (prof) {
      setProfile(prof)
      if (prof.theme && themes[prof.theme]) setThemeName(prof.theme)
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:sender_id(business_name, contact_name, is_admin)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: true })

    setMessages(msgs || [])

    // Mark messages as read by client
    await supabase
      .from('messages')
      .update({ read_by_client: true })
      .eq('client_id', user.id)
      .eq('read_by_client', false)

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [loadData])

  // Scroll to bottom when messages load or change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    let channel
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('client-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${user.id}`,
        }, payload => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()
    })
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [supabase])

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim() || !profile) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('messages').insert({
      client_id: user.id,
      sender_id: user.id,
      body: newMsg.trim(),
      read_by_admin: false,
      read_by_client: true,
    })

    setNewMsg('')
    setSending(false)
    loadData()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const businessInitial = profile?.business_name?.[0]?.toUpperCase() ?? '?'
  const displayName = profile?.business_name || profile?.contact_name || 'Client'

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
              {businessInitial}
            </div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText }}>{displayName}</div>
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
        <button onClick={handleSignOut}
          style={{ display:'block', width:'100%', padding:'8px 12px', background:'transparent', border:'none', color:t.sidebarText, fontSize:'12px', cursor:'pointer', textAlign:'center' }}>
          Sign Out
        </button>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px', display:'flex', flexDirection:'column', maxHeight:'100vh' }}>
        <h1 style={{ fontSize:'26px', fontWeight:'700', color:t.cardText, margin:'0 0 4px' }}>Messages</h1>
        <p style={{ fontSize:'14px', color:t.cardSub, margin:'0 0 24px' }}>Chat directly with the S&A team.</p>

        {/* Message thread */}
        <div style={{ flex:1, background:t.card, borderRadius:'14px', border:`1px solid ${t.cardSub}20`, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
          <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
            {loading ? (
              <div style={{ textAlign:'center', color:t.cardSub, fontSize:'13px', padding:'40px' }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>✉️</div>
                <div style={{ fontSize:'15px', fontWeight:'600', color:t.cardText, marginBottom:'6px' }}>No messages yet</div>
                <div style={{ fontSize:'13px', color:t.cardSub }}>Send a message below and the S&A team will reply shortly.</div>
              </div>
            ) : (
              messages.map(msg => {
                const isClient = !msg.sender?.is_admin
                const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
                const date = new Date(msg.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })
                return (
                  <div key={msg.id} style={{ display:'flex', justifyContent:isClient?'flex-end':'flex-start' }}>
                    {!isClient && (
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:t.accent, display:'flex', alignItems:'center', justifyContent:'center', color:t.accentText, fontSize:'12px', fontWeight:'700', marginRight:'8px', flexShrink:0 }}>
                        S&A
                      </div>
                    )}
                    <div style={{ maxWidth:'70%' }}>
                      {!isClient && <div style={{ fontSize:'11px', color:t.cardSub, marginBottom:'3px' }}>S&A Team · {date}</div>}
                      <div style={{ padding:'10px 14px', borderRadius:'12px', fontSize:'13px', lineHeight:'1.5', background:isClient?t.accent:'transparent', color:isClient?t.accentText:t.cardText, border:isClient?'none':`1px solid ${t.cardSub}30` }}>
                        {msg.body}
                      </div>
                      <div style={{ fontSize:'11px', color:t.cardSub, marginTop:'3px', textAlign:isClient?'right':'left' }}>{time}</div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ borderTop:`1px solid ${t.cardSub}20`, padding:'16px 20px' }}>
            <form onSubmit={sendMessage} style={{ display:'flex', gap:'10px' }}>
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message to S&A…"
                style={{ flex:1, background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:t.cardText, outline:'none' }}
              />
              <button type="submit" disabled={sending || !newMsg.trim()}
                style={{ padding:'10px 20px', background:t.accent, color:t.accentText, border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer', opacity:(sending||!newMsg.trim())?0.5:1 }}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
