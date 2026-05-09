'use client'

import React, { createContext, useContext, useState } from 'react'

interface User {
  id: string
  email?: string
  name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({ id: 'demo-user', email: 'demo@example.com' })
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    // No-op - user is already set
    setLoading(false)
  }

  const logout = async () => {
    // No-op - keep demo user
    setLoading(false)
  }

  const value = {
    user,
    loading,
    signIn,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 