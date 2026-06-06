import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, memo } from 'react'
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

// ── Memoized Background Edges Component ──
const BackgroundLines = memo(({
  edges,
  nodes,
  pathEdgeSet,
  hasPath,
}: {
  edges: GraphEdge[]
  nodes: GraphNode[]
  pathEdgeSet: Set<string>
  hasPath: boolean
}) => {
  return (
    <>
      {edges.map((e, i) => {
        const a = nodes.find(n => n.id === e.from)
        const b = nodes.find(n => n.id === e.to)
        if (!a || !b) return null
        const key = e.from < e.to ? `${e.from}-${e.to}` : `${e.to}-${e.from}`
        const onPath = pathEdgeSet.has(key)

        // Dim all non-path edges when a route exists
        const opacity = hasPath ? (onPath ? 0 : 0.06) : 0.12

        return (
          <line
            key={`bg-${i}`}
            x1={a.x} y1={a.y}
            x2={b.x} y2={b.y}
            stroke="rgba(255,255,255,1)"
            strokeWidth={0.3}
            opacity={opacity}
          />
        )
      })}
    </>
  )
})

BackgroundLines.displayName = 'BackgroundLines'

// ── Memoized Node Component ──
const MapNode = memo(({
  node,
  isPulse,
  onPath,
  isSource,
  isTarget,
  onVisit,
  hasPath,
}: {
  node: GraphNode
  isPulse: boolean
  onPath: boolean
  isSource: boolean
  isTarget: boolean
  onVisit: boolean
  hasPath: boolean
}) => {
  const r = node.type === 'hub' ? 2.8 : node.type === 'customer' ? 2.6 : node.type === 'courier' ? 2.2 : 2.4

  // Color logic
  const fill = isSource
    ? 'rgba(52,211,153,0.95)'   // emerald — start
    : isTarget
      ? 'rgba(251,191,36,0.95)'  // amber — destination
      : onPath
        ? 'rgba(255,255,255,0.95)' // white — on path
        : onVisit
          ? 'rgba(100,200,255,0.5)' // cyan — visited
          : 'rgba(148,163,184,0.2)'  // dim — unvisited

  const stroke = isSource
    ? 'rgba(52,211,153,0.6)'
    : isTarget
      ? 'rgba(251,191,36,0.6)'
      : onPath
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(255,255,255,0.12)'

  return (
    <g>
      {/* Pulse ring for source/target/pulseNode */}
      {(isPulse || isSource || isTarget) && (
        <motion.circle
          cx={node.x} cy={node.y}
          r={r * 2.2}
          fill="none"
          stroke={isSource ? 'rgba(52,211,153,0.25)' : isTarget ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.15)'}
          strokeWidth={0.4}
          animate={{ r: [r * 1.8, r * 2.8, r * 1.8], opacity: [0.4, 0.1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}

      {/* Node circle */}
      <motion.circle
        cx={node.x} cy={node.y}
        r={isPulse ? r * 1.15 : r}
        fill={fill}
        stroke={stroke}
        strokeWidth={onPath ? 0.5 : 0.3}
        filter={onPath ? 'url(#nodeglow)' : undefined}
        animate={{ opacity: hasPath ? (onPath ? 1 : 0.3) : (onVisit ? 1 : 0.5) }}
        transition={{ duration: 0.3 }}
      />

      {/* Node label */}
      <text
        x={node.x}
        y={node.y - r - 1.2}
        textAnchor="middle"
        fill={onPath ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'}
        fontSize={2.2}
        fontWeight={onPath ? 700 : 400}
        fontFamily="monospace"
        style={{ pointerEvents: 'none' }}
      >
        {node.label || `N${node.id}`}
      </text>

      {/* Node ID badge */}
      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        fill={isSource ? 'rgba(6,30,20,0.95)' : isTarget ? 'rgba(40,20,0,0.95)' : 'rgba(11,18,32,0.85)'}
        fontSize={1.8}
        fontWeight={700}
        fontFamily="monospace"
        style={{ pointerEvents: 'none' }}
      >
        {node.id}
      </text>
    </g>
  )
})

MapNode.displayName = 'MapNode'

export function RouteMap({
  nodes,
  edges,
  visitOrder = [],
  path = [],
  pulseNode,
  agent,
  stepIndex,
}: Props) {
  const hasPath = path.length > 1

  // Set of node IDs on the final shortest path
  const pathNodeSet = useMemo(() => new Set<number>(path), [path])

  // Set of edge keys on the final shortest path
  const pathEdgeSet = useMemo(() => {
    const pairs = new Set<string>()
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]
      const b = path[i + 1]
      pairs.add(a < b ? `${a}-${b}` : `${b}-${a}`)
    }
    return pairs
  }, [path])

  // Visited set during Dijkstra playback animation
  const visited = useMemo(() => {
    const s = new Set<number>()
    for (let i = 0; i <= stepIndex && i < visitOrder.length; i++) s.add(visitOrder[i])
    return s
  }, [visitOrder, stepIndex])

  const done = visitOrder.length === 0 || stepIndex >= visitOrder.length - 1

  return (
    <div id="shortest-path-map" className="relative w-full h-full overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:8%_8%]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_70%)]" />

      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="nodeglow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(255,255,255,0.9)" />
          </marker>
        </defs>

        {/* ── Memoized background edges ── */}
        <BackgroundLines
          edges={edges}
          nodes={nodes}
          pathEdgeSet={pathEdgeSet}
          hasPath={hasPath}
        />

        {/* ── Dijkstra exploration animation edges ── */}
        {visitOrder.length > 0 && !done && edges.map((e, i) => {
          const a = nodes.find(n => n.id === e.from)
          const b = nodes.find(n => n.id === e.to)
          if (!a || !b) return null
          const bothVisited = visited.has(e.from) && visited.has(e.to)
          if (!bothVisited) return null
          return (
            <motion.line
              key={`visit-${i}`}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke="rgba(100,200,255,0.4)"
              strokeWidth={0.35}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          )
        })}

        {/* ── Highlighted shortest path edges ── */}
        {hasPath && path.map((nodeId, i) => {
          if (i === path.length - 1) return null
          const a = nodes.find(n => n.id === nodeId)
          const b = nodes.find(n => n.id === path[i + 1])
          if (!a || !b) return null
          return (
            <motion.line
              key={`path-${i}`}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={0.7}
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
            />
          )
        })}

        {/* ── Memoized Nodes ── */}
        {nodes.map(n => {
          const isPulse = pulseNode === n.id
          const onPath = pathNodeSet.has(n.id)
          const isSource = path[0] === n.id
          const isTarget = path[path.length - 1] === n.id
          const onVisit = visited.has(n.id)

          return (
            <MapNode
              key={n.id}
              node={n}
              isPulse={isPulse}
              onPath={onPath}
              isSource={isSource}
              isTarget={isTarget}
              onVisit={onVisit}
              hasPath={hasPath}
            />
          )
        })}

        {/* ── Moving delivery agent ── */}
        {agent && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.circle
              cx={agent.x} cy={agent.y} r={2.5}
              fill="rgba(255,255,255,0.95)"
              filter="url(#glow)"
              animate={{ r: [2.2, 2.8, 2.2] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
            />
            <circle
              cx={agent.x} cy={agent.y} r={4}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={0.4}
            />
          </motion.g>
        )}
      </svg>

      {/* ── Route info overlay ── */}
      <AnimatePresence>
        {hasPath && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 text-[10px] text-white/80 backdrop-blur-md font-mono space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider">Dijkstra Path Locked</span>
            </div>
            <div className="text-white/50">
              {path.join(' → ')}
            </div>
            <div className="flex gap-3 text-[9px] text-white/40">
              <span>🟢 Start: Node {path[0]}</span>
              <span>🟡 End: Node {path[path.length - 1]}</span>
              <span>{path.length - 1} hops</span>
            </div>
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
    // Faster interval — 120ms per step instead of 420ms
    const id = window.setInterval(() => {
      if (i >= visitOrder.length - 1) {
        setStepIndex(visitOrder.length - 1)
        window.clearInterval(id)
        return
      }
      i += 1
      setStepIndex(i)
    }, 120)
    return () => window.clearInterval(id)
  }, [visitOrder, playToken])

  return stepIndex
}
