import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Sparkles, Navigation, Plus, Minus } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { fetchOrders, createOrder, type Order, fetchGraphData } from '../api/routeClient'
import { RouteMap } from './RouteMap'
import { SoundToggle } from './SoundToggle'
import { AuraCopilot } from './AuraCopilot'
import { pointOnPolyline } from '../utils/pathAgent'
import type { GraphNode, GraphEdge, Restaurant, MenuItem, VehicleType, WeatherLevel } from '../types'

export function CustomerDashboard({ onLogout }: { onLogout: () => void }) {
  const { currentUser, logout } = useUser()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedKitchen, setSelectedKitchen] = useState<Restaurant | null>(null)
  const [cart, setCart] = useState<{ item: MenuItem; qty: number }[]>([])
  
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])
  const [graphLoaded, setGraphLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order settings
  const [customerId, setCustomerId] = useState<number>(9) // Default home sector
  const [vehicle, setVehicle] = useState<VehicleType>('hoverbike')
  const [weather, setWeather] = useState<WeatherLevel>('clear')
  const [traffic, setTraffic] = useState(0.35)
  const [mode, setMode] = useState<'fastest' | 'least_traffic'>('fastest')
  
  // Tracking
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)
  const [agentT, setAgentT] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [routeVersion] = useState(0)

  // Fetch initial graph and kitchen lists
  useEffect(() => {
    fetchGraphData().then(data => {
      if (data.ok) {
        setGraphNodes(data.nodes)
        setGraphEdges(data.edges)
        setRestaurants(data.restaurants)
        setGraphLoaded(true)
      } else {
        setError('Failed to fetch grid database.')
      }
    }).catch(err => {
      setError(`Grid database offline: ${err.message || err}`)
    })
  }, [])

  // Sync tracking order status from backend
  const loadMyOrders = useCallback(async () => {
    try {
      const allOrders = await fetchOrders()
      // Update selected tracking order status
      if (trackingOrder) {
        const matching = allOrders.find(o => o.id === trackingOrder.id)
        if (matching) {
          setTrackingOrder(matching)
        }
      }
    } catch (e) {
      console.error('Failed to reload orders:', e)
    }
  }, [trackingOrder])

  useEffect(() => {
    loadMyOrders()
    const interval = setInterval(loadMyOrders, 4000) // Poll every 4s
    return () => clearInterval(interval)
  }, [loadMyOrders])

  // Biometric TTS speech vocalization
  const speakStatusUpdate = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 0.9
      utterance.volume = 0.4
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx].qty += 1
        return copy
      }
      return [...prev, { item, qty: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === itemId)
      if (idx >= 0) {
        const copy = [...prev]
        if (copy[idx].qty > 1) {
          copy[idx].qty -= 1
          return copy
        }
        return copy.filter(c => c.item.id !== itemId)
      }
      return prev
    })
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, c) => acc + c.item.price * c.qty, 0)
  }, [cart])

  // Place order
  const handlePlaceOrder = async () => {
    if (!selectedKitchen || cart.length === 0) return
    
    try {
      const res = await createOrder({
        customer: `${currentUser?.name}'s Habitat Sector`,
        targetNode: customerId,
        restaurant: selectedKitchen.name,
        restaurantNode: selectedKitchen.nodeId,
        items: cart.map(c => ({ name: c.item.name, qty: c.qty, price: c.item.price })),
        total: cartTotal,
        vehicle,
        weather
      })

      if (res.ok && res.order) {
        setCart([])
        setSelectedKitchen(null)
        setTrackingOrder(res.order)
        setAgentT(0)
        setIsNavigating(false)
        speakStatusUpdate(`Order placed successfully. Dijkstra solver is mapping coordinates for optimal delivery transit.`)
        await loadMyOrders()
      }
    } catch (e) {
      console.error('Failed to submit order:', e)
    }
  }


  // Animate transit along polyline path
  useEffect(() => {
    if (!trackingOrder || trackingOrder.status !== 'in_transit') {
      if (trackingOrder?.status === 'delivered') {
        setAgentT(1)
      } else {
        setAgentT(0)
      }
      return
    }

    let raf = 0
    const start = performance.now()
    const duration = trackingOrder.vehicle === 'drone' ? 8000 : (trackingOrder.vehicle === 'crawler' ? 18000 : 12000)

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setAgentT(p)
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setIsNavigating(false)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [trackingOrder, isNavigating, routeVersion])

  const currentPath = trackingOrder?.path || []
  const agent = useMemo(
    () => (currentPath.length >= 2 && graphNodes.length > 0 ? pointOnPolyline(currentPath, graphNodes, agentT) : null),
    [currentPath, agentT, graphNodes],
  )

  const customers = useMemo(() => {
    return graphNodes
      .filter(n => n.type === 'customer')
      .map(n => ({ id: n.id, label: n.label }))
  }, [graphNodes])

  return (
    <div className="grain relative h-screen w-screen overflow-hidden flex flex-col bg-frost-900">
      {/* Header */}
      <header className="shrink-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 glass rounded-none border-t-0 border-x-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-emerald-500/35 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.08)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400/80 font-bold font-mono">CUSTOMER PORTAL</p>
            <p className="text-sm font-medium text-white/80 font-sans">FrostRoute Delivery Deck</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] px-3.5 py-1.5 text-xs text-white/60 font-mono">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] text-white/40 uppercase">CLIENT:</span>
              <span className="font-semibold text-white/80 uppercase text-[10px]">{currentUser.name}</span>
              <span className="text-white/20 select-none">|</span>
              <span className="text-[9px] text-emerald-300 font-bold">{currentUser.clearance}</span>
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
        
        {/* Left Panel - Supply selection & Shopping Cart */}
        <section className="w-80 shrink-0 flex flex-col h-full z-10 glass rounded-3xl overflow-hidden border border-white/10">
          <div className="p-5 border-b border-white/10 shrink-0 bg-white/[0.01]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-frost-400 font-bold font-mono">Thermal Supply</p>
            <h2 className="text-lg font-light text-white tracking-wide">
              {selectedKitchen ? 'Select Menu' : 'Available Outposts'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="wait">
              {!selectedKitchen ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2.5"
                >
                  {restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedKitchen(r)}
                      className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/20 hover:bg-white/[0.04] flex gap-3"
                    >
                      <img src={r.image} alt={r.name} className="h-12 w-12 rounded-xl object-cover border border-white/10 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-white truncate">{r.name}</h3>
                        <p className="text-[10px] text-frost-300 truncate">{r.cuisine}</p>
                        <div className="mt-1 flex gap-2 text-[9px] text-white/40">
                          <span>Node {r.nodeId}</span>
                          <span>★ {r.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <button
                    onClick={() => setSelectedKitchen(null)}
                    className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white mb-2 transition font-mono uppercase"
                  >
                    ← Back to Outposts
                  </button>

                  <div className="pb-2 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-white truncate">{selectedKitchen.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono">Kitchen Node: {selectedKitchen.nodeId}</p>
                  </div>

                  <div className="space-y-2">
                    {selectedKitchen.menu.map((m) => {
                      const qty = cart.find(c => c.item.id === m.id)?.qty || 0
                      return (
                        <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex justify-between items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-white truncate">{m.name}</h4>
                            <p className="text-[9px] text-white/40 leading-relaxed truncate">{m.desc}</p>
                            <p className="text-xs font-mono font-medium text-white/70 mt-1">${m.price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {qty > 0 ? (
                              <>
                                <button
                                  onClick={() => removeFromCart(m.id)}
                                  className="rounded-full bg-white/5 border border-white/10 p-1 text-white hover:bg-white/15"
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </button>
                                <span className="text-xs font-mono text-white/80 font-bold">{qty}</span>
                              </>
                            ) : null}
                            <button
                              onClick={() => addToCart(m)}
                              className="rounded-full bg-white/10 border border-white/10 p-1.5 text-white hover:bg-white/20"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart & Checkout */}
          <div className="p-5 border-t border-white/10 shrink-0 bg-white/[0.02] space-y-3 font-mono text-xs">
            <div className="flex justify-between text-[10px] text-white/40 uppercase">
              <span>Checkout Payload</span>
              <span>{cart.length} items</span>
            </div>

            {cart.length === 0 ? (
              <p className="text-[10px] text-white/30 text-center py-2 font-sans italic">Your checkout queue is empty.</p>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {cart.map((c) => (
                  <div key={c.item.id} className="flex justify-between text-[11px] text-white/80 font-sans">
                    <span className="truncate pr-2">{c.qty}x {c.item.name}</span>
                    <span className="font-mono text-white/40">${(c.item.price * c.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-white/5">
                {/* Configuration Options */}
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <label className="text-[9px] text-white/30 uppercase block mb-1">My Sector</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(Number(e.target.value))}
                      className="w-full bg-frost-900 border border-white/10 rounded px-1.5 py-0.5 text-white text-[10px]"
                    >
                      {customers.map(c => <option key={c.id} value={c.id}>Node {c.id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-white/30 uppercase block mb-1">Transit</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value as VehicleType)}
                      className="w-full bg-frost-900 border border-white/10 rounded px-1.5 py-0.5 text-white text-[10px]"
                    >
                      <option value="hoverbike">Hoverbike</option>
                      <option value="crawler">Crawler</option>
                      <option value="drone">Drone</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-white/30 uppercase block mb-1">Weather</label>
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value as WeatherLevel)}
                      className="w-full bg-frost-900 border border-white/10 rounded px-1.5 py-0.5 text-white text-[10px]"
                    >
                      <option value="clear">Clear</option>
                      <option value="snow">Snow</option>
                      <option value="blizzard">Blizzard</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-white text-xs">
                  <span>TOTAL COST</span>
                  <span className="text-emerald-400">${cartTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-2.5 text-center text-frost-900 font-bold uppercase rounded-xl bg-emerald-400 hover:bg-emerald-500 tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.15)] transition cursor-pointer"
                >
                  DISPATCH SUPPLY VEHICLE
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Center Panel - Real-time Transit GPS radar map */}
        <section className="flex-1 relative rounded-3xl overflow-hidden glass border border-white/10 z-0 flex flex-col">
          <div className="flex-1 relative min-h-0">
            {graphLoaded ? (
              <RouteMap
                nodes={graphNodes}
                edges={graphEdges}
                visitOrder={trackingOrder?.visitOrder || []}
                path={currentPath}
                pulseNode={trackingOrder?.targetNode || null}
                agent={agent}
                stepIndex={trackingOrder?.status === 'in_transit' ? Math.round(agentT * currentPath.length) : (trackingOrder?.status === 'delivered' ? currentPath.length : 0)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 text-xs">
                {error || 'Loading GPS grid database...'}
              </div>
            )}

            {/* Tracking coordinates display */}
            {trackingOrder && (
              <div className="absolute top-4 left-4 z-10 glass p-4 rounded-2xl border border-white/10 max-w-sm font-mono text-[11px] space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                  <Navigation className="h-3.5 w-3.5 animate-pulse" /> Dispatch Tracker
                </div>
                <div className="space-y-1 text-white/70">
                  <div><span className="text-white/30">ORDER CODE:</span> {trackingOrder.id}</div>
                  <div><span className="text-white/30">COURIER STATUS:</span> <span className="text-emerald-300 uppercase font-bold">{trackingOrder.status.replace('_', ' ')}</span></div>
                  <div><span className="text-white/30">ROUTE PATH:</span> {currentPath.join(' ➡️ ')}</div>
                  <div><span className="text-white/30">VEHICLE ASSIGNED:</span> <span className="capitalize">{trackingOrder.vehicle}</span></div>
                  <div><span className="text-white/30">CURRENT WEATHER:</span> <span className="capitalize">{trackingOrder.weather}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-white/10 shrink-0 bg-white/[0.01] flex justify-between items-center">
            {trackingOrder ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">Tracking Active Delivery</span>
                  <span className="text-sm font-semibold text-white font-sans">{trackingOrder.restaurant} ➡️ Node {trackingOrder.targetNode}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white/60">Estimated Transit ETA:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {trackingOrder.status === 'pending' 
                      ? 'Waiting for Driver...' 
                      : trackingOrder.status === 'in_transit'
                        ? 'En Route (Live GPS)'
                        : 'Arrived!'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30 font-mono text-center w-full py-1">
                Select an order from your history on the right panel to initialize active GPS radar tracking.
              </p>
            )}
          </div>
        </section>

        {/* Right Panel - A.U.R.A. Copilot */}
        <section className="w-96 shrink-0 flex flex-col h-full z-10">
          <AuraCopilot
            vehicle={vehicle}
            onVehicle={setVehicle}
            weather={weather}
            onWeather={setWeather}
            traffic={traffic}
            onTraffic={setTraffic}
            mode={mode}
            onMode={setMode}
            customerId={customerId}
            onCustomerId={setCustomerId}
            selectedRestaurant={selectedKitchen}
            onOptimize={handlePlaceOrder}
            loading={false}
            path={trackingOrder?.path ?? []}
            distanceRaw={trackingOrder?.distance ?? null}
          />
        </section>
      </main>
    </div>
  )
}
