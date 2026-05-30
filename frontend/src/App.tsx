import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeRoute, fetchGraphData } from './api/routeClient'
import { RouteControls } from './components/RouteControls'
import { RouteMap, useVisitPlayback } from './components/RouteMap'
import { SoundToggle } from './components/SoundToggle'
import { SupplyPanel } from './components/SupplyPanel'
import { Auth } from './components/Auth'
import { CourierDashboard } from './components/CourierDashboard'
import { CustomerDashboard } from './components/CustomerDashboard'
import { CartProvider } from './context/CartContext'
import { type Restaurant, type GraphNode, type GraphEdge, type VehicleType, type WeatherLevel } from './types'
import { pointOnPolyline } from './utils/pathAgent'
import { AuraCopilot } from './components/AuraCopilot'
import { ShoppingBag, Activity } from 'lucide-react'
import { UserProvider, useUser } from './context/UserContext'

function Main({ onLogout }: { onLogout: () => void }) {
  const { currentUser, logout } = useUser()
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [customerId, setCustomerId] = useState(9)
  
  // Matrix controls
  const [traffic, setTraffic] = useState(0.38)
  const [mode, setMode] = useState<'fastest' | 'least_traffic'>('fastest')
  const [vehicle, setVehicle] = useState<VehicleType>('hoverbike')
  const [weather, setWeather] = useState<WeatherLevel>('clear')

  const [activeRightTab, setActiveRightTab] = useState<'supply' | 'aura'>('supply')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routeVersion, setRouteVersion] = useState(0)
  const [visitOrder, setVisitOrder] = useState<number[]>([])
  const [path, setPath] = useState<number[]>([])
  const [distanceRaw, setDistanceRaw] = useState<number | null>(null)
  const [hoverNode, setHoverNode] = useState<number | null>(null)
  const [agentT, setAgentT] = useState(0)

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [graphLoaded, setGraphLoaded] = useState(false)

  const customers = useMemo(() => {
    return graphNodes
      .filter(n => n.type === 'customer')
      .map(n => ({ id: n.id, label: n.label }))
  }, [graphNodes])

  useEffect(() => {
    fetchGraphData()
      .then(data => {
        if (data.ok) {
          setGraphNodes(data.nodes)
          setGraphEdges(data.edges)
          setRestaurants(data.restaurants)
          setGraphLoaded(true)
        } else {
          setError(data.error || 'Failed to initialize graph data.')
        }
      })
      .catch(err => {
        setError(`Failed to connect to Command Center: ${err.message || err}`)
      })
  }, [])

  const stepIndex = useVisitPlayback(visitOrder, routeVersion)

  const runOptimize = useCallback(async () => {
    if (!selected) {
      setError('Select a supply node first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await computeRoute({
        source: selected.nodeId,
        target: customerId,
        trafficIntensity: traffic,
        mode,
        vehicleType: vehicle,
        weatherLevel: weather
      })
      if (!res.ok || res.path == null) {
        setError(res.error || 'Route failed')
        setVisitOrder([])
        setPath([])
        setDistanceRaw(null)
        return
      }
      setVisitOrder(res.visitOrder ?? [])
      setPath(res.path ?? [])
      setDistanceRaw(typeof res.distance === 'number' ? res.distance : null)
      setRouteVersion((v) => v + 1)
      setAgentT(0)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [selected, traffic, mode, customerId, vehicle, weather])

  const { etaMin, distanceKm } = useMemo(() => {
    if (distanceRaw == null) return { etaMin: null as number | null, distanceKm: null as number | null }
    const scale = 1000
    const cost = distanceRaw / scale
    const km = cost * 0.42
    // Basic ETA logic adapted for vehicle types conceptually
    let baseEta = Math.max(16, Math.round(12 + km * 4.2))
    if (vehicle === 'drone') baseEta = Math.round(baseEta * 0.6)
    if (vehicle === 'crawler') baseEta = Math.round(baseEta * 1.5)
    return { etaMin: baseEta, distanceKm: km }
  }, [distanceRaw, vehicle])

  useEffect(() => {
    if (path.length < 2) return
    let raf = 0
    const start = performance.now()
    const dur = vehicle === 'drone' ? 6000 : (vehicle === 'crawler' ? 18000 : 11000)
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setAgentT(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [path, routeVersion, vehicle])

  const agent = useMemo(
    () => (path.length >= 2 ? pointOnPolyline(path, graphNodes, agentT) : null),
    [path, agentT, graphNodes],
  )

  if (!graphLoaded) {
    return (
      <div className="grain relative h-screen w-screen flex flex-col items-center justify-center bg-frost-900 gap-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 max-w-md text-center px-6">
            <div className="text-red-400 font-mono text-xs uppercase tracking-widest border border-red-500/30 bg-red-500/10 px-4 py-2 rounded-xl">
              Connection Failure
            </div>
            <div className="text-white/70 text-xs tracking-wide leading-relaxed">
              {error}
            </div>
            <div className="text-white/30 text-[10px] uppercase tracking-wider mt-2">
              Please check that your backend service on Render is running and your VITE_API_URL environment variable is configured in Vercel.
            </div>
          </div>
        ) : (
          <div className="text-white/50 animate-pulse text-sm tracking-widest uppercase">Initializing Command Center...</div>
        )}
      </div>
    )
  }

  return (
    <div className="grain relative h-screen w-screen overflow-hidden flex flex-col bg-frost-900">
      <header className="shrink-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 glass rounded-none border-t-0 border-x-0">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.08)] flex items-center justify-center">
             <div className="w-4 h-4 bg-white/80 rounded-sm animate-pulse" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/45">FrostRoute</p>
            <p className="text-sm font-medium text-white/80">Command Deck</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-xs text-white/60">
              <div className={`h-1.5 w-1.5 rounded-full ${
                currentUser.badgeColor === 'gold' 
                  ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]' 
                  : currentUser.badgeColor === 'amber'
                    ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]'
              }`} />
              <span className="font-mono text-[9px] text-white/40">OPERATOR:</span>
              <span className="font-semibold text-white/80 font-mono tracking-wide uppercase text-[10px]">{currentUser.name}</span>
              <span className="text-white/20 select-none">|</span>
              <button
                onClick={() => {
                  logout()
                  onLogout()
                }}
                className="text-[9px] uppercase tracking-wider text-red-400 hover:text-red-300 font-bold font-mono transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <SoundToggle />
        </div>
      </header>

      <main className="flex-1 min-h-0 flex overflow-hidden p-4 gap-4">
        {/* Left Panel */}
        <section className="w-80 shrink-0 flex flex-col h-full z-10">
          <RouteControls
            traffic={traffic}
            onTraffic={setTraffic}
            mode={mode}
            onMode={setMode}
            vehicle={vehicle}
            onVehicle={setVehicle}
            weather={weather}
            onWeather={setWeather}
            onOptimize={runOptimize}
            loading={loading}
            etaMin={etaMin}
            distanceKm={distanceKm}
            customerId={customerId}
            onCustomerId={setCustomerId}
            customers={customers}
          />
        </section>

        {/* Center Panel (Map) */}
        <section className="flex-1 relative rounded-3xl overflow-hidden glass z-0">
          <div className="absolute inset-0 z-0">
            <RouteMap
              nodes={graphNodes}
              edges={graphEdges}
              visitOrder={visitOrder}
              path={path}
              pulseNode={hoverNode}
              agent={agent}
              stepIndex={stepIndex}
            />
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-wrap justify-center gap-2 px-4 py-3 glass rounded-2xl border border-white/10 max-w-[90%]">
            {graphNodes.map((n) => (
              <motion.button
                key={n.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setHoverNode(n.id)}
                onMouseLeave={() => setHoverNode(null)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/60 transition hover:border-white/30 hover:text-white"
              >
                {n.label}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Right Panel */}
        <section className="w-96 shrink-0 flex flex-col h-full z-10 gap-3">
          {/* Tab Selector */}
          <div className="shrink-0 flex items-center justify-between p-1 glass rounded-2xl border border-white/10 bg-white/[0.02]">
            <button
              onClick={() => setActiveRightTab('supply')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-medium uppercase tracking-wider rounded-xl transition cursor-pointer ${
                activeRightTab === 'supply'
                  ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Supply Hub
            </button>
            <button
              onClick={() => setActiveRightTab('aura')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-medium uppercase tracking-wider rounded-xl relative transition cursor-pointer ${
                activeRightTab === 'aura'
                  ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              A.U.R.A. TAC-AI
              <span className="absolute right-3.5 top-3.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {activeRightTab === 'supply' ? (
                <motion.div
                  key="supply"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <SupplyPanel
                    restaurants={restaurants}
                    selectedId={selected?.id ?? null}
                    onSelect={setSelected}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="aura"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
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
                    selectedRestaurant={selected}
                    onOptimize={runOptimize}
                    loading={loading}
                    path={path}
                    distanceRaw={distanceRaw}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  )
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { currentUser } = useUser()

  useEffect(() => {
    // Sync login state based on UserContext's active user
    if (currentUser) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [currentUser])

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />
  }

  if (currentUser?.role === 'courier') {
    return <CourierDashboard onLogout={() => setIsAuthenticated(false)} />
  }

  if (currentUser?.role === 'customer') {
    return <CustomerDashboard onLogout={() => setIsAuthenticated(false)} />
  }

  return (
    <CartProvider>
      <Main onLogout={() => setIsAuthenticated(false)} />
    </CartProvider>
  )
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}
