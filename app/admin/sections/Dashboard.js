'use client';
import { useEffect, useState } from 'react';
import { PageHead, Stat, Empty, money, useApi } from './ui';

// Everything here is counted from live data. `go` switches the admin to another screen.
export default function Dashboard({ go }) {
  const { data, error, loading, reload } = useApi('/api/admin/overview');
  const [podNew, setPodNew] = useState(0);

  useEffect(() => {
    fetch('/api/pod-orders?all=true', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setPodNew((d.orders || []).filter((o) => o.status === 'new').length))
      .catch(() => {});
  }, []);

  const a = data?.attention || {};
  const inv = data?.invoices || {};
  const ord = data?.orders || {};

  const queue = [
    { n: ord.awaitingArtwork, title: 'Orders waiting on artwork', sub: 'Clients need to upload files before printing starts', to: 'orders' },
    { n: a.designsToReview, title: 'Designs to review', sub: 'New designs from the Design Studio', to: 'designs' },
    { n: a.newRequests, title: 'New product requests', sub: 'Clients asking for a garment you do not list yet', to: 'requests' },
    { n: a.openInquiries, title: 'Open messages', sub: 'Conversations that are not resolved', to: 'messages' },
    { n: podNew, title: 'New S&A POD orders', sub: 'Store orders ready for production', to: 'poddesk' },
    { n: a.artworkPending, title: 'Artwork to approve', sub: 'Files clients uploaded to their orders', to: 'artwork' },
    { n: a.sampleRequests, title: 'Sample requests', sub: 'Clients who asked for a sample', to: 'samples' },
    { n: inv.overdueCount, title: 'Overdue invoices', sub: inv.overdueCount ? `${money(inv.overdueTotal)} past due` : '', to: 'billing' },
  ].filter((q) => q.n > 0);

  return (
    <div className="ad">
      <PageHead title="Dashboard" sub="What needs you today, counted from your real orders, messages and invoices.">
        <button className="ad-btn" onClick={reload} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </PageHead>

      {error ? <div className="ad-notice ad-notice--bad">{error}</div> : null}

      <div className="ad-stats">
        <Stat label="Clients" value={loading ? '–' : data?.clients ?? 0} sub="Portal accounts" />
        <Stat label="Open orders" value={loading ? '–' : ord.open ?? 0} sub={`${ord.total ?? 0} total`} />
        <Stat label="Unpaid invoices" value={loading ? '–' : money(inv.unpaidTotal)} sub={`${inv.unpaidCount ?? 0} open`} tone={inv.unpaidCount ? 'warn' : undefined} />
        <Stat label="Overdue" value={loading ? '–' : money(inv.overdueTotal)} sub={`${inv.overdueCount ?? 0} past due`} tone={inv.overdueCount ? 'bad' : undefined} />
        <Stat label="Paid, all time" value={loading ? '–' : money(inv.paidTotal)} tone="ok" />
      </div>

      <h2 className="ad-section-title" style={{ marginTop: 8 }}>Needs attention</h2>
      <div className="ad-card">
        {loading ? (
          <Empty title="Loading…" />
        ) : queue.length === 0 ? (
          <Empty title="You are all caught up">Nothing is waiting on you right now.</Empty>
        ) : (
          <div className="ad-queue">
            {queue.map((q) => (
              <button key={q.title} className="ad-queue-row" onClick={() => go(q.to)}>
                <div>
                  <div className="ad-queue-title">{q.title}</div>
                  {q.sub ? <div className="ad-queue-sub">{q.sub}</div> : null}
                </div>
                <span className="ad-queue-count">{q.n}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
