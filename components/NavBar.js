'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard',  icon: '📊' },
  { href: '/orders',    label: 'Orders',      icon: '📦' },
  { href: '/artwork',   label: 'Artwork',     icon: '🎨' },
  { href: '/studio',    label: 'Design Studio', icon: '✏️' },
  { href: '/billing',   label: 'Billing',     icon: '💰' },
];

export default function NavBar({ clientName = 'Client Portal' }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={s.header}>
      <div style={s.inner}>
        {/* Logo */}
        <a href="/dashboard" style={s.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1a1a2e"/>
            <path d="M5 14h18M14 5v18" stroke="#e8a020" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="4" stroke="#e8a020" strokeWidth="1.5"/>
          </svg>
          <span style={s.logoText}>S&A Screen Printing</span>
        </a>

        {/* Desktop nav */}
        <nav style={s.nav}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <a key={link.href} href={link.href} style={{...s.navLink,...(active?s.navLinkActive:{})}}>
                <span style={{fontSize:15}}>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right side */}
        <div style={s.right}>
          <span style={s.clientName}>{clientName}</span>
          <a href="/" style={s.signOut}>Sign Out</a>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(m => !m)} style={s.hamburger} aria-label="Menu">
          <span style={s.bar}/>
          <span style={s.bar}/>
          <span style={s.bar}/>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={s.mobileMenu}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <a key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{...s.mobileLink,...(active?s.mobileLinkActive:{})}}>
                <span style={{fontSize:18}}>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',marginTop:8,paddingTop:8}}>
            <a href="/" style={{...s.mobileLink,color:'#9ca3af'}}>Sign Out</a>
          </div>
        </div>
      )}
    </header>
  );
}

const s = {
  header:         { background:'#1a1a2e', position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 3px rgba(0,0,0,0.3)' },
  inner:          { display:'flex', alignItems:'center', gap:8, padding:'0 20px', height:56, maxWidth:1400, margin:'0 auto' },
  logo:           { display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 },
  logoText:       { fontSize:15, fontWeight:700, color:'#fff', whiteSpace:'nowrap' },
  nav:            { display:'flex', alignItems:'center', gap:2, flex:1, justifyContent:'center' },
  navLink:        { display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, fontSize:13, fontWeight:500, color:'#9ca3af', textDecoration:'none', transition:'all 0.15s', whiteSpace:'nowrap' },
  navLinkActive:  { background:'rgba(232,160,32,0.15)', color:'#e8a020' },
  right:          { display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  clientName:     { fontSize:13, color:'#6b7280', display:'none' },
  signOut:        { fontSize:13, color:'#9ca3af', textDecoration:'none', padding:'5px 10px', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6 },
  hamburger:      { display:'none', flexDirection:'column', gap:4, background:'none', border:'none', cursor:'pointer', padding:4 },
  bar:            { display:'block', width:20, height:2, background:'#9ca3af', borderRadius:2 },
  mobileMenu:     { background:'#1a1a2e', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'8px 12px 16px' },
  mobileLink:     { display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8, fontSize:14, color:'#d1d5db', textDecoration:'none' },
  mobileLinkActive:{ background:'rgba(232,160,32,0.1)', color:'#e8a020' },
};
