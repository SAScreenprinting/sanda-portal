'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';
import { TUTORIALS, TUTORIAL_CATEGORIES } from '@/lib/tutorials';

export default function TutorialsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      // open a guide straight from a link like /tutorials#sku
      const hash = window.location.hash.replace('#', '');
      if (hash && TUTORIALS.some((t) => t.id === hash)) setOpen(hash);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TUTORIALS.filter((t) =>
      (cat === 'All' || t.category === cat) &&
      (!needle || `${t.title} ${t.intro} ${t.steps.join(' ')}`.toLowerCase().includes(needle)));
  }, [cat, q]);

  return (
    <PortalShell active="tutorials" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Learn</div>
          <h1>Tutorials</h1>
          <p>Short, step-by-step guides for everything in your portal.</p>
        </div>
      </header>

      <div className="sp-in" style={{ '--i': 1, marginBottom: 18 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tutorials"
          style={{ width: '100%', maxWidth: 460, padding: '14px 16px', background: '#050506', border: '1px solid var(--line2)', color: '#fff', font: 'inherit', fontSize: 15, outline: 'none' }} />
      </div>

      <div className="sp-tabs sp-in" style={{ '--i': 2 }}>
        {['All', ...TUTORIAL_CATEGORIES].map((c) => (
          <button key={c} className={`sp-tab${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10, maxWidth: 860 }}>
        {list.length === 0 && <div className="sp-card"><div className="sp-empty"><b>Nothing found</b>Try a different word, or open Messages and ask us.</div></div>}
        {list.map((t, k) => {
          const isOpen = open === t.id;
          return (
            <div key={t.id} id={t.id} className="sp-card sp-in" style={{ '--i': 3 + (k % 6) }}>
              <button onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 24px', background: 'none', border: 0, color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <span>
                  <span className="sp-label" style={{ display: 'block', marginBottom: 6 }}>{t.category} · {t.time}</span>
                  <span style={{ fontFamily: 'var(--font-sora)', fontSize: 17, fontWeight: 600 }}>{t.title}</span>
                </span>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ flex: 'none', color: 'var(--y)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s var(--ease)' }}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {isOpen && (
                <div style={{ padding: '0 24px 26px', borderTop: '1px solid var(--line)' }}>
                  <p style={{ color: '#dcdce2', fontSize: 15, lineHeight: 1.7, margin: '18px 0 18px' }}>{t.intro}</p>
                  <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                    {t.steps.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <span style={{ flex: 'none', width: 28, height: 28, display: 'grid', placeItems: 'center', background: 'var(--y)', color: '#000', fontFamily: 'var(--font-sora)', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
                        <span style={{ fontSize: 15, lineHeight: 1.65, color: '#eee', paddingTop: 3 }}>{s}</span>
                      </li>
                    ))}
                  </ol>
                  {t.tip && <div className="sp-msg" style={{ marginTop: 20, marginBottom: 0 }}><b>Tip:</b> {t.tip}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}
