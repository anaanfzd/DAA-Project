import { motion } from 'framer-motion'
import { Route, Zap, CloudLightning, Wind, Sun, Truck, Plane } from 'lucide-react'
import { FrostButton } from './ui/FrostButton'
import type { VehicleType, WeatherLevel } from '../types'

type Mode = 'fastest' | 'least_traffic'

type Props = {
  traffic: number
  onTraffic: (v: number) => void
  mode: Mode
  onMode: (m: Mode) => void
  vehicle: VehicleType
  onVehicle: (v: VehicleType) => void
  weather: WeatherLevel
  onWeather: (w: WeatherLevel) => void
  onOptimize: () => void
  loading: boolean
  etaMin?: number | null
  distanceKm?: number | null
  customerId: number
  onCustomerId: (id: number) => void
  customers?: { id: number; label: string }[]
}

export function RouteControls({
  traffic, onTraffic, mode, onMode, vehicle, onVehicle, weather, onWeather,
  onOptimize, loading, etaMin, distanceKm, customerId, onCustomerId, customers
}: Props) {
  return (
    <div className="glass flex h-full flex-col overflow-y-auto rounded-3xl p-6 relative">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.04] blur-3xl" />
      
      <div className="mb-6 border-b border-white/10 pb-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-frost-400 font-medium">Parameters</p>
        <h2 className="mt-1 text-xl font-light text-white tracking-wide">Route Matrix</h2>
      </div>

      <div className="space-y-6 flex-1">
        {/* Fleet Selection */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/40 mb-3">Autonomous Fleet</p>
          <div className="grid grid-cols-1 gap-2">
            <ToggleChip active={vehicle === 'hoverbike'} icon={<Zap className="h-4 w-4" />} label="Hoverbike (Standard)" onClick={() => onVehicle('hoverbike')} />
            <ToggleChip active={vehicle === 'crawler'} icon={<Truck className="h-4 w-4" />} label="Ice Crawler (All-Terrain)" onClick={() => onVehicle('crawler')} />
            <ToggleChip active={vehicle === 'drone'} icon={<Plane className="h-4 w-4" />} label="Delivery Drone (Aerial)" onClick={() => onVehicle('drone')} />
          </div>
        </div>

        {/* Environmental Hazards */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/40 mb-3">Environmental Hazard</p>
          <div className="flex flex-wrap gap-2">
            <ToggleChip active={weather === 'clear'} icon={<Sun className="h-4 w-4" />} label="Clear" onClick={() => onWeather('clear')} />
            <ToggleChip active={weather === 'snow'} icon={<Wind className="h-4 w-4" />} label="Snow" onClick={() => onWeather('snow')} />
            <ToggleChip active={weather === 'blizzard'} icon={<CloudLightning className="h-4 w-4" />} label="Blizzard" onClick={() => onWeather('blizzard')} />
          </div>
        </div>

        {/* Traffic Field */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Traffic Density</p>
            <span className="text-[10px] text-white/50">{(traffic * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={traffic}
            onChange={(e) => onTraffic(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
          />
        </div>

        {/* Delivery Location */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/40 mb-3">Target Node</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin">
            {(customers && customers.length > 0
              ? customers
              : [ { id: 9, label: 'Home' }, { id: 11, label: 'Work' }, { id: 12, label: 'Gym' } ]
            ).map((loc) => (
              <button
                key={loc.id}
                onClick={() => onCustomerId(loc.id)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide transition cursor-pointer ${
                  customerId === loc.id
                    ? 'border-white/40 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                    : 'border-white/10 bg-transparent text-white/50 hover:border-white/25 hover:text-white/80'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/40 mb-3">Routing Strategy</p>
          <div className="flex flex-wrap gap-2">
            <ToggleChip active={mode === 'fastest'} icon={<Zap className="h-4 w-4" />} label="Fastest" onClick={() => onMode('fastest')} />
            <ToggleChip active={mode === 'least_traffic'} icon={<Route className="h-4 w-4" />} label="Least Traffic" onClick={() => onMode('least_traffic')} />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/35">ETA</p>
            <p className="mt-0.5 text-base text-white/90">
              {etaMin != null ? `${etaMin} min` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/35">Distance</p>
            <p className="mt-0.5 text-base text-white/90">
              {distanceKm != null ? `${distanceKm.toFixed(2)} km` : '—'}
            </p>
          </div>
        </div>
        <FrostButton
          type="button"
          className="w-full justify-center py-3 text-sm shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          onClick={onOptimize}
          disabled={loading}
        >
          {loading ? 'Computing Route...' : 'Dispatch Engine'}
        </FrostButton>
      </div>
    </div>
  )
}

function ToggleChip({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium tracking-wide transition ${
        active
          ? 'border-white/40 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
          : 'border-white/10 bg-transparent text-white/50 hover:border-white/25 hover:text-white/80'
      }`}
    >
      {icon}
      {label}
    </motion.button>
  )
}
