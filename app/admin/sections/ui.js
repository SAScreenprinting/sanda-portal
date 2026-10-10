'use client';
import { useEffect, useState, useCallback } from 'react';

export const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (d) => (d ? new Date(String(d).length <= 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
export const clientName = (c) => c?.business_name || c?.contact_name || c?.email || 'Unknown client';

export function PageHead({ title, sub, children }) {
  return (
    <div className="ad-head">
      <div><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
      {children ? <div className="ad-actions">{children}</div> : null}
    </div>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`ad-card ad-stat${tone ? ` ad-stat--${tone}` : ''}`}>
      <div className="ad-stat-label">{label}</div>
      <div className="ad-stat-value">{value}</div>
      {sub ? <div className="ad-stat-sub">{sub}</div> : null}
    </div>
  );
}

export function Empty({ title, children }) {
  return <div className="ad-empty"><b>{title}</b>{children}</div>;
}

export function Badge({ tone, children }) {
  return <span className={`ad-badge${tone ? ` ad-badge--${tone}` : ''}`}>{children}</span>;
}

// Loads JSON from an admin API route and lets a screen refresh it.
export function useApi(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || 'Could not load this. Try again.'); setData(null); }
      else { setData(body); setError(''); }
    } catch { setError('Network error. Try again.'); }
    setLoading(false);
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

// Download rows as a spreadsheet-friendly CSV file.
export function downloadCsv(filename, columns, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(c.get(r))).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
