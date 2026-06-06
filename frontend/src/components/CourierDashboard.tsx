import { useEffect, useState, useMemo, useCallback } from 'react'
import { LogOut, Navigation, Package, CheckCircle2, CloudLightning, Shield, MapPin, Truck, Play, Check } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { fetchOrders, updateOrderStatus, type Order } from '../api/routeClient'
import { RouteMap } from './RouteMap'
import { SoundToggle } from './SoundToggle'
import { pointOnPolyline } from '../utils/pathAgent'
import { fetchGraphData } from '../api/routeClient'
import type { GraphNode, GraphEdge } from '../types'

export function CourierDashboard({ onLogout }: { onLogout: () => void }) {
  const { currentUser, logout } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])
  const [graphLoaded, setGraphLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [agentT, setAgentT] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [routeVersion, setRouteVersion] = useState(0)

  // Fetch initial graph data for map visualization
  useEffect(() => {
    fetchGraphData().then(data => {
      if (data.ok) {
        setGraphNodes(data.nodes)
        setGraphEdges(data.edges)
        setGraphLoaded(true)
      } else {
        setError('Failed to fetch node network maps.')
      }
    }).catch(err => {
      setError(`Map connection failed: ${err.message || err}`)
    })
  }, [])

  // Load and poll active orders from backend
  const loadOrders = useCallback(async () => {
    try {
      const activeOrders = await fetchOrders()
      setOrders(activeOrders)
      
      // Keep selected order in sync with backend status
      if (selectedOrder) {
        const matching = activeOrders.find(o => o.id === selectedOrder.id)
        if (matching) {
          setSelectedOrder(matching)
        }
      }
    } catch (err) {
      console.error('Failed to sync orders:', err)
    }
  }, [selectedOrder])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [loadOrders])

  // Speak AI briefing to courier
  const speakBriefing = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 0.85
      utterance.volume = 0.5
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // Select an order & speak a tactical briefing
  const handleSelectOrder = useCallback((order: Order) => {
    setSelectedOrder(order)
    setAgentT(0)
    setIsNavigating(false)
    
    // Vocal AI briefing
    const detailText = `Courier ${currentUser?.name.split(' ')[0]}, order ${order.id.slice(-4)} has been selected. Dispatching from ${order.restaurant} to target ${order.customer}. Chosen transportation is an ${order.vehicle}. Current weather conditions are ${order.weather}.`
    speakBriefing(detailText)
  }, [currentUser, speakBriefing])

  // Handle status transit transition
  const handleStartTransit = async (order: Order) => {
    try {
      const res = await updateOrderStatus(order.id, 'in_transit')
      if (res.ok && res.order) {
        setSelectedOrder(res.order)
        setIsNavigating(true)
        setRouteVersion(prev => prev + 1)
        speakBriefing(`Transit initiated. Navigation locked along the C-optimized Dijkstra path. Proceed to client sector.`)
        await loadOrders()
      }
    } catch (e) {
      console.error('Failed to start transit:', e)
    }
  }

  // Handle status delivery transition
  const handleMarkDelivered = async (order: Order) => {
    try {
      const res = await updateOrderStatus(order.id, 'delivered')
      if (res.ok && res.order) {
        setSelectedOrder(res.order)
        setIsNavigating(false)
        setAgentT(1)
        speakBriefing(`Order successfully registered as delivered. Securing deck.`)
        await loadOrders()
      }
    } catch (e) {
      console.error('Failed to mark delivered:', e)
    }
  }

  const selectedOrderId = selectedOrder?.id
  const selectedOrderStatus = selectedOrder?.status
  const selectedOrderVehicle = selectedOrder?.vehicle

  // Simulate vehicle traversing the path in real-time if active in_transit
  useEffect(() => {
    if (!selectedOrderId || selectedOrderStatus !== 'in_transit' || !isNavigating) {
      if (selectedOrderStatus === 'delivered') {
        setAgentT(1)
      } else {
        setAgentT(0)
      }
      return
    }

    let raf = 0
    const start = performance.now()
    // Speed depends on vehicle type
    const duration = selectedOrderVehicle === 'drone' ? 8000 : (selectedOrderVehicle === 'crawler' ? 18000 : 12000)

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setAgentT(p)
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        // Automatically set to delivered conceptually or stop navigation
        setIsNavigating(false)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [selectedOrderId, selectedOrderStatus, selectedOrderVehicle, isNavigating, routeVersion])

  const currentPath = selectedOrder?.path || []

  // Resolve path positioning
  const agent = useMemo(
    () => (currentPath.length >= 2 && graphNodes.length > 0 ? pointOnPolyline(currentPath, graphNodes, agentT) : null),
    [currentPath, agentT, graphNodes],
  )

  const activeOrdersCount = orders.filter(o => o.status !== 'delivered').length

  return (
    <div className="grain relative h-screen w-screen overflow-hidden flex flex-col bg-frost-900">
      {/* Header */}
      <header className="shrink-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 glass rounded-none border-t-0 border-x-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-amber-500/35 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.08)] flex items-center justify-center">
            <Truck className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-400/80 font-bold font-mono">COURIER DISPATCH</p>
            <p className="text-sm font-medium text-white/80">Active Route Navigation Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] px-3.5 py-1.5 text-xs text-white/60 font-mono">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="text-[9px] text-white/40 uppercase">DRIVER:</span>
              <span className="font-semibold text-white/80 uppercase text-[10px]">{currentUser.name}</span>
              <span className="text-white/20 select-none">|</span>
              <span className="text-[9px] text-amber-300 font-bold">{currentUser.clearance}</span>
            </div>
          )}
          <SoundToggle />
          <button
            onClick={() => {
              logout()
              onLogout()
            }}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-1.5 text-xs text-red-400 font-bold font-mono transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 min-h-0 flex overflow-hidden p-4 gap-4">
        {/* Left Panel - Customer Orders Queue */}
        <section className="w-96 shrink-0 flex flex-col h-full z-10 glass rounded-3xl overflow-hidden border border-white/10">
          <div className="p-5 border-b border-white/10 shrink-0 bg-white/[0.01] flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-frost-400 font-bold font-mono">Grid Registry</p>
              <h2 className="text-lg font-light text-white tracking-wide">Customer Orders</h2>
            </div>
            <div className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
              {activeOrdersCount} ACTIVE
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/30 space-y-2">
                <Package className="h-8 w-8 opacity-30" />
                <p className="text-xs">No customer orders logged in grid database.</p>
              </div>
            ) : (
              orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => handleSelectOrder(o)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden ${
                    selectedOrder?.id === o.id
                      ? 'border-amber-500/50 bg-amber-500/[0.05] shadow-[0_0_20px_rgba(245,158,11,0.05)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2 font-mono">
                    <span className="text-xs font-bold text-white tracking-wide">{o.id}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                      o.status === 'pending'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : o.status === 'in_transit'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-white/80 font-medium mb-1 truncate">{o.customer}</p>
                  <div className="flex items-center gap-1 text-[10px] text-white/50 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>Deliver to Node {o.targetNode}</span>
                    <span className="text-white/20">•</span>
                    <span>From: {o.restaurant}</span>
                  </div>

                  <div className="border-t border-white/5 pt-2 flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono capitalize">
                      {o.vehicle} ({o.weather})
                    </span>
                    <span className="text-xs font-mono font-semibold text-white/80">${o.total.toFixed(2)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Center Panel - Holographic GPS Map & Navigation controls */}
        <section className="flex-1 relative rounded-3xl overflow-hidden glass border border-white/10 z-0 flex flex-col">
          {/* Map display */}
          <div className="flex-1 relative min-h-0">
            {graphLoaded ? (
              <RouteMap
                nodes={graphNodes}
                edges={graphEdges}
                visitOrder={selectedOrder?.visitOrder || []}
                path={currentPath}
                pulseNode={selectedOrder?.targetNode || null}
                agent={agent}
                stepIndex={selectedOrder?.status === 'in_transit' ? Math.round(agentT * currentPath.length) : (selectedOrder?.status === 'delivered' ? currentPath.length : 0)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 text-xs">
                {error || 'Loading GPS grid database...'}
              </div>
            )}

            {/* Float Navigation Overlay */}
            {selectedOrder && (
              <div className="absolute top-4 left-4 z-10 glass p-4 rounded-2xl border border-white/10 max-w-sm font-mono text-[11px] space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                  <Navigation className="h-3.5 w-3.5 animate-pulse" /> Telemetry Coordinates
                </div>
                <div className="space-y-1 text-white/70">
                  <div><span className="text-white/30">DISPATCH ID:</span> {selectedOrder.id}</div>
                  <div><span className="text-white/30">ROUTE PATH:</span> {currentPath.join(' ➡️ ')}</div>
                  <div><span className="text-white/30">VEHICLE TYPE:</span> <span className="capitalize">{selectedOrder.vehicle}</span></div>
                  <div><span className="text-white/30">WEATHER STATE:</span> <span className="capitalize">{selectedOrder.weather}</span></div>
                  <div><span className="text-white/30">EST. DISTANCE:</span> {selectedOrder.distance ? `${(selectedOrder.distance / 1000 * 0.42).toFixed(2)} km` : '—'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Control Deck */}
          <div className="p-5 border-t border-white/10 shrink-0 bg-white/[0.01] flex justify-between items-center gap-4">
            {selectedOrder ? (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">Active Navigation Target</span>
                  <span className="text-sm font-semibold text-white truncate max-w-xs">{selectedOrder.customer}</span>
                </div>

                <div className="flex gap-3">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => handleStartTransit(selectedOrder)}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-frost-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition shadow-[0_0_20px_rgba(245,158,11,0.2)] cursor-pointer"
                    >
                      <Play className="h-4 w-4" /> LOCK ROUTE & START TRANSIT
                    </button>
                  )}

                  {selectedOrder.status === 'in_transit' && (
                    <button
                      onClick={() => handleMarkDelivered(selectedOrder)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-frost-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> MARK AS DELIVERED
                    </button>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400 font-bold font-mono uppercase">
                      <CheckCircle2 className="h-4 w-4" /> Transit Completed Successfully
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-white/30 font-mono text-center w-full py-1">
                Select a client delivery registry card from the left panel to begin telemetry guidance.
              </p>
            )}
          </div>
        </section>

        {/* Right Panel - A.U.R.A. AI Copilot Briefing HUD */}
        <section className="w-80 shrink-0 flex flex-col h-full z-10 glass rounded-3xl border border-white/10 p-5 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wider uppercase">A.U.R.A. TAC-AI</span>
            </div>
            <span className="text-[8px] text-white/30 border border-white/10 px-2 py-0.5 rounded uppercase">V3.2 COOP</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-white/70 leading-relaxed pr-1 scrollbar-thin">
            {selectedOrder ? (
              <>
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-[11px] space-y-2">
                  <div className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] border-b border-white/5 pb-1">
                    Route Intelligence
                  </div>
                  <div>
                    {selectedOrder.weather === 'blizzard' && (
                      <div className="flex gap-2 text-red-400 border border-red-500/20 bg-red-500/5 p-2 rounded-lg text-[10px] mb-2">
                        <CloudLightning className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Blizzard Warning active. Ground routing limited. Safe-speed protocols enforced.</span>
                      </div>
                    )}
                    <span className="text-white/30">TACTICAL GUIDANCE:</span>
                    <p className="mt-1 font-sans text-xs text-white/80">
                      {selectedOrder.status === 'pending'
                        ? 'Dijkstra route computed and verified. Standard pathfinding is clear of blockages. Operator is cleared to lock coordinates.'
                        : selectedOrder.status === 'in_transit'
                          ? `GPS tracking is live. Sector pathing ${currentPath.join(' ➡️ ')} is active. ETA is calculated based on ${selectedOrder.vehicle} velocity.`
                          : 'Order delivered safely. Biometric handshake validated. Standard logs written to persistent memory database.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-[11px] space-y-2">
                  <div className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] border-b border-white/5 pb-1">
                    Items Manifest
                  </div>
                  <div className="space-y-1.5 font-sans">
                    {selectedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-white/80">
                        <span>{it.qty}x {it.name}</span>
                        <span className="font-mono text-white/50">${(it.price * it.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-1.5 flex justify-between font-mono text-xs text-white">
                      <span>MANIFEST TOTAL</span>
                      <span className="font-bold text-amber-400">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/30 p-4 space-y-2">
                <Shield className="h-8 w-8 opacity-20" />
                <p className="font-sans text-xs">Waiting for tactical routing selection. Keep visual radar scan active.</p>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-3 text-[9px] text-white/30 text-center">
            SATELLITE SYNC STATUS: <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
        </section>
      </main>
    </div>
  )
}
