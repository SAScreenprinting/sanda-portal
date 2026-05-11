'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];

const STATUS_COLORS = {
  'approved': { bg:'#d1fae5', color:'#065f46', label:'Approved' },
  'pending':  { bg:'#fef3c7', color:'#92400e', label:'Pending Review' },
  'rejected': { bg:'#fee2e2', color:'#991b1b', label:'Rejected' },
};

const TYPE_COLORS = {
  'image/svg+xml': '#8b5cf6',
  'application/postscript': '#f59e0b',
  'application/pdf': '#ef4444',
  'image/png': '#3b82f6',
  'image/jpeg': '#10b981',
  'image/gif': '#ec4899',
};

function typeLabel(mime) {
  if (!mime) return 'FILE';
  if (mime.includes('svg')) return 'SVG';
  if (mime.includes('postscript') || mime.includes('illustrator')) return 'AI';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('png')) return 'PNG';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPG';
  return mime.split('/')[1]?.toUpperCase().slice(0,4) || 'FILE';
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const MOCK_FILES = [
  { id:'m1', file_name:'main_logo_final.svg',  file_type:'image/svg+xml',             file_size:43008,   created_at: new Date(Date.now()-259200000).toISOString(), status:'approved', order_id:null },
  { id:'m2', file_name:'jersey_front_v3.ai',   file_type:'application/postscript',    file_size:2201600, created_at: new Date(Date.now()-345600000).toISOString(), status:'pending',  order_id:null },
  { id:'m3', file_name:'jersey_back_v3.ai',    file_type:'application/postscript',    file_size:1887436, created_at: new Date(Date.now()-345600000).toISOString(), status:'pending',  order_id:null },
  { id:'m4', file_name:'sleeve_patch.pdf',     file_type:'application/pdf',           file_size:389120,  created_at: new Date(Date.now()-432000000).toISOString(), status:'pending',  order_id:null },
  { id:'m5', file_name:'sponsor_logo.png',     file_type:'image/png',                 file_size:245760,  created_at: new Date(Date.now()-1728000000).toISOString(), status:'approved', order_id:null },
];

export default function ArtworkPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef();

  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [userId, setUserId]     = useState(null);
  const [profile, setProfile]   = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUserId(user.id);

    const { data: prof } = await supabase.from('profiles').select('business_name, contact_name').eq('id', user.id).single();
    if (prof) setProfile(prof);

    const { data: artworks } = await supabase
      .from('artwork')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    setFiles(artworks?.length ? artworks : MOCK_FILES);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function uploadFiles(fileList) {
    if (!userId || !fileList?.length) return;
    setUploading(true);
    setUploadMsg('');

    for (const file of Array.from(fileList)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', userId);

      const res = await fetch('/api/artwork/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadMsg(`⚠ ${data.error || 'Upload failed'}`); setUploading(false); return; }
    }

    setUploadMsg(`✓ ${fileList.length} file${fileList.length > 1 ? 's' : ''} uploaded — pending review`);
    setTimeout(() => setUploadMsg(''), 4000);
    setUploading(false);
    loadData();
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  const filtered = filter === 'all' ? files : files.filter(f => f.status === filter);
  const displayName = profile?.business_name || profile?.contact_name || 'Client';
  const initial = displayName[0]?.toUpperCase() || '?';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>{loading ? '…' : initial}</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>{loading ? '—' : displayName}</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const isActive = item.id === 'artwork';
              return (
                <a key={item.id} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', textDecoration:'none', background:isActive?'#1a1a1a':'transparent', color:isActive?'white':'#666', fontSize:'13px', fontWeight:isActive?'600':'400' }}>
                  <span style={{ fontSize:'16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <a href="/" style={{ display:'block', padding:'8px 12px', color:'#666', fontSize:'12px', textDecoration:'none', textAlign:'center' }}>Sign Out</a>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px' }}>

        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'26px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>Artwork Library</h1>
          <p style={{ fontSize:'14px', color:'#aaa', margin:0 }}>
            {files.length} file{files.length !== 1 ? 's' : ''} · {files.filter(f => f.status === 'pending').length} pending review
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ border:`2px dashed ${dragging ? '#1a1a1a' : '#d1d5db'}`, borderRadius:'14px', padding:'32px', textAlign:'center', cursor:uploading?'default':'pointer', marginBottom:'24px', background:dragging?'rgba(0,0,0,0.03)':'white', transition:'all 0.15s' }}>
          <input ref={fileRef} type="file" multiple accept=".svg,.ai,.pdf,.png,.jpg,.jpeg,.eps,.gif,.webp" style={{ display:'none' }} onChange={e => uploadFiles(e.target.files)}/>
          {uploading ? (
            <div>
              <div style={{ fontSize:'28px', marginBottom:'8px' }}>⏳</div>
              <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>Uploading…</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:'32px', marginBottom:'8px' }}>🎨</div>
              <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a', marginBottom:'4px' }}>Drop files here or click to upload</div>
              <div style={{ fontSize:'12px', color:'#9ca3af' }}>SVG, AI, PDF, PNG, JPG, EPS · Max 20MB per file</div>
            </div>
          )}
        </div>

        {uploadMsg && (
          <div style={{ padding:'10px 16px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px', fontWeight:'500', background:uploadMsg.startsWith('✓')?'#d1fae5':'#fee2e2', color:uploadMsg.startsWith('✓')?'#065f46':'#991b1b' }}>
            {uploadMsg}
          </div>
        )}

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
          {[['all','All'],['approved','Approved'],['pending','Pending Review'],['rejected','Rejected']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding:'6px 16px', borderRadius:'20px', border:'none', background:filter===val?'#1a1a1a':'white', color:filter===val?'white':'#666', fontSize:'13px', cursor:'pointer', fontWeight:filter===val?'600':'400', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Files grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>Loading…</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
            {filtered.map(file => {
              const sc = STATUS_COLORS[file.status] || STATUS_COLORS.pending;
              const tc = TYPE_COLORS[file.file_type] || '#6b7280';
              const tl = typeLabel(file.file_type);
              const dateStr = new Date(file.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' });
              return (
                <div key={file.id} style={{ background:'white', borderRadius:'12px', padding:'18px', border:'1px solid #e5e5e5', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:`${tc}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:tc }}>
                      {tl}
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 8px', borderRadius:'20px', background:sc.bg, color:sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a1a', marginBottom:'4px', wordBreak:'break-all' }}>{file.file_name}</div>
                  <div style={{ fontSize:'12px', color:'#aaa', marginBottom:'12px' }}>{fmtSize(file.file_size)} · Uploaded {dateStr}</div>
                  {file.file_url && (
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:'12px', color:'#1a1a1a', fontWeight:'500', textDecoration:'none' }}>
                      View file →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>
            <div style={{ fontSize:'36px', marginBottom:'12px' }}>🎨</div>
            No files found. Upload your first artwork file above.
          </div>
        )}
      </div>
    </div>
  );
}
