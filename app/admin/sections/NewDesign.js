'use client';
import { useEffect, useState } from 'react';
import './../../../components/admin.css';
import CustomDesign from './CustomDesign';

// Two ways to make a design for a client (or for S&A itself). Either way it lands in their account already approved with its
// SKUs, so they can add it to their store.
export default function NewDesign() {
  const [clients, setClients] = useState([]);
  const [who, setWho] = useState('');
  const [building, setBuilding] = useState(false);
  useEffect(() => {
    fetch('/api/profiles/list', { cache: 'no-store' }).then((r) => r.json()).then((d) => setClients(d.profiles || [])).catch(() => {});
  }, []);
  return (
    <div className="ad" style={{ padding: 0, maxWidth: 'none', marginBottom: 18, display: 'grid', gap: 12 }}>
      <div className="ad-card ad-card-pad" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="ad-strong">Custom product</div>
          <div className="ad-muted" style={{ fontSize: 13, marginTop: 2 }}>Upload the artwork and a picture for each color, type the blank&apos;s name, and choose the colors and sizes. Every variant gets its SKU automatically.</div>
        </div>
        <button className="ad-btn ad-btn--primary" onClick={() => setBuilding(true)}>Create custom product</button>
      </div>
      <div className="ad-card ad-card-pad" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="ad-strong">Design on a catalog product</div>
          <div className="ad-muted" style={{ fontSize: 13, marginTop: 2 }}>Make it in the Design Studio on one of the catalog products. It lands in their account approved and ready to add to their store, and they get an email.</div>
        </div>
        <select className="ad-select" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="">Choose a client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name || c.contact_name || c.email}</option>)}
        </select>
        <button className="ad-btn" disabled={!who} onClick={() => { window.location.href = `/studio?client=${encodeURIComponent(who)}`; }}>Open Design Studio</button>
      </div>
      {building ? <CustomDesign clients={clients} onClose={(created) => { setBuilding(false); if (created) window.location.reload(); }} /> : null}
    </div>
  );
}
