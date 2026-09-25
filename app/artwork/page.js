'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PortalShell from '@/components/PortalShell';

function typeLabel(t) {
  if (!t) return 'FILE';
  const s = t.toLowerCase();
  if (s.includes('svg')) return 'SVG';
  if (s.includes('postscript') || s.includes('illustrator') || s === 'ai') return 'AI';
  if (s.includes('pdf')) return 'PDF';
  if (s.includes('png')) return 'PNG';
  if (s.includes('jpeg') || s.includes('jpg')) return 'JPG';
  return (s.split('/')[1] || s).toUpperCase().slice(0, 4);
}
const isImage = (t) => /png|jpe?g|gif|webp/i.test(t || '');
const fmtSize = (b) => (!b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const GROUPS = [
  { key: 'approved', title: 'On file', color: '#34d399' },
  { key: 'pending', title: 'In review', color: '#ffc800' },
  { key: 'rejected', title: 'Revision needed', color: '#f87171' },
];

function FileCard({ file, k }) {
  const preview = file.thumbnail || (isImage(file.file_type) ? file.file_url : null);
  return (
    <div className="sp-card sp-lift sp-dcard sp-in" style={{ '--i': k % 8 }}>
      <div className="sp-dthumb" style={{ background: preview ? '#fff' : 'var(--panel2)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="" loading="lazy" /> : <span className="sp-display" style={{ fontSize: 30, color: 'var(--dim)' }}>{typeLabel(file.file_type)}</span>}
      </div>
      <div className="sp-dbody">
        <div className="sp-dnum" style={{ color: '#fff', wordBreak: 'break-word' }}>{file.label || file.name || file.file_name}</div>
        <div className="sp-dprod" style={{ color: 'var(--muted)', margin: '4px 0 10px' }}>
          {typeLabel(file.file_type)}{file.file_size ? ` · ${fmtSize(file.file_size)}` : ''} · {fmtDate(file.created_at)}
        </div>
        {file.status === 'rejected' && file.admin_notes && <div className="sp-msg err" style={{ fontSize: 12.5 }}><b>Note from S&amp;A:</b> {file.admin_notes}</div>}
        {file.file_url && (
          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="sp-link">
            Open file
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M7 17L17 7M8 7h9v9" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function ArtworkPage() {
  const router = useRouter();
  const supabase = createClient();
  const [files, setFiles] = useState(null);
  const [profile, setProfile] = useState(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) setProfile(prof);
    const res = await fetch(`/api/artwork/list?clientId=${user.id}`, { cache: 'no-store' });
    const json = res.ok ? await res.json() : { artwork: [] };
    setFiles(json.artwork || []);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]); // eslint-disable-line react-hooks/set-state-in-effect

  async function signOut() { await supabase.auth.signOut(); router.push('/'); router.refresh(); }

  const status = (f) => f.status || 'approved'; // files with no review status are simply on file

  return (
    <PortalShell active="artwork" profile={profile} loading={!profile} onSignOut={signOut}>
      <header className="sp-head">
        <div className="sp-in">
          <div className="sp-eyebrow">Your files</div>
          <h1>Artwork library</h1>
          <p>Artwork S&amp;A has on file for your account. Approved files are ready for your next order.</p>
        </div>
      </header>

      {files === null ? (
        <div className="sp-card"><div className="sp-empty">Loading your artwork…</div></div>
      ) : files.length === 0 ? (
        <div className="sp-card sp-in">
          <div className="sp-empty">
            <b>No artwork on file yet</b>
            Create a design in the Design Studio and its print files will appear here.
            <div><a href="/studio" className="sp-btn">Open Design Studio</a></div>
          </div>
        </div>
      ) : (
        GROUPS.map((g) => {
          const list = files.filter((f) => status(f) === g.key);
          if (list.length === 0) return null;
          return (
            <section key={g.key} style={{ marginBottom: 34 }}>
              <div className="sp-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, background: g.color, display: 'inline-block' }} />
                {g.title} <span style={{ color: 'var(--dim)' }}>{list.length}</span>
              </div>
              <div className="sp-dgrid">{list.map((f, k) => <FileCard key={f.id} file={f} k={k} />)}</div>
            </section>
          );
        })
      )}
    </PortalShell>
  );
}
