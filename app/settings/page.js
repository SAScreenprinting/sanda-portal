'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

export default function SettingsPage() {
  return <Suspense><SettingsInner /></Suspense>
}

function SettingsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPasswordReset = searchParams.get('reset') === 'true'
  const supabase = createClient()

  const [themeName, setThemeNameState] = useState('classic')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [profileForm, setProfileForm] = useState({ business_name:'', contact_name:'', phone:'' })
  const [profileMsg, setProfileMsg] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

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
      if (prof.theme && themes[prof.theme]) setThemeNameState(prof.theme)
      setProfileForm({
        business_name: prof.business_name || '',
        contact_name: prof.contact_name || '',
        phone: prof.phone || '',
      })
    }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [loadData])

  async function setThemeName(key) {
    setThemeNameState(key)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ theme: key }).eq('id', user.id)
  }

  async function saveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update(profileForm)
      .eq('id', user.id)
    setProfileMsg(error ? '⚠ ' + error.message : '✓ Profile updated.')
    setProfileSaving(false)
    setTimeout(() => setProfileMsg(''), 3000)
  }

  async function changePassword(e) {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('⚠ New passwords do not match.'); return }
    if (pwForm.newPw.length < 6) { setPwMsg('⚠ Password must be at least 6 characters.'); return }
    setPwSaving(true)
    setPwMsg('')

    // If coming from a reset link, no need to verify current password
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    if (error) setPwMsg('⚠ ' + error.message)
    else {
      setPwMsg('✓ Password changed successfully.')
      setPwForm({ current:'', newPw:'', confirm:'' })
      if (isPasswordReset) setTimeout(() => router.push('/dashboard'), 1500)
    }
    setPwSaving(false)
    setTimeout(() => setPwMsg(''), 4000)
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
              {loading ? '…' : businessInitial}
            </div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:t.cardText }}>{loading ? '—' : displayName}</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const active = item.id === 'settings'
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
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px', maxWidth:'720px' }}>

        {isPasswordReset && (
          <div style={{ background:'#dbeafe', border:'1px solid #93c5fd', borderRadius:'10px', padding:'12px 16px', marginBottom:'24px', fontSize:'13px', color:'#1e40af' }}>
            You clicked a password reset link. Set your new password below.
          </div>
        )}

        <h1 style={{ fontSize:'26px', fontWeight:'700', color:t.cardText, margin:'0 0 4px' }}>Account Settings</h1>
        <p style={{ fontSize:'14px', color:t.cardSub, margin:'0 0 32px' }}>Manage your profile and security.</p>

        {/* Profile section */}
        <div style={{ background:t.card, borderRadius:'14px', padding:'24px', marginBottom:'20px', border:`1px solid ${t.cardSub}20` }}>
          <h2 style={{ fontSize:'15px', fontWeight:'600', color:t.cardText, margin:'0 0 4px' }}>Business Profile</h2>
          <p style={{ fontSize:'13px', color:t.cardSub, margin:'0 0 20px' }}>This is how you appear in the portal.</p>
          <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Business Name</label>
                <input value={profileForm.business_name} onChange={e => setProfileForm(f => ({...f, business_name:e.target.value}))}
                  placeholder="Riverside FC"
                  style={{ width:'100%', background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:t.cardText, outline:'none' }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Contact Name</label>
                <input value={profileForm.contact_name} onChange={e => setProfileForm(f => ({...f, contact_name:e.target.value}))}
                  placeholder="John Smith"
                  style={{ width:'100%', background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:t.cardText, outline:'none' }}/>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Phone</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(f => ({...f, phone:e.target.value}))}
                placeholder="(201) 555-0182"
                style={{ width:'100%', background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:t.cardText, outline:'none' }}/>
            </div>
            {profileMsg && (
              <div style={{ padding:'8px 12px', borderRadius:'8px', background:profileMsg.startsWith('✓')?'#d1fae5':'#fee2e2', color:profileMsg.startsWith('✓')?'#065f46':'#991b1b', fontSize:'13px' }}>
                {profileMsg}
              </div>
            )}
            <button type="submit" disabled={profileSaving}
              style={{ alignSelf:'flex-start', padding:'10px 20px', background:t.accent, color:t.accentText, border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', opacity:profileSaving?0.7:1 }}>
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Theme section */}
        <div style={{ background:t.card, borderRadius:'14px', padding:'24px', marginBottom:'20px', border:`1px solid ${t.cardSub}20` }}>
          <h2 style={{ fontSize:'15px', fontWeight:'600', color:t.cardText, margin:'0 0 4px' }}>Portal Theme</h2>
          <p style={{ fontSize:'13px', color:t.cardSub, margin:'0 0 20px' }}>Choose how the portal looks. Saved automatically.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
            {Object.entries(themes).map(([key, th]) => (
              <button key={key} onClick={() => setThemeName(key)}
                style={{ padding:'12px', borderRadius:'10px', border:`2px solid ${key===themeName?t.accent:'transparent'}`, background:`${t.cardSub}10`, cursor:'pointer', textAlign:'left' }}>
                <div style={{ display:'flex', gap:'6px', marginBottom:'6px' }}>
                  <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:th.sidebar }}/>
                  <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:th.accent }}/>
                  <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:th.main }}/>
                </div>
                <div style={{ fontSize:'12px', fontWeight:'600', color:t.cardText }}>{th.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Password section */}
        <div style={{ background:t.card, borderRadius:'14px', padding:'24px', border:`1px solid ${t.cardSub}20` }}>
          <h2 style={{ fontSize:'15px', fontWeight:'600', color:t.cardText, margin:'0 0 4px' }}>Change Password</h2>
          <p style={{ fontSize:'13px', color:t.cardSub, margin:'0 0 20px' }}>Use a strong password you don't use elsewhere.</p>
          <form onSubmit={changePassword} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>New Password</label>
              <div style={{ position:'relative' }}>
                <input type={showNewPw ? 'text' : 'password'} required minLength={6} value={pwForm.newPw} onChange={e => setPwForm(f => ({...f, newPw:e.target.value}))}
                  placeholder="Min 6 characters"
                  style={{ width:'100%', background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'8px', padding:'10px 40px 10px 12px', fontSize:'13px', color:t.cardText, outline:'none' }}/>
                <button type="button" onClick={() => setShowNewPw(s => !s)}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', opacity:0.4 }}>
                  {showNewPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:t.cardSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Confirm New Password</label>
              <div style={{ position:'relative' }}>
                <input type={showConfirmPw ? 'text' : 'password'} required value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm:e.target.value}))}
                  placeholder="Repeat new password"
                  style={{ width:'100%', background:`${t.cardSub}10`, border:`1px solid ${t.cardSub}30`, borderRadius:'8px', padding:'10px 40px 10px 12px', fontSize:'13px', color:t.cardText, outline:'none' }}/>
                <button type="button" onClick={() => setShowConfirmPw(s => !s)}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', opacity:0.4 }}>
                  {showConfirmPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {pwMsg && (
              <div style={{ padding:'8px 12px', borderRadius:'8px', background:pwMsg.startsWith('✓')?'#d1fae5':'#fee2e2', color:pwMsg.startsWith('✓')?'#065f46':'#991b1b', fontSize:'13px' }}>
                {pwMsg}
              </div>
            )}
            <button type="submit" disabled={pwSaving}
              style={{ alignSelf:'flex-start', padding:'10px 20px', background:t.accent, color:t.accentText, border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', opacity:pwSaving?0.7:1 }}>
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
