import type { GraphEdge, GraphNode, Restaurant, VehicleType, WeatherLevel } from '../types'

export interface RouteRequestBody {
  source: number
  target: number
  trafficIntensity: number
  mode: 'fastest' | 'least_traffic'
  vehicleType: VehicleType
  weatherLevel: WeatherLevel
}

export interface RouteResponse {
  ok: boolean
  source?: number
  target?: number
  distance: number | null
  path?: number[]
  visitOrder?: number[]
  distances?: (number | null)[]
  error?: string
  meta?: { trafficIntensity: number; mode: string; scale: number }
}

export interface GraphDataResponse {
  ok: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
  restaurants: Restaurant[]
  nodeCount: number
  error?: string
}

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function fetchGraphData(): Promise<GraphDataResponse> {
  const res = await fetch(`${API_BASE}/api/graph`)
  const data = await res.json()
  return data
}

export async function computeRoute(body: RouteRequestBody): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: RouteResponse = { ok: false, distance: null }
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { ok: false, distance: null, error: `Invalid JSON (Status ${res.status}): ${text.slice(0, 100)}` }
  }

  if (!res.ok && !data.ok) {
    return { ok: false, distance: null, error: data.error || `HTTP ${res.status}` }
  }
  return data
}

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  customer: string
  targetNode: number
  restaurant: string
  restaurantNode: number
  items: OrderItem[]
  total: number
  path: number[]
  visitOrder?: number[]
  distance: number | null
  vehicle: VehicleType
  weather: WeatherLevel
  status: 'pending' | 'in_transit' | 'delivered'
  timestamp: string
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/orders`)
  const data = await res.json()
  return data.orders || []
}

export async function createOrder(orderData: Partial<Order>): Promise<{ ok: boolean; order?: Order; error?: string }> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
  const data = await res.json()
  return data
}

export async function updateOrderStatus(id: string, status: 'pending' | 'in_transit' | 'delivered'): Promise<{ ok: boolean; order?: Order; error?: string }> {
  const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json()
  return data
}
