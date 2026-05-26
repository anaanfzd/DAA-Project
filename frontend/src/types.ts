export type NodeType = 'hub' | 'restaurant' | 'customer' | 'courier' | 'junction'
export type VehicleType = 'hoverbike' | 'crawler' | 'drone'
export type WeatherLevel = 'clear' | 'snow' | 'blizzard'

export interface GraphNode {
  id: number
  label: string
  type: NodeType
  x: number
  y: number
}

export interface GraphEdge {
  from: number
  to: number
  distance: number
  traffic: number
}

export interface MenuItem {
  id: string
  name: string
  price: number
  desc: string
  badge?: string
}

export interface Restaurant {
  id: string
  nodeId: number
  name: string
  cuisine: string
  rating: number
  eta: string
  image: string
  menu: MenuItem[]
}
