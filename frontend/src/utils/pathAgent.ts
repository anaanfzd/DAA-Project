import type { GraphNode } from '../types'

export function pointOnPolyline(
  path: number[],
  nodes: GraphNode[],
  t: number,
): { x: number; y: number } | null {
  if (path.length < 2 || t <= 0) {
    const n = nodes.find((x) => x.id === path[0])
    return n ? { x: n.x, y: n.y } : null
  }
  if (t >= 1) {
    const n = nodes.find((x) => x.id === path[path.length - 1])
    return n ? { x: n.x, y: n.y } : null
  }

  const pts = path.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as GraphNode[]
  if (pts.length < 2) return null

  let total = 0
  const segLens: number[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x
    const dy = pts[i + 1].y - pts[i].y
    const L = Math.hypot(dx, dy)
    segLens.push(L)
    total += L
  }
  if (total <= 0) return { x: pts[0].x, y: pts[0].y }

  let d = t * total
  for (let i = 0; i < segLens.length; i++) {
    if (d <= segLens[i]) {
      const a = segLens[i] === 0 ? 0 : d / segLens[i]
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * a,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * a,
      }
    }
    d -= segLens[i]
  }
  return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y }
}
