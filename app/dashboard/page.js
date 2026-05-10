export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Top navigation */}
      <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <img
            src="/Logo2.png"
            alt="S&A Screen Printing"
            style={{ width: '140px', objectFit: 'contain' }}
          />
          <div className="hidden md:flex items-center gap-6 text-sm text-white/40">
            <span className="text-white font-medium cursor-pointer">Dashboard</span>
            <span className="cursor-pointer hover:text-white transition-colors">Orders</span>
            <span className="cursor-pointer hover:text-white transition-colors">Artwork</span>
            <span className="cursor-pointer hover:text-white transition-colors">Inventory</span>
            <span className="cursor-pointer hover:text-white transition-colors">Design Studio</span>
            <span className="cursor-pointer hover:text-white transition-colors">Billing</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">Brand A</p>
            <p className="text-xs text-white/30">Growth tier</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
            BA
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="px-8 py-8 max-w-7xl mx-auto">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Good morning, Brand A</h1>
          <p className="text-white/40 text-sm">Here is what is happening with your orders today</p>
        </div>

        {/* Alert banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <p className="text-sm text-amber-400 font-medium">2 orders are waiting for your artwork upload</p>
          </div>
          <span className="text-xs text-amber-400/60 cursor-pointer hover:text-amber-400 transition-colors">View orders →</span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Total orders</p>
            <p className="text-3xl font-semibold text-white">142</p>
            <p className="text-xs text-white/20 mt-1">all time</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">This month</p>
            <p className="text-3xl font-semibold text-white">24</p>
            <p className="text-xs text-white/20 mt-1">May 2026</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">In production</p>
            <p className="text-3xl font-semibold text-white">6</p>
            <p className="text-xs text-white/20 mt-1">right now</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Shipped this week</p>
            <p className="text-3xl font-semibold text-white">11</p>
            <p className="text-xs text-white/20 mt-1">last 7 days</p>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Recent orders</h2>
            <span className="text-xs text-white/30 cursor-pointer hover:text-white transition-colors">View all →</span>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { id: '#1042', product: 'TEE-BLK-LG-DTG-FC', customer: 'John Smith', status: 'Shipped', statusColor: 'text-green-400 bg-green-400/10' },
              { id: '#1041', product: 'HOD-NVY-MD-DTG-FC', customer: 'Sarah Jones', status: 'In Production', statusColor: 'text-blue-400 bg-blue-400/10' },
              { id: '#1040', product: 'TEE-WHT-SM-DTF-FC', customer: 'Mike Brown', status: 'Awaiting Artwork', statusColor: 'text-amber-400 bg-amber-400/10' },
              { id: '#1039', product: 'CRW-HGR-XL-DTG-FC', customer: 'Lisa Davis', status: 'QC Passed', statusColor: 'text-green-400 bg-green-400/10' },
              { id: '#1038', product: 'TEE-BLK-MD-DTG-BC', customer: 'Tom Wilson', status: 'Awaiting Artwork', statusColor: 'text-amber-400 bg-amber-400/10' },
            ].map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-white/60 w-14">{order.id}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{order.customer}</p>
                    <p className="text-xs text-white/30 font-mono">{order.product}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${order.statusColor}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg turnaround */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-medium text-white mb-4">Average turnaround</h2>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-semibold text-white">1.8</p>
            <p className="text-white/40 text-sm mb-1">business days</p>
          </div>
          <p className="text-xs text-white/20">Based on last 30 days — SLA is 2 days</p>
          <div className="mt-4 h-1 bg-white/10 rounded-full">
            <div className="h-1 bg-white rounded-full" style={{ width: '90%' }}></div>
          </div>
        </div>

      </div>
    </div>
  )
}