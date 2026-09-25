'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const STATUS = {
  open: { label: 'Open', color: '#ffc800' },
  in_progress: { label: 'In progress', color: '#60a5fa' },
  resolved: { label: 'Resolved', color: '#34d399' },
};

function ago(iso) {
  const d = new Date(iso); const diff = Date.now() - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const bottomRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [inquiries, setInquiries] = useState(null);
  const [view, setView] = useState('list');
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const loadInquiries = useCallback(async (uid) => {
    const res = await fetch(`/api/inquiries/list?clientId=${uid}`, { cache: 'no-store' });
    const data = res.ok ? await res.json() : {};
    setInquiries(data.inquiries || []);
  }, []);

  const loadThread = useCallback(async (id) => {
    setThreadLoading(true);
    const res = await fetch(`/api/inquiries/${id}`, { cache: 'no-store' });
    const data = res.ok ? await res.json() : {};
    setThread(data.messages || []);
    setThreadLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);
      await loadInquiries(user.id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (view === 'thread') bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread, view]);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  async function openThread(inq) {
    setActive(inq); setView('thread'); setReply('');
    await loadThread(inq.id);
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !userId || sending) return;
    setSending(true);
    const res = await fetch(`/api/inquiries/${active.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: userId, body: reply, isAdmin: false }),
    });
    if (res.ok) { setReply(''); await loadThread(active.id); await loadInquiries(userId); }
    setSending(false);
  }

  async function submitNew(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !userId) return;
    setSubmitting(true); setErr('');
    const res = await fetch('/api/inquiries/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: userId, title: form.title, body: form.body }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Something went wrong.'); setSubmitting(false); return; }
    setShowNew(false); setForm({ title: '', body: '' }); setSubmitting(false);
    await loadInquiries(userId);
    if (data.inquiry) { setActive(data.inquiry); setView('thread'); await loadThread(data.inquiry.id); }
  }

  const list = inquiries || [];
  const openCount = list.filter((i) => i.status === 'open' || i.status === 'in_progress').length;

  return (
    <PortalShell active="messages" profile={profile} loading={!profile} onSignOut={signOut}>
      {view === 'list' ? (
        <>
          <header className="sp-head">
            <div className="sp-in">
              <div className="sp-eyebrow">Support</div>
              <h1>Messages</h1>
              <p>{inquiries === null ? 'Loading…' : `${openCount} open conversation${openCount === 1 ? '' : 's'}`}</p>
            </div>
            <button className="sp-btn sp-in" style={{ '--i': 1 }} onClick={() => setShowNew(true)}>New message <Arrow /></button>
          </header>

          <div className="sp-card sp-in" style={{ '--i': 2 }}>
            {inquiries === null ? <div className="sp-empty">Loading…</div>
              : list.length === 0 ? (
                <div className="sp-empty"><b>No messages yet</b>Have a question about an order or a design? Start a conversation with our team.
                  <div><button className="sp-btn" onClick={() => setShowNew(true)}>New message <Arrow /></button></div></div>
              ) : list.map((inq) => {
                const st = STATUS[inq.status] || STATUS.open;
                return (
                  <button key={inq.id} onClick={() => openThread(inq)} className="sp-order" style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--line)', color: 'inherit', font: 'inherit', cursor: 'pointer', gridTemplateColumns: '92px 1fr auto' }}>
                    <span className="sp-order-no">{inq.inquiry_number}</span>
                    <div>
                      <div className="sp-order-desc">{inq.title}</div>
                      {inq.last_message && <div className="sp-order-date" style={{ marginTop: 5 }}>{inq.last_message.is_admin ? 'S&A: ' : 'You: '}{inq.last_message.body?.slice(0, 90)}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="sp-chip" style={{ '--c': st.color }}><i />{st.label}</span>
                      <div className="sp-order-date" style={{ marginTop: 8 }}>{ago(inq.updated_at || inq.created_at)}</div>
                    </div>
                  </button>
                );
              })}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => { setView('list'); setActive(null); }} className="sp-link" style={{ background: 'none', border: 0, cursor: 'pointer', marginBottom: 22, display: 'inline-flex', padding: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ transform: 'rotate(180deg)' }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            All messages
          </button>
          <header className="sp-head" style={{ marginBottom: 20 }}>
            <div className="sp-in">
              <div className="sp-eyebrow">{active?.inquiry_number}</div>
              <h1 style={{ fontSize: 30 }}>{active?.title}</h1>
            </div>
            {active && <span className="sp-chip" style={{ '--c': (STATUS[active.status] || STATUS.open).color }}><i />{(STATUS[active.status] || STATUS.open).label}</span>}
          </header>

          <div className="sp-card sp-in" style={{ '--i': 1 }}>
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 260, maxHeight: '55vh', overflowY: 'auto' }}>
              {threadLoading ? <div className="sp-empty">Loading…</div> : thread.map((m) => (
                <div key={m.id} style={{ alignSelf: m.is_admin ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
                  <div className="sp-label" style={{ marginBottom: 6, textAlign: m.is_admin ? 'left' : 'right' }}>{m.is_admin ? 'S&A' : 'You'} · {ago(m.created_at)}</div>
                  <div style={{ padding: '12px 16px', fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', background: m.is_admin ? 'var(--panel2)' : 'rgba(255,200,0,0.12)', border: `1px solid ${m.is_admin ? 'var(--line2)' : 'rgba(255,200,0,0.35)'}` }}>{m.body}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {active?.status !== 'resolved' && (
              <form onSubmit={sendReply} style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid var(--line)' }}>
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" style={{ flex: 1, padding: '13px 14px', background: '#050506', border: '1px solid var(--line2)', color: '#fff', font: 'inherit', fontSize: 14, outline: 'none' }} />
                <button type="submit" disabled={sending || !reply.trim()} className="sp-btn" style={{ padding: '13px 22px' }}>{sending ? 'Sending' : 'Send'}</button>
              </form>
            )}
          </div>
        </>
      )}

      {showNew && (
        <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <div className="sp-dialog">
            <button className="sp-x" onClick={() => setShowNew(false)} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            <h2>New message</h2>
            <p>Ask our team about an order, a design, or anything else.</p>
            <form onSubmit={submitNew}>
              <div className="sp-field"><label>Subject *</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Question about my order" /></div>
              <div className="sp-field"><label>Message *</label>
                <textarea required rows={5} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="How can we help?" /></div>
              {err && <div className="sp-msg err">{err}</div>}
              <button type="submit" disabled={submitting} className="sp-btn" style={{ width: '100%', justifyContent: 'center' }}>{submitting ? 'Sending…' : 'Send message'} <Arrow /></button>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
