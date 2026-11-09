'use client';
import { useEffect, useState } from 'react';
import './../../../components/admin.css';

// Start the Design Studio for a client (or for S&A itself). The design is saved to that client's account, already approved
// with its SKU, so they can publish it to their store.
export default function NewDesign() {
  const [clients, setClients] = useState([]);
  const [who, setWho] = useState('');
  useEffect(() => {
    fetch('/api/profiles/list', { cache: 'no-store' }).then((r) => r.json()).then((d) => setClients(d.profiles || [])).catch(() => {});
  }, []);
  return (
    <div className="ad" style={{ padding: 0, maxWidth: 'none', marginBottom: 18 }}>
      <div className="ad-card ad-card-pad" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="ad-strong">Create a design for a client</div>
          <div className="ad-muted" style={{ fontSize: 13, marginTop: 2 }}>Make it in the Design Studio. It lands in their account approved and ready to publish to their store, and they get an email.</div>
        </div>
        <select className="ad-select" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Choose a client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name || c.contact_name || c.email}</option>)}
        </select>
        <button className="ad-btn ad-btn--primary" disabled={!who} onClick={() => { window.location.href = `/studio?client=${encodeURIComponent(who)}`; }}>Open Design Studio</button>
      </div>
    </div>
  );
}
