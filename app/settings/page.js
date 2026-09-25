'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

const Eye = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {off
      ? <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" /><path d="M1 1l22 22" /></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>
);

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ business_name: '', contact_name: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setEmail(user.email || '');
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) {
        setProfile(prof);
        setForm({ business_name: prof.business_name || '', contact_name: prof.contact_name || '', phone: prof.phone || '' });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileSaving(true); setProfileMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    setProfileMsg(error ? `err:${error.message}` : 'ok:Profile updated.');
    setProfileSaving(false);
    setTimeout(() => setProfileMsg(''), 3500);
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pw.next.length < 8) { setPwMsg('err:Use at least 8 characters.'); return; }
    if (pw.next !== pw.confirm) { setPwMsg('err:The two passwords do not match.'); return; }
    setPwSaving(true); setPwMsg('');
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) setPwMsg(`err:${error.message}`);
    else { setPwMsg('ok:Password changed.'); setPw({ next: '', confirm: '' }); }
    setPwSaving(false);
    setTimeout(() => setPwMsg(''), 4000);
  }

  const msg = (m) => m && <div className={`sp-msg ${m.startsWith('ok:') ? 'ok' : 'err'}`}>{m.slice(m.indexOf(':') + 1)}</div>;

  return (
    <PortalShell active="settings" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Account</div>
          <h1>Settings</h1>
          <p>{email}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: 14, maxWidth: 720 }}>
        <form onSubmit={saveProfile} className="sp-card sp-in" style={{ '--i': 1 }}>
          <div className="sp-panel-head"><h2>Business profile</h2></div>
          <div className="sp-pad">
            <div className="sp-two">
              <div className="sp-field"><label>Business name</label><input value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} placeholder="Your business" /></div>
              <div className="sp-field"><label>Contact name</label><input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} placeholder="Your name" /></div>
            </div>
            <div className="sp-field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(201) 555-0182" /></div>
            {msg(profileMsg)}
            <button type="submit" disabled={profileSaving} className="sp-btn">{profileSaving ? 'Saving…' : 'Save profile'}</button>
          </div>
        </form>

        <form onSubmit={changePassword} className="sp-card sp-in" style={{ '--i': 2 }}>
          <div className="sp-panel-head"><h2>Change password</h2></div>
          <div className="sp-pad">
            {['next', 'confirm'].map((k) => (
              <div className="sp-field" key={k} style={{ position: 'relative' }}>
                <label>{k === 'next' ? 'New password' : 'Confirm new password'}</label>
                <input type={showPw ? 'text' : 'password'} value={pw[k]} onChange={(e) => setPw((p) => ({ ...p, [k]: e.target.value }))} autoComplete="new-password" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 0, bottom: 0, width: 46, height: 44, background: 'none', border: 0, color: showPw ? 'var(--y)' : 'var(--muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Eye off={showPw} />
                </button>
              </div>
            ))}
            {msg(pwMsg)}
            <button type="submit" disabled={pwSaving} className="sp-btn">{pwSaving ? 'Saving…' : 'Change password'}</button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
