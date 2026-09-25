'use client';
import { useEffect, useState } from 'react';
import './portal.css';

const I = {
  dashboard: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
  orders: <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  artwork: <><rect x="3" y="4" width="18" height="16" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 9" /></>,
  designs: <><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><path d="M17 13v8M13 17h8" /></>,
  studio: <><path d="M12 20h9" /><path d="M16.5 3.5l4 4L8 20l-5 1 1-5L16.5 3.5z" /></>,
  billing: <><rect x="2" y="5" width="20" height="14" /><path d="M2 10h20M6 15h4" /></>,
  messages: <><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" /></>,
  settings: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  admin: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  menu: <><path d="M3 6h18M3 12h18M3 18h18" /></>,
};
export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {I[name]}
    </svg>
  );
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'orders', label: 'Orders', href: '/orders' },
  { id: 'designs', label: 'Designs', href: '/designs' },
  { id: 'studio', label: 'Design Studio', href: '/studio' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'messages', label: 'Messages', href: '/messages' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

export default function PortalShell({ active, profile, loading, onSignOut, children }) {
  const [open, setOpen] = useState(false);
  const name = profile?.business_name || profile?.contact_name || 'Client';
  const initial = name[0]?.toUpperCase() || 'S';

  // A soft yellow glow follows the cursor on every panel
  useEffect(() => {
    function move(e) {
      const card = e.target.closest?.('.sp-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
    document.addEventListener('pointermove', move, { passive: true });
    return () => document.removeEventListener('pointermove', move);
  }, []);

  const items = profile?.is_admin ? [...NAV, { id: 'admin', label: 'Admin', href: '/admin' }] : NAV;

  return (
    <div className="sp">
      {open && <div className="sp-scrim" onClick={() => setOpen(false)} />}
      <aside className={`sp-side${open ? ' is-open' : ''}`}>
        <div>
          <div className="sp-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="S&A" />
            <b>S&amp;A POD<span>Client Portal</span></b>
          </div>
          <nav className="sp-nav">
            {items.map((n) => (
              <a key={n.id} href={n.href} className={n.id === active ? 'is-active' : ''} onClick={() => setOpen(false)}>
                <Icon name={n.id} />
                {n.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="sp-me">
          <div className="sp-me-row">
            <div className="sp-avatar">{loading ? '' : initial}</div>
            <div>
              <div className="sp-me-name">{loading ? ' ' : name}</div>
              <div className="sp-me-sub">{profile?.account_rep || 'S&A Team'}</div>
            </div>
          </div>
          <button className="sp-signout" onClick={onSignOut}><Icon name="out" size={16} /> Sign out</button>
        </div>
      </aside>

      <div className="sp-main">
        <div className="sp-topbar">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="S&A" />
        </div>
        <div className="sp-page">{children}</div>
      </div>
    </div>
  );
}
