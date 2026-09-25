'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell, { Icon } from '@/components/PortalShell';

const STATUS = {
  'Awaiting Artwork': { color: '#a78bfa', step: 1, live: true },
  'Art Approved':     { color: '#60a5fa', step: 2, live: false },
  'In Production':    { color: '#ffc800', step: 3, live: true },
  'Quality Check':    { color: '#fb923c', step: 4, live: true },
  'Shipped':          { color: '#34d399', step: 5, live: false },
  'Delivered':        { color: '#9ca3af', step: 6, live: false },
};

const LOYALTY_TIERS = [
  { name: 'Bronze',   min: 0,  max: 4,  perks: ['Early access to new products'] },
  { name: 'Silver',   min: 5,  max: 14, perks: ['5% reorder discount', 'Priority support'] },
  { name: 'Gold',     min: 15, max: 29, perks: ['10% reorder discount', 'Free setup on reorders', 'Dedicated rep'] },
  { name: 'Platinum', min: 30, max: Infinity, perks: ['15% discount on all orders', 'Free rush processing', 'White-glove service'] },
];
const tierFor = (n) => LOYALTY_TIERS.find((t) => n >= t.min && n <= t.max) || LOYALTY_TIERS[0];

const ONBOARDING_STEPS = [
  { title: 'Welcome to your portal', sub: 'Everything you need to manage your S&A print orders in one place.', icon: 'dashboard', tip: null },
  { title: 'Track your orders', sub: 'Watch every order move from Art Approved to Production to Shipped in real time.', icon: 'orders', tip: 'Head to Orders to see your current status.' },
  { title: 'Upload your artwork', sub: 'Drop files directly into your orders. We support SVG, AI, PDF, PNG, and more.', icon: 'artwork', tip: 'Visit the Artwork Library to manage your files.' },
  { title: 'Design in the Studio', sub: 'Preview your logo on real garments before ordering. It takes a couple of minutes.', icon: 'studio', tip: 'Open Design Studio to try it.' },
  { title: 'You are all set', sub: 'Your account rep will reach out if we need anything. Questions? Open Messages anytime.', icon: 'messages', tip: null },
];

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return; } // eslint-disable-line react-hooks/set-state-in-effect
    let raf; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ label, value, prefix = '', sub, accent, i }) {
  const n = useCountUp(typeof value === 'number' ? value : null);
  return (
    <div className="sp-card sp-stat sp-in" style={{ '--i': i }}>
      <div className="sp-label">{label}</div>
      <div className={`sp-num${accent ? ' is-accent' : ''}`}>{typeof value === 'number' ? `${prefix}${n}` : '—'}</div>
      <div className="sp-sub">{sub}</div>
    </div>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [stats, setStats] = useState({ active: 0, pendingArt: 0, totalOrders: 0, balanceDue: 0, balanceDueDate: '' });
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(-1);
  const [userId, setUserId] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ brand: '', sku: '', garment: '', notes: '' });
  const [requestSuccess, setRequestSuccess] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUserId(user.id);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) {
      setProfile(prof);
      if (!prof.onboarding_complete) setOnboardingStep(0);
    }

    const { data: recentOrders } = await supabase
      .from('orders').select('id, order_number, status, created_at, total_amount')
      .eq('client_id', user.id).order('created_at', { ascending: false }).limit(5);

    let list = recentOrders || [];
    if (list.length > 0) {
      const { data: items } = await supabase
        .from('order_items').select('order_id, description, quantity, decoration').in('order_id', list.map((o) => o.id));
      list = list.map((o) => {
        const it = (items || []).filter((x) => x.order_id === o.id);
        const desc = it.length > 0
          ? `${it[0].quantity}x ${it[0].description || 'Items'}${it[0].decoration ? ', ' + it[0].decoration : ''}`
          : 'Order items';
        return { ...o, description: desc };
      });
    }
    setOrders(list);

    const { data: allOrders } = await supabase.from('orders').select('status, total_amount').eq('client_id', user.id);
    const { data: invoices } = await supabase
      .from('invoices').select('amount, due_date').eq('client_id', user.id).eq('paid', false).order('due_date', { ascending: true }).limit(1);

    const activeStatuses = ['Awaiting Artwork', 'Art Approved', 'In Production', 'Quality Check'];
    const active = (allOrders || []).filter((o) => activeStatuses.includes(o.status)).length;
    const pendingArt = (allOrders || []).filter((o) => o.status === 'Awaiting Artwork').length;
    const balanceDue = Number(invoices?.[0]?.amount ?? 0);
    const balanceDueDate = invoices?.[0]?.due_date
      ? new Date(invoices[0].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    setStats({ active, pendingArt, totalOrders: (allOrders || []).length, balanceDue, balanceDueDate });
    try {
      const dres = await fetch('/api/designs/list?limit=4', { cache: 'no-store' });
      if (dres.ok) setDesigns((await dres.json()).designs || []);
    } catch {}
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function submitRequest(e) {
    e.preventDefault();
    const res = await fetch('/api/requests/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestForm, clientId: userId }),
    });
    if (res.ok) {
      setRequestSuccess(true);
      setTimeout(() => { setShowRequest(false); setRequestSuccess(false); setRequestForm({ brand: '', sku: '', garment: '', notes: '' }); }, 2500);
    }
  }

  async function completeOnboarding() {
    setOnboardingStep(-1);
    if (userId) await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', userId);
  }
  const nextStep = () => (onboardingStep >= ONBOARDING_STEPS.length - 1 ? completeOnboarding() : setOnboardingStep((s) => s + 1));

  const firstName = profile?.contact_name?.split(' ')[0];
  const total = loading ? 0 : stats.totalOrders;
  const tier = tierFor(total);
  const tierIdx = LOYALTY_TIERS.indexOf(tier);
  const nextTier = LOYALTY_TIERS[tierIdx + 1];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const actions = [
    { label: 'Upload Artwork', sub: 'Add files to your orders', icon: 'artwork', href: '/artwork' },
    { label: 'Design Studio', sub: 'Build a design on real garments', icon: 'studio', href: '/studio' },
    { label: 'Designs', sub: 'Everything you have created', icon: 'designs', href: '/designs' },
  ];

  return (
    <PortalShell active="dashboard" profile={profile} loading={loading} onSignOut={handleSignOut}>
      <header className="sp-head">
        <div className="sp-in" style={{ '--i': 0 }}>
          <div className="sp-eyebrow">{today}</div>
          <h1>Welcome back{firstName ? `, ${firstName}` : ''}.</h1>
          <p>Here is what is happening with your orders.</p>
        </div>
        <a href="/studio" className="sp-btn sp-in" style={{ '--i': 1 }}>New order <Arrow /></a>
      </header>

      <section className="sp-stats">
        <Stat i={1} label="Active orders" value={loading ? null : stats.active} sub={stats.active === 1 ? '1 in progress' : `${stats.active} in progress`} />
        <Stat i={2} label="Pending artwork" value={loading ? null : stats.pendingArt} accent={stats.pendingArt > 0} sub={stats.pendingArt > 0 ? 'Needs your upload' : 'All caught up'} />
        <Stat i={3} label="Balance due" prefix="$" value={loading ? null : Math.round(stats.balanceDue)} sub={stats.balanceDueDate ? `Due ${stats.balanceDueDate}` : 'No open invoices'} />
        <Stat i={4} label="Total orders" value={loading ? null : stats.totalOrders} sub="All time" />
      </section>

      <section className="sp-grid">
        <div className="sp-card sp-in" style={{ '--i': 5 }}>
          <div className="sp-panel-head">
            <h2>Recent orders</h2>
            <a href="/orders" className="sp-link">View all <Arrow /></a>
          </div>
          {loading ? (
            <div className="sp-empty">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="sp-empty">
              <b>No orders yet</b>
              Start a design in the studio and your first order will show up here.
              <div><a href="/studio" className="sp-btn">Open Design Studio <Arrow /></a></div>
            </div>
          ) : (
            orders.map((o) => {
              const st = STATUS[o.status] || { color: '#9ca3af', step: 1, live: false };
              const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
              return (
                <a key={o.id} href={`/orders/${o.id}`} className="sp-order">
                  <span className="sp-order-no">{o.order_number}</span>
                  <div>
                    <div className="sp-order-desc">{o.description}</div>
                    <div className="sp-order-date">{date}</div>
                    <div className="sp-steps" aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className={k < st.step ? 'on' : ''} style={{ '--c': st.color, '--k': k }} />)}
                    </div>
                  </div>
                  <span className={`sp-chip${st.live ? ' live' : ''}`} style={{ '--c': st.color }}><i />{o.status}</span>
                </a>
              );
            })
          )}
        </div>

        <div className="sp-card sp-in" style={{ '--i': 6 }}>
          <div className="sp-tier">
            <div className="sp-label">Loyalty status</div>
            <div className="sp-tier-name">{tier.name}</div>
            <div className="sp-sub">{total} order{total !== 1 ? 's' : ''} total{nextTier ? `, ${nextTier.min - total} more to ${nextTier.name}` : ''}</div>
            <div className="sp-tier-bar" aria-hidden="true">
              {LOYALTY_TIERS.map((t, k) => <i key={t.name} className={k <= tierIdx ? 'on' : ''} style={{ '--k': k }} />)}
            </div>
            <div className="sp-tier-names">
              {LOYALTY_TIERS.map((t, k) => <span key={t.name} className={k === tierIdx ? 'on' : ''}>{t.name}</span>)}
            </div>
            <div style={{ marginTop: 22 }}>
              {tier.perks.map((p) => (
                <div key={p} className="sp-perk">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true"><path d="M4 12l5 5 11-11" /></svg>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {designs.length > 0 && (
        <section className="sp-card sp-in" style={{ '--i': 7, marginBottom: 14 }}>
          <div className="sp-panel-head">
            <h2>Recent designs</h2>
            <a href="/designs" className="sp-link">View all <Arrow /></a>
          </div>
          <div className="sp-dgrid" style={{ padding: 14 }}>
            {designs.map((d) => (
              <a key={d.id} href={`/designs/${d.id}`} className="sp-card sp-lift sp-dcard">
                <div className="sp-dthumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {d.thumbnail && <img src={d.thumbnail} alt="" loading="lazy" />}
                </div>
                <div className="sp-dbody">
                  <div className="sp-dnum">{d.name}</div>
                  <div className="sp-dprod" style={{ margin: '6px 0 0' }}>{d.product?.productTitle}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="sp-actions">
        {actions.map((a, k) => (
          <a key={a.label} href={a.href} className="sp-card sp-lift sp-act sp-in" style={{ '--i': 7 + k }}>
            <div className="sp-act-ic"><Icon name={a.icon} size={20} /></div>
            <b>{a.label}<Arrow /></b>
            <span>{a.sub}</span>
          </a>
        ))}
        <button onClick={() => setShowRequest(true)} className="sp-card sp-lift sp-act sp-in" style={{ '--i': 10, border: undefined }}>
          <div className="sp-act-ic"><Icon name="orders" size={20} /></div>
          <b>Request a Product<Arrow /></b>
          <span>Ask us to source a specific garment</span>
        </button>
      </section>

      {showRequest && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setShowRequest(false)}>
          <div className="sp-dialog">
            <button className="sp-x" onClick={() => setShowRequest(false)} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            {requestSuccess ? (
              <div style={{ textAlign: 'center', padding: '14px 0 8px' }}>
                <h2>Request received</h2>
                <p style={{ margin: 0 }}>We will look into sourcing this for you and reach out shortly.</p>
              </div>
            ) : (
              <>
                <h2>Request a product</h2>
                <p>Tell us what garment you are looking for and we will source it for you.</p>
                <form onSubmit={submitRequest}>
                  <div className="sp-field"><label>Brand name *</label>
                    <input required value={requestForm.brand} onChange={(e) => setRequestForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Port & Company, Gildan, Next Level" /></div>
                  <div className="sp-field"><label>SKU / style number</label>
                    <input value={requestForm.sku} onChange={(e) => setRequestForm((f) => ({ ...f, sku: e.target.value }))} placeholder="PC54, 5000, 6210" /></div>
                  <div className="sp-field"><label>Garment name / description *</label>
                    <input required value={requestForm.garment} onChange={(e) => setRequestForm((f) => ({ ...f, garment: e.target.value }))} placeholder="Unisex essential t-shirt" /></div>
                  <div className="sp-field"><label>Additional notes</label>
                    <textarea rows={3} value={requestForm.notes} onChange={(e) => setRequestForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Colors, sizes, quantity estimate, deadline" /></div>
                  <button type="submit" className="sp-btn" style={{ width: '100%', justifyContent: 'center' }}>Submit request <Arrow /></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {onboardingStep >= 0 && onboardingStep < ONBOARDING_STEPS.length && (
        <div className="sp-modal">
          <div className="sp-dialog" key={onboardingStep}>
            <div className="sp-dots">{ONBOARDING_STEPS.map((_, k) => <i key={k} className={k <= onboardingStep ? 'on' : ''} />)}</div>
            <div className="sp-act-ic" style={{ marginBottom: 18 }}><Icon name={ONBOARDING_STEPS[onboardingStep].icon} size={20} /></div>
            <h2>{ONBOARDING_STEPS[onboardingStep].title}</h2>
            <p>{ONBOARDING_STEPS[onboardingStep].sub}</p>
            {ONBOARDING_STEPS[onboardingStep].tip && <div className="sp-tip">{ONBOARDING_STEPS[onboardingStep].tip}</div>}
            <div className="sp-row">
              {onboardingStep > 0 && <button className="sp-btn sp-btn--ghost" onClick={() => setOnboardingStep((s) => s - 1)}>Back</button>}
              <button className="sp-btn" onClick={nextStep}>{onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Get started' : 'Next'} <Arrow /></button>
            </div>
            <button className="sp-skip" onClick={completeOnboarding}>Skip walkthrough</button>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
