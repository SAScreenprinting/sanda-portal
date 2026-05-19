'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useMobile } from '@/hooks/useMobile';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];

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

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

const MOCK_FILES = [
  { id:'m1', file_name:'main_logo_final.svg',  label:'Main Logo',        file_type:'image/svg+xml',          file_size:43008,   created_at: new Date(Date.now()-259200000).toISOString(), status:'approved' },
  { id:'m2', file_name:'jersey_front_v3.ai',   label:'Jersey Front',     file_type:'application/postscript', file_size:2201600, created_at: new Date(Date.now()-345600000).toISOString(), status:'pending'  },
  { id:'m3', file_name:'sleeve_patch.pdf',      label:'Sleeve Patch',    file_type:'application/pdf',        file_size:389120,  created_at: new Date(Date.now()-432000000).toISOString(), status:'pending'  },
  { id:'m4', file_name:'sponsor_logo.png',      label:'Sponsor Logo',    file_type:'image/png',              file_size:245760,  created_at: new Date(Date.now()-1728000000).toISOString(), status:'approved' },
];

export default function ArtworkPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef();

  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState(null);
  const [profile, setProfile]     = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const isMobile = useMobile();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    setUserId(user.id);

    const { data: prof } = await supabase
      .from('profiles')
      .select('business_name, contact_name')
      .eq('id', user.id)
      .single();
    if (prof) setProfile(prof);

    const res = await fetch(`/api/artwork/list?clientId=${user.id}`);
    const json = await res.json();
    const artworks = json.artwork || [];
    setFiles(artworks.length ? artworks : MOCK_FILES);
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
      if (uploadLabel.trim()) fd.append('label', uploadLabel.trim());

      const res  = await fetch('/api/artwork/upload', { method:'POST', body:fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadMsg(`⚠ ${data.error || 'Upload failed'}`);
        setUploading(false);
        return;
      }
    }

    setUploadMsg(`✓ ${fileList.length} file${fileList.length > 1 ? 's' : ''} submitted for review`);
    setUploadLabel('');
    setTimeout(() => { setUploadMsg(''); setShowUpload(false); }, 3500);
    setUploading(false);
    loadData();
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  const approved = files.filter(f => f.status === 'approved');
  const pending  = files.filter(f => f.status === 'pending');
  const rejected = files.filter(f => f.status === 'rejected');
  const displayName = profile?.business_name || profile?.contact_name || 'Client';
  const initial     = displayName[0]?.toUpperCase() || '?';

  function FileCard({ file }) {
    const tc = TYPE_COLORS[file.file_type] || '#6b7280';
    const tl = typeLabel(file.file_type);
    const isApproved = file.status === 'approved';
    const isRejected = file.status === 'rejected';
    const isImage    = file.file_type?.startsWith('image/') && !file.file_type?.includes('svg');
    const canPreview = isImage && file.file_url;

    return (
      <div style={{
        background: 'white',
        borderRadius: '14px',
        overflow: 'hidden',
        border: `1px solid ${isApproved ? '#a7f3d0' : isRejected ? '#fecaca' : '#e5e7eb'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Image preview strip */}
        {canPreview ? (
          <div style={{ width:'100%', height:'140px', background:'#f9fafb', overflow:'hidden', position:'relative' }}>
            <img src={file.file_url} alt={file.label || file.file_name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        ) : file.file_url ? (
          <div style={{ width:'100%', height:'100px', background:`${tc}08`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'6px' }}>
            <div style={{ fontSize:'28px', fontWeight:'800', color:`${tc}`, opacity:0.5 }}>{tl}</div>
            <div style={{ fontSize:'11px', color:'#9ca3af' }}>Click below to open</div>
          </div>
        ) : null}

        {/* Card body */}
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
              {!canPreview && (
                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${tc}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', color:tc, flexShrink:0 }}>
                  {tl}
                </div>
              )}
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:'14px', fontWeight:'700', color:'#1a1a1a', marginBottom:'2px' }}>
                  {file.label || file.file_name}
                </div>
                <div style={{ fontSize:'11px', color:'#9ca3af', wordBreak:'break-all' }}>{file.file_name}</div>
              </div>
            </div>
            {isApproved && (
              <div style={{ background:'#d1fae5', color:'#065f46', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px', flexShrink:0 }}>
                ✓ On File
              </div>
            )}
            {isRejected && (
              <div style={{ background:'#fee2e2', color:'#991b1b', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px', flexShrink:0 }}>
                ✗ Revision Needed
              </div>
            )}
            {file.status === 'pending' && (
              <div style={{ background:'#fef3c7', color:'#92400e', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px', flexShrink:0 }}>
                ⏳ In Review
              </div>
            )}
          </div>

          <div style={{ fontSize:'12px', color:'#9ca3af' }}>
            {fmtSize(file.file_size)}{file.file_size ? ' · ' : ''}{fmtDate(file.created_at)}
          </div>

          {isRejected && file.admin_notes && (
            <div style={{ fontSize:'12px', color:'#991b1b', background:'#fff1f2', padding:'8px 12px', borderRadius:'8px', borderLeft:'3px solid #fca5a5' }}>
              <strong>Note from S&A:</strong> {file.admin_notes}
            </div>
          )}

          {file.file_url ? (
            <a href={file.file_url} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px', background:'#1a1a1a', color:'white', borderRadius:'9px', textDecoration:'none', fontSize:'13px', fontWeight:'600', marginTop:'auto' }}>
              🔗 Open File
            </a>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'9px', background:'#f3f4f6', color:'#9ca3af', borderRadius:'9px', fontSize:'13px' }}>
              No file URL
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:140, cursor:'pointer' }} />
      )}

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between', transform: isMobile && !sidebarOpen ? 'translateX(-220px)' : 'none', transition:'transform 0.25s ease', zIndex:150 }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={{ position:'absolute', top:'14px', right:'14px', background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#666', lineHeight:1, padding:'4px' }}>✕</button>
        )}
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
        <a href="/" onClick={async e => { e.preventDefault(); await supabase.auth.signOut(); router.push('/'); }}
          style={{ display:'block', padding:'8px 12px', color:'#666', fontSize:'12px', textDecoration:'none', textAlign:'center' }}>
          Sign Out
        </a>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft: isMobile ? 0 : '220px' }}>
        {isMobile && (
          <div style={{ position:'sticky', top:0, zIndex:50, padding:'12px 16px', background:'#EFEDE8', borderBottom:'1px solid rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:'12px' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#666', lineHeight:1, padding:'2px 4px' }}>☰</button>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'80px' }}/>
          </div>
        )}
        <div style={{ padding: isMobile ? '16px 14px' : '36px 32px', maxWidth:'900px' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', marginBottom:'28px' }}>
            <div>
              <h1 style={{ fontSize:'26px', fontWeight:'800', color:'#1a1a1a', margin:'0 0 4px' }}>Design Vault</h1>
              <p style={{ fontSize:'14px', color:'#9ca3af', margin:0 }}>
                {approved.length} design{approved.length !== 1 ? 's' : ''} on file · {pending.length} pending review
              </p>
            </div>
            <button onClick={() => setShowUpload(v => !v)}
              style={{ padding:'10px 20px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
              + Submit Artwork
            </button>
          </div>

          {/* Info banner */}
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'12px', padding:'14px 18px', marginBottom:'28px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
            <span style={{ fontSize:'20px', flexShrink:0 }}>📁</span>
            <div>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#92400e', marginBottom:'2px' }}>Your Design Vault</div>
              <div style={{ fontSize:'12px', color:'#a16207', lineHeight:'1.5' }}>
                These are the artwork files S&A Screen Printing has on file for your account. Approved designs are ready to use on your next order — just reference the design name when placing an order. Need to update a design? Submit a new file below.
              </div>
            </div>
          </div>

          {/* Upload panel */}
          {showUpload && (
            <div style={{ background:'white', borderRadius:'14px', border:'1px solid #e5e7eb', padding:'24px', marginBottom:'28px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h3 style={{ margin:0, fontSize:'16px', fontWeight:'700', color:'#1a1a1a' }}>Submit New Artwork</h3>
                <button onClick={() => setShowUpload(false)} style={{ background:'none', border:'none', color:'#9ca3af', fontSize:'20px', cursor:'pointer', lineHeight:1, padding:'2px' }}>✕</button>
              </div>

              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#6b7280', display:'block', marginBottom:'6px' }}>
                  Design Name / Label <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Logo, Jersey Back, Sleeve Patch…"
                  value={uploadLabel}
                  onChange={e => setUploadLabel(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'13px', color:'#1a1a1a', boxSizing:'border-box', outline:'none' }}
                />
              </div>

              <div
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => !uploading && fileRef.current?.click()}
                style={{ border:`2px dashed ${dragging ? '#1a1a1a' : '#d1d5db'}`, borderRadius:'12px', padding:'32px', textAlign:'center', cursor:uploading?'default':'pointer', background:dragging?'rgba(0,0,0,0.03)':'#fafafa', transition:'all 0.15s' }}>
                <input ref={fileRef} type="file" multiple accept=".svg,.ai,.pdf,.png,.jpg,.jpeg,.eps,.gif,.webp" style={{ display:'none' }} onChange={e => uploadFiles(e.target.files)}/>
                {uploading ? (
                  <div>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>⏳</div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>Uploading…</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:'30px', marginBottom:'8px' }}>🎨</div>
                    <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a', marginBottom:'4px' }}>Drop files here or click to browse</div>
                    <div style={{ fontSize:'12px', color:'#9ca3af' }}>SVG · AI · PDF · PNG · JPG · EPS · Max 20MB per file</div>
                  </div>
                )}
              </div>

              {uploadMsg && (
                <div style={{ marginTop:'12px', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', background:uploadMsg.startsWith('✓')?'#d1fae5':'#fee2e2', color:uploadMsg.startsWith('✓')?'#065f46':'#991b1b' }}>
                  {uploadMsg}
                </div>
              )}

              <p style={{ fontSize:'11px', color:'#9ca3af', marginTop:'12px', marginBottom:0, lineHeight:'1.5' }}>
                Files will be reviewed by S&A Screen Printing. Once approved, they'll appear in your Design Vault and can be referenced on future orders.
              </p>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>Loading your designs…</div>
          ) : (
            <>
              {/* On File (approved) */}
              <div style={{ marginBottom:'36px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#10b981' }}/>
                  <h2 style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#1a1a1a' }}>On File</h2>
                  <span style={{ fontSize:'12px', color:'#9ca3af', background:'#f3f4f6', padding:'2px 8px', borderRadius:'20px' }}>{approved.length}</span>
                </div>

                {approved.length === 0 ? (
                  <div style={{ background:'white', borderRadius:'12px', border:'1px dashed #d1d5db', padding:'32px', textAlign:'center' }}>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>📂</div>
                    <div style={{ fontSize:'13px', color:'#9ca3af' }}>No approved designs yet. Submit your artwork above and we'll review it.</div>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:'12px' }}>
                    {approved.map(f => <FileCard key={f.id} file={f} />)}
                  </div>
                )}
              </div>

              {/* Pending Review */}
              {pending.length > 0 && (
                <div style={{ marginBottom:'36px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b' }}/>
                    <h2 style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#1a1a1a' }}>Pending Review</h2>
                    <span style={{ fontSize:'12px', color:'#9ca3af', background:'#f3f4f6', padding:'2px 8px', borderRadius:'20px' }}>{pending.length}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:'12px' }}>
                    {pending.map(f => <FileCard key={f.id} file={f} />)}
                  </div>
                </div>
              )}

              {/* Rejected / Revision Needed */}
              {rejected.length > 0 && (
                <div style={{ marginBottom:'36px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ef4444' }}/>
                    <h2 style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#1a1a1a' }}>Revision Needed</h2>
                    <span style={{ fontSize:'12px', color:'#9ca3af', background:'#f3f4f6', padding:'2px 8px', borderRadius:'20px' }}>{rejected.length}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:'12px' }}>
                    {rejected.map(f => <FileCard key={f.id} file={f} />)}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>🎨</div>
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'#6b7280', marginBottom:'6px' }}>No artwork on file yet</div>
                  <div style={{ fontSize:'13px', color:'#9ca3af' }}>Click "Submit Artwork" to send us your design files.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
