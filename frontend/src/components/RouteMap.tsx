import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { GraphEdge, GraphNode } from '../types'

type Props = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  visitOrder?: number[]
  path?: number[]
  pulseNode?: number | null
  agent?: { x: number; y: number } | null
  stepIndex: number
}

export function RouteMap({
  nodes,
  edges,
  visitOrder = [],
  path = [],
  pulseNode,
  agent,
  stepIndex,
}: Props) {
  const visited = useMemo(() => {
    const s = new Set<number>()
    for (let i = 0; i <= stepIndex && i < visitOrder.length; i++) s.add(visitOrder[i])
    return s
  }, [visitOrder, stepIndex])

  const pathSet = useMemo(() => {
    const pairs = new Set<string>()
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      const key = a < b ? `${a}-${b}` : `${b}-${a}`
      pairs.add(key)
    }
    return pairs
  }, [path])

  const done = visitOrder.length > 0 && stepIndex >= visitOrder.length - 1

  return (
    <div id="shortest-path-map" className="relative aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent shadow-[0_0_80px_rgba(0,0,0,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_65%)]" />
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
          </linearGradient>
        </defs>

        {edges.map((e, i) => {
          const a = nodes.find((n) => n.id === e.from)
          const b = nodes.find((n) => n.id === e.to)
          if (!a || !b) return null
          const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`
          const onPath = pathSet.has(key)
          const dim =
            visited.has(e.from) && visited.has(e.to) ? 0.35 : 0.08
          return (
            <motion.line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={onPath && done ? 'rgba(255,255,255,0.95)' : 'url(#edgeGrad)'}
              strokeWidth={onPath && done ? 0.55 : 0.35}
              filter={onPath && done ? 'url(#glow)' : undefined}
              initial={false}
              animate={{
                opacity: onPath && done ? 1 : dim,
              }}
              transition={{ duration: 0.5 }}
            />
          )
        })}

        {nodes.map((n) => {
          const isPulse = pulseNode === n.id
          const onVisit = visited.has(n.id)
          const onPath = path.includes(n.id)
          const r =
            n.type === 'hub' ? 2.8 : n.type === 'customer' ? 2.6 : n.type === 'courier' ? 2.2 : 2.4
          return (
            <g key={n.id}>
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={isPulse ? r * 1.12 : r}
                fill={
                  onPath && done
                    ? 'rgba(255,255,255,0.95)'
                    : onVisit
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(148,163,184,0.25)'
                }
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={0.35}
                animate={{
                  opacity: onVisit ? 1 : 0.55,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              />
              <text
                x={n.x}
                y={n.y + 4.2}
                textAnchor="middle"
                fill="rgba(11,18,32,0.92)"
                fontSize={2.4}
                fontWeight={600}
                style={{ pointerEvents: 'none' }}
              >
                {n.type === 'hub' ? 'H' : n.type === 'customer' ? '★' : n.type === 'courier' ? '◆' : '●'}
              </text>
            </g>
          )
        })}

        {agent && (
          <motion.circle
            cx={agent.x}
            cy={agent.y}
            r={2}
            fill="rgba(255,255,255,0.95)"
            filter="url(#glow)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}
      </svg>

      <AnimatePresence>
        {done && path.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/80 backdrop-blur-md"
          >
            Shortest path locked · Dijkstra complete
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Drive step-by-step Dijkstra visualization; `playToken` bumps to replay. */
export function useVisitPlayback(visitOrder: number[] | undefined, playToken: number) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!visitOrder?.length) {
      setStepIndex(0)
      return
    }
    setStepIndex(0)
    let i = 0
    const id = window.setInterval(() => {
      if (i >= visitOrder.length - 1) {
        setStepIndex(visitOrder.length - 1)
        window.clearInterval(id)
        return
      }
      i += 1
      setStepIndex(i)
    }, 420)
    return () => window.clearInterval(id)
  }, [visitOrder, playToken])

  return stepIndex
}
