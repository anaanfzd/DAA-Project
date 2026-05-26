import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { MenuItem } from '../types'

export interface CartLine {
  key: string
  item: MenuItem
  restaurantId: string
  qty: number
}

interface CartContextValue {
  lines: CartLine[]
  addItem: (restaurantId: string, item: MenuItem) => void
  removeLine: (key: string) => void
  clear: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const addItem = useCallback((restaurantId: string, item: MenuItem) => {
    const key = `${restaurantId}:${item.id}`
    setLines((prev) => {
      const i = prev.findIndex((l) => l.key === key)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: next[i].qty + 1 }
        return next
      }
      return [...prev, { key, item, restaurantId, qty: 1 }]
    })
  }, [])

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const { total, count } = useMemo(() => {
    let t = 0
    let c = 0
    for (const l of lines) {
      t += l.item.price * l.qty
      c += l.qty
    }
    return { total: t, count: c }
  }, [lines])

  const value = useMemo(
    () => ({ lines, addItem, removeLine, clear, total, count }),
    [lines, addItem, removeLine, clear, total, count],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart outside CartProvider')
  return ctx
}
