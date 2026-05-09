import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email?: string
  name?: string
}

// Simple authentication functions
export async function signInAnonymously(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    
    return {
      id: data.user?.id || 'anonymous',
      email: data.user?.email
    }
  } catch (error) {
    console.error('Error signing in anonymously:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }
    
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email
      }
    }
    
    // If no session, try to get user directly
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    
    if (user) {
      return {
        id: user.id,
        email: user.email
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session !== null
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

// Get session for API calls
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
} 