import { createContext, useContext, useState, useCallback, useMemo, type ReactNode, useEffect } from 'react'

export type OperatorRole = 'commander' | 'courier' | 'analyst' | 'customer'

export interface Operator {
  name: string
  email: string
  role: OperatorRole
  clearance: string
  badgeColor: 'gold' | 'amber' | 'cyan' | 'green'
}

interface UserContextValue {
  currentUser: Operator | null
  login: (email: string, password: string) => boolean
  register: (name: string, email: string, password: string, role: OperatorRole) => { success: boolean; error?: string }
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export const SEEDED_OPERATORS = [
  {
    name: 'Anaan',
    email: 'commander@frostroute.com',
    password: 'admin',
    role: 'commander' as const,
    clearance: 'Level 5 - Override',
    badgeColor: 'gold' as const
  },
  {
    name: 'Alex Mercer',
    email: 'courier@frostroute.com',
    password: 'field',
    role: 'courier' as const,
    clearance: 'Level 2 - Ground',
    badgeColor: 'amber' as const
  },
  {
    name: 'Dr. Sarah Stone',
    email: 'analyst@frostroute.com',
    password: 'stats',
    role: 'analyst' as const,
    clearance: 'Level 3 - Telemetry',
    badgeColor: 'cyan' as const
  },
  {
    name: 'Customer One',
    email: 'customer@frostroute.com',
    password: 'guest',
    role: 'customer' as const,
    clearance: 'Level 1 - Client',
    badgeColor: 'green' as const
  }
]

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Operator | null>(() => {
    const saved = localStorage.getItem('aura_operator')
    return saved ? JSON.parse(saved) : null
  })

  const [customOperators, setCustomOperators] = useState<any[]>(() => {
    const saved = localStorage.getItem('aura_registered_operators')
    return saved ? JSON.parse(saved) : []
  })

  // Sync custom operators back to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aura_registered_operators', JSON.stringify(customOperators))
  }, [customOperators])

  const login = useCallback((email: string, password: string): boolean => {
    // Check seeded operators first
    let match = SEEDED_OPERATORS.find(
      op => op.email.toLowerCase() === email.toLowerCase() && op.password === password
    )
    
    // If not found in seeded, check custom registered operators
    if (!match) {
      match = customOperators.find(
        op => op.email.toLowerCase() === email.toLowerCase() && op.password === password
      )
    }

    if (match) {
      const operatorData: Operator = {
        name: match.name,
        email: match.email,
        role: match.role,
        clearance: match.clearance,
        badgeColor: match.badgeColor
      }
      setCurrentUser(operatorData)
      localStorage.setItem('aura_operator', JSON.stringify(operatorData))
      return true
    }
    return false
  }, [customOperators])

  const register = useCallback((name: string, email: string, password: string, role: OperatorRole) => {
    const emailLower = email.toLowerCase()
    
    // Check if email already exists in seeded
    const existsSeeded = SEEDED_OPERATORS.some(op => op.email.toLowerCase() === emailLower)
    // Check if email exists in custom registered
    const existsCustom = customOperators.some(op => op.email.toLowerCase() === emailLower)

    if (existsSeeded || existsCustom) {
      return { success: false, error: 'Operator ID already registered in safety grid.' }
    }

    // Map clearance details based on role
    let clearance = 'Level 1 - Client'
    let badgeColor: 'gold' | 'amber' | 'cyan' | 'green' = 'green'

    if (role === 'commander') {
      clearance = 'Level 5 - Override'
      badgeColor = 'gold'
    } else if (role === 'courier') {
      clearance = 'Level 2 - Ground'
      badgeColor = 'amber'
    } else if (role === 'analyst') {
      clearance = 'Level 3 - Telemetry'
      badgeColor = 'cyan'
    } else if (role === 'customer') {
      clearance = 'Level 1 - Client'
      badgeColor = 'green'
    }

    const newOp = {
      name,
      email: emailLower,
      password,
      role,
      clearance,
      badgeColor
    }

    setCustomOperators(prev => [...prev, newOp])
    
    // Log them in immediately after register
    const operatorData: Operator = {
      name,
      email: emailLower,
      role,
      clearance,
      badgeColor
    }
    setCurrentUser(operatorData)
    localStorage.setItem('aura_operator', JSON.stringify(operatorData))

    return { success: true }
  }, [customOperators])

  const logout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem('aura_operator')
  }, [])

  const value = useMemo(
    () => ({ currentUser, login, register, logout }),
    [currentUser, login, register, logout]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}
