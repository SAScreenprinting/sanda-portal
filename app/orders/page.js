export default function Orders() {
  const orders = [
    { id: '#1042', customer: 'John Smith', product: 'TEE-BLK-LG-DTG-FC', date: 'May 9, 2026', status: 'Shipped', tracking: '9400111899223397910435', cost: '$14.99' },
    { id: '#1041', customer: 'Sarah Jones', product: 'HOD-NVY-MD-DTG-FC', date: 'May 9, 2026', status: 'In Production', tracking: null, cost: '$29.99' },
    { id: '#1040', customer: 'Mike Brown', product: 'TEE-WHT-SM-DTF-FC', date: 'May 8, 2026', status: 'Awaiting Artwork', tracking: null, cost: '$14.99' },
    { id: '#1039', customer: 'Lisa Davis', product: 'CRW-HGR-XL-DTG-FC', date: 'May 8, 2026', status: 'QC Passed', tracking: null, cost: '$26.99' },
    { id: '#1038', customer: 'Tom Wilson', product: 'TEE-BLK-MD-DTG-BC', date: 'May 7, 2026', status: 'Awaiting Artwork', tracking: null, cost: '$14.99' },
    { id: '#1037', customer: 'Amy Chen', product: 'HAT-BLK-OS-EMB-FC', date: 'May 7, 2026', status: 'Shipped', tracking: '9400111899223397910436', cost: '$24.99' },
    { id: '#1036', customer: 'James Lee', product: 'TOT-NAT-OS-DTG-FC', date: 'May 6, 2026', status: 'Delivered', tracking: '9400111899223397910437', cost: '$13.99' },
    { id: '#1035', customer: 'Maria Garcia', product: 'LSL-BLK-LG-DTG-FC', date: 'May 6, 2026', status: 'Shipped', tracking: '9400111899223397910438', cost: '$17.99' },
    { id: '#1034', customer: 'David Kim', product: 'TEE-NVY-XL-DTG-FC', date: 'May 5, 2026', status: 'Delivered', tracking: '9400111899223397910439', cost: '$14.99' },
    { id: '#1033', customer: 'Emma White', product: 'HOD-BLK-SM-DTG-FC', date: 'May 5, 2026', status: 'Delivered', tracking: '9400111899223397910440', cost: '$29.99' },
  ]

  const statusColor = (status) => {
    switch (status) {
      case 'Shipped': return 'text-green-400 bg-green-400/10'
      case 'In Production': return 'text-blue-400 bg-blue-400/10'
      case 'Awaiting Artwork': return 'text-amber-400 bg-amber-400/10'
      case 'QC Passed': return 'text-green-400 bg-green-400/10'
      case 'Delivered': return 'text-white/40 bg-white/5'
      case 'On Hold': return 'text-red-400 bg-red-400/10'
      default: return 'text-white/40 bg-white/5'
    }
  }

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
            <span className="cursor-pointer hover:text-white transition-colors">Dashboard</span>
            <span className="text-white font-medium cursor-pointer">Orders</span>
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

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1">Orders</h1>
            <p className="text-white/40 text-sm">142 total orders — 10 shown</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Search by customer or order #"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors w-64"
          />
          <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/60 outline-none focus:border-white/30 transition-colors">
            <option value="">All statuses</option>
            <option value="awaiting">Awaiting Artwork</option>
            <option value="production">In Production</option>
            <option value="qc">QC Passed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="hold">On Hold</option>
          </select>
          <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/60 outline-none focus:border-white/30 transition-colors">
            <option value="">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>

        {/* Orders table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-6 px-6 py-3 border-b border-white/10 text-xs text-white/30 uppercase tracking-wider">
            <span>Order</span>
            <span>Customer</span>
            <span>Product</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Cost</span>
          </div>
          <div className="divide-y divide-white/5">
            {orders.map((order) => (
              <div key={order.id} className="grid grid-cols-6 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer items-center">
                <span className="text-sm font-medium text-white/60">{order.id}</span>
                <span className="text-sm text-white">{order.customer}</span>
                <span className="text-xs text-white/30 font-mono">{order.product}</span>
                <span className="text-xs text-white/40">{order.date}</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full w-fit ${statusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-sm text-white/60 text-right">{order.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-white/30">Showing 10 of 142 orders</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-xs text-white/40 border border-white/10 rounded-lg hover:border-white/30 hover:text-white transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 text-xs text-white bg-white/10 border border-white/20 rounded-lg">
              1
            </button>
            <button className="px-4 py-2 text-xs text-white/40 border border-white/10 rounded-lg hover:border-white/30 hover:text-white transition-colors">
              2
            </button>
            <button className="px-4 py-2 text-xs text-white/40 border border-white/10 rounded-lg hover:border-white/30 hover:text-white transition-colors">
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}