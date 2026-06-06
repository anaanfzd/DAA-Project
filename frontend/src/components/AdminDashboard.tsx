import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ShieldCheck, RefreshCw, Package, Truck, CheckCircle2, Clock, BarChart3, Users, TrendingUp } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { fetchOrders, updateOrderStatus, type Order } from '../api/routeClient'
import { SoundToggle } from './SoundToggle'

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { currentUser, logout } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const data = await fetchOrders()
      setOrders(data)
      setError(null)
      // Update selected order if it exists
      if (selectedOrder) {
        const updated = data.find(o => o.id === selectedOrder.id)
        if (updated) setSelectedOrder(updated)
      }
    } catch (e) {
      setError('Failed to fetch orders from the logistics grid.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedOrder])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(() => loadOrders(), 5000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'in_transit' | 'delivered') => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      await loadOrders()
    } catch (e) {
      console.error('Failed to update status:', e)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter(o =>
    filterStatus === 'all' ? true : o.status === filterStatus
  )

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inTransit: orders.filter(o => o.status === 'in_transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((acc, o) => acc + (o.total || 0), 0)
  }

  const statusConfig = {
    pending: { label: 'Pending', color: 'cyan', icon: Clock },
    in_transit: { label: 'In Transit', color: 'amber', icon: Truck },
    delivered: { label: 'Delivered', color: 'emerald', icon: CheckCircle2 }
  }

  return (
    <div className="grain relative h-screen w-screen overflow-hidden flex flex-col bg-frost-900">

      {/* Header */}
      <header className="shrink-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 glass rounded-none border-t-0 border-x-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-purple-500/35 bg-purple-500/5 shadow-[0_0_40px_rgba(168,85,247,0.12)] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/80 font-bold font-mono">ADMIN COMMAND</p>
            <p className="text-sm font-medium text-white/80 font-sans">FrostRoute Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] px-3.5 py-1.5 text-xs text-white/60 font-mono">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-[9px] text-white/40 uppercase">ADMIN:</span>
              <span className="font-semibold text-white/80 uppercase text-[10px]">{currentUser.name}</span>
              <span className="text-white/20 select-none">|</span>
              <span className="text-[9px] text-purple-300 font-bold">{currentUser.clearance}</span>
            </div>
          )}
          <SoundToggle />
          <button
            onClick={() => { logout(); onLogout() }}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-1.5 text-xs text-red-400 font-bold font-mono transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            LOGOUT
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex overflow-hidden p-4 gap-4">

        {/* Left Panel - Stats */}
        <section className="w-64 shrink-0 flex flex-col gap-3 h-full">

          {/* Stats Cards */}
          <div className="glass rounded-3xl border border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono font-bold">Live Grid Stats</span>
            </div>

            {[
              { label: 'Total Orders', value: stats.total, icon: Package, color: 'white' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'cyan' },
              { label: 'In Transit', value: stats.inTransit, icon: Truck, color: 'amber' },
              { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'emerald' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
                  <span className="text-[11px] text-white/50 font-mono">{label}</span>
                </div>
                <span className={`text-sm font-bold font-mono text-${color}-300`}>{value}</span>
              </div>
            ))}

            <div className="border-t border-white/10 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[11px] text-white/50 font-mono">Revenue</span>
              </div>
              <span className="text-sm font-bold font-mono text-purple-300">${stats.revenue.toFixed(2)}</span>
            </div>
          </div>

          {/* Filter */}
          <div className="glass rounded-3xl border border-white/10 p-4 space-y-2">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
              <Users className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono font-bold">Filter Orders</span>
            </div>
            {(['all', 'pending', 'in_transit', 'delivered'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider transition cursor-pointer border ${
                  filterStatus === s
                    ? s === 'all'
                      ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                      : s === 'pending'
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                        : s === 'in_transit'
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/5 bg-white/[0.01] text-white/40 hover:border-white/15 hover:text-white/70'
                }`}
              >
                {s === 'all' ? '⬡ All Orders' : s === 'in_transit' ? '🚚 In Transit' : s === 'pending' ? '⏳ Pending' : '✓ Delivered'}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-mono uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh Grid'}
          </button>
        </section>

        {/* Center Panel - Orders Table */}
        <section className="flex-1 glass rounded-3xl border border-white/10 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/10 shrink-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/80 font-bold font-mono">Order Registry</p>
              <h2 className="text-lg font-light text-white">
                {filteredOrders.length} {filterStatus === 'all' ? 'Total' : filterStatus.replace('_', ' ')} Orders
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/30 uppercase">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync Active
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm font-mono animate-pulse">
                Fetching order registry...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-400 text-sm font-mono">
                {error}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm font-mono">
                No orders found.
              </div>
            ) : (
              <AnimatePresence>
                {filteredOrders.map((order) => {
                  const cfg = statusConfig[order.status as keyof typeof statusConfig]
                  const StatusIcon = cfg?.icon || Clock
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onClick={() => setSelectedOrder(order.id === selectedOrder?.id ? null : order)}
                      className={`rounded-2xl border p-4 transition cursor-pointer ${
                        selectedOrder?.id === order.id
                          ? 'border-purple-500/40 bg-purple-500/[0.04]'
                          : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-white font-mono">{order.id}</span>
                          <span className="text-[10px] text-white/50 font-sans">{order.restaurant}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border font-mono ${
                            order.status === 'pending'
                              ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5'
                              : order.status === 'in_transit'
                                ? 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                                : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                          }`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {order.status.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                        <div className="flex gap-4">
                          <span>📦 {order.items?.length || 0} items</span>
                          <span>🗺 Node {order.restaurantNode} → {order.targetNode}</span>
                          <span>🚗 {order.vehicle}</span>
                        </div>
                        <span className="font-bold text-white/70">${(order.total || 0).toFixed(2)}</span>
                      </div>

                      {/* Inline Status Controls */}
                      <AnimatePresence>
                        {selectedOrder?.id === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                              {/* Order details */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                <div className="space-y-1">
                                  <p className="text-white/30 uppercase text-[8px]">Customer</p>
                                  <p className="text-white/70">{order.customer}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-white/30 uppercase text-[8px]">Timestamp</p>
                                  <p className="text-white/70">{new Date(order.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-white/30 uppercase text-[8px]">Weather</p>
                                  <p className="text-white/70 capitalize">{order.weather}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-white/30 uppercase text-[8px]">Route Path</p>
                                  <p className="text-white/70">{order.path?.join(' → ') || 'N/A'}</p>
                                </div>
                              </div>

                              {/* Items list */}
                              {order.items && order.items.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-white/30 uppercase text-[8px] font-mono">Order Items</p>
                                  {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-[10px] text-white/60 font-sans">
                                      <span>{item.qty}x {item.name}</span>
                                      <span className="font-mono text-white/40">${(item.price * item.qty).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Status change controls */}
                              <div className="space-y-1.5">
                                <p className="text-white/30 uppercase text-[8px] font-mono">Update Status</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['pending', 'in_transit', 'delivered'] as const).map(s => (
                                    <button
                                      key={s}
                                      disabled={order.status === s || updatingId === order.id}
                                      onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, s) }}
                                      className={`py-1.5 rounded-xl text-[9px] font-bold uppercase font-mono tracking-wider border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                        order.status === s
                                          ? s === 'pending'
                                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                                            : s === 'in_transit'
                                              ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                                              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                          : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/70'
                                      }`}
                                    >
                                      {updatingId === order.id ? '...' : s === 'in_transit' ? 'Transit' : s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
