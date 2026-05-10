'use client';
import { useState, useRef } from 'react';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
];

const MOCK_FILES = [
  { id:1, name:'main_logo_final.svg',     type:'SVG',  size:'42 KB',  uploaded:'May 8',  order:'#1051', status:'Approved' },
  { id:2, name:'jersey_front_v3.ai',      type:'AI',   size:'2.1 MB', uploaded:'May 7',  order:'#1049', status:'Pending Review' },
  { id:3, name:'jersey_back_v3.ai',       type:'AI',   size:'1.8 MB', uploaded:'May 7',  order:'#1049', status:'Pending Review' },
  { id:4, name:'sleeve_patch.pdf',        type:'PDF',  size:'380 KB', uploaded:'May 6',  order:'#1049', status:'Pending Review' },
  { id:5, name:'sponsor_logo.png',        type:'PNG',  size:'240 KB', uploaded:'Apr 20', order:'#1042', status:'Approved' },
  { id:6, name:'team_crest_v2.svg',       type:'SVG',  size:'88 KB',  uploaded:'Apr 18', order:'#1042', status:'Approved' },
];

const STATUS_COLORS = {
  'Approved':       { bg:'#d1fae5', color:'#065f46' },
  'Pending Review': { bg:'#fef3c7', color:'#92400e' },
  'Rejected':       { bg:'#fee2e2', color:'#991b1b' },
};

const TYPE_COLORS = {
  SVG: '#8b5cf6', AI: '#f59e0b', PDF: '#ef4444', PNG: '#3b82f6', JPG: '#10b981',
};

export default function ArtworkPage() {
  const [files, setFiles] = useState(MOCK_FILES);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('All');
  const fileRef = useRef();

  function handleFiles(newFiles) {
    setUploading(true);
    setTimeout(() => {
      const added = Array.from(newFiles).map((f, i) => ({
        id: Date.now() + i,
        name: f.name,
        type: f.name.split('.').pop().toUpperCase(),
        size: (f.size / 1024).toFixed(0) + ' KB',
        uploaded: 'Just now',
        order: 'Unassigned',
        status: 'Pending Review',
      }));
      setFiles(prev => [...added, ...prev]);
      setUploading(false);
    }, 1200);
  }

  const filtered = filter === 'All' ? files : files.filter(f => f.status === filter);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>R</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>Riverside Youth</div>
            <div style={{ fontSize:'12px', color:'#aaa' }}>Sports</div>
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' }}>
          <div>
            <h1 style={{ fontSize:'26px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>Artwork Library</h1>
            <p style={{ fontSize:'14px', color:'#aaa', margin:0 }}>{files.length} files · {files.filter(f=>f.status==='Pending Review').length} pending review</p>
          </div>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding:'10px 20px', background:'#1a1a1a', color:'white', borderRadius:'10px', fontSize:'13px', fontWeight:'600', border:'none', cursor:'pointer' }}>
            + Upload Files
          </button>
          <input ref={fileRef} type="file" multiple accept=".svg,.ai,.pdf,.png,.jpg,.eps" style={{ display:'none' }}
            onChange={e => handleFiles(e.target.files)}/>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          style={{ border:`2px dashed ${dragOver?'#1a1a1a':'#d1d5db'}`, borderRadius:'12px', padding:'28px', textAlign:'center', marginBottom:'24px', cursor:'pointer', background:dragOver?'#f0f0eb':'transparent', transition:'all 0.15s' }}>
          {uploading ? (
            <p style={{ color:'#1a1a1a', fontSize:'14px', fontWeight:'600', margin:0 }}>Uploading...</p>
          ) : (
            <>
              <p style={{ fontSize:'15px', fontWeight:'600', color:'#1a1a1a', margin:'0 0 4px' }}>Drop files here to upload</p>
              <p style={{ fontSize:'13px', color:'#aaa', margin:0 }}>SVG · AI · PDF · PNG · JPG · EPS · Max 50MB</p>
            </>
          )}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
          {['All', 'Approved', 'Pending Review', 'Rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'6px 16px', borderRadius:'20px', border:'none', background:filter===f?'#1a1a1a':'white', color:filter===f?'white':'#666', fontSize:'13px', cursor:'pointer', fontWeight:filter===f?'600':'400', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Files grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
          {filtered.map(file => {
            const sc = STATUS_COLORS[file.status] || STATUS_COLORS['Pending Review'];
            const tc = TYPE_COLORS[file.type] || '#6b7280';
            return (
              <div key={file.id} style={{ background:'white', borderRadius:'12px', padding:'18px', border:'1px solid #e5e5e5', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:`${tc}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:tc }}>
                    {file.type}
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:'600', padding:'3px 8px', borderRadius:'20px', background:sc.bg, color:sc.color }}>{file.status}</span>
                </div>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a1a', marginBottom:'4px', wordBreak:'break-all' }}>{file.name}</div>
                <div style={{ fontSize:'12px', color:'#aaa', marginBottom:'12px' }}>{file.size} · Uploaded {file.uploaded}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <a href={`/orders/${file.order.replace('#','')}`}
                    style={{ fontSize:'12px', color:'#1a1a1a', fontWeight:'500', textDecoration:'none' }}>
                    Order {file.order} →
                  </a>
                  <button onClick={() => setFiles(f => f.filter(x => x.id !== file.id))}
                    style={{ fontSize:'11px', color:'#aaa', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px', color:'#aaa' }}>No files found.</div>
        )}
      </div>
    </div>
  );
}
