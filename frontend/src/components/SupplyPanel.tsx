import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, Plus, Minus, X, ShoppingBag } from 'lucide-react'
import type { Restaurant } from '../types'
import { useCart } from '../context/CartContext'

type Props = {
  restaurants: Restaurant[]
  selectedId: string | null
  onSelect: (r: Restaurant | null) => void
}

export function SupplyPanel({ restaurants, selectedId, onSelect }: Props) {
  const { lines, addItem, removeLine, total } = useCart()
  const selected = restaurants.find(r => r.id === selectedId)

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-3xl relative">
      {/* Header */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <p className="text-[10px] uppercase tracking-[0.35em] text-frost-400 font-medium">Supply Nodes</p>
        <h2 className="mt-1 text-xl font-light text-white tracking-wide">
          {selected ? 'Menu Selection' : 'Available Kitchens'}
        </h2>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="w-full text-left group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex gap-4">
                    <img src={r.image} alt={r.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{r.name}</h3>
                      <p className="text-xs text-frost-300">{r.cuisine}</p>
                      <div className="mt-2 flex gap-3 text-[10px] text-white/50">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {r.rating}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Node {r.nodeId}</span>
                      </div>
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
              className="flex flex-col h-full"
            >
              <button
                onClick={() => onSelect(null)}
                className="mb-4 flex items-center gap-2 text-xs text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" /> Back to Kitchens
              </button>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white">{selected.name}</h3>
                <p className="text-xs text-frost-300">Node {selected.nodeId}</p>
              </div>

              <div className="space-y-2">
                {selected.menu.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div>
                      <h4 className="text-sm text-white">{m.name}</h4>
                      <p className="text-[10px] text-white/40">{m.desc}</p>
                      <p className="mt-1 text-xs text-white/70">${m.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => addItem(selected.id, m)}
                      className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dispatch Queue (Cart) */}
      <div className="p-6 border-t border-white/10 shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="h-4 w-4 text-white/50" />
          <h3 className="text-xs uppercase tracking-widest text-white/80">Dispatch Queue</h3>
        </div>
        
        {lines.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-2">Queue is empty</p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {lines.map((line) => (
              <div key={line.key} className="flex items-center justify-between text-xs">
                <span className="text-white/80 truncate pr-2">
                  {line.qty > 1 && <span className="text-frost-300 mr-1">{line.qty}x</span>}
                  {line.item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">${(line.item.price * line.qty).toFixed(2)}</span>
                  <button onClick={() => removeLine(line.key)} className="text-white/30 hover:text-white/80">
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-4">
          <span className="text-xs text-white/50">Total Value</span>
          <span className="text-sm font-medium text-white">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
