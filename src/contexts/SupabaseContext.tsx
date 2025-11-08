import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { supabaseService } from '../services/supabaseService'
import type { Child } from '../services/supabaseService'

interface SupabaseContextType {
  session: Session | null
  user: User | null
  child: Child | null
  loading: boolean
  signOut: () => Promise<void>
  refreshChild: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshChild = async () => {
    if (user) {
      const childData = await supabaseService.getChildByUserId(user.id)
      setChild(childData)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setChild(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Try to get child data when user signs in
          const childData = await supabaseService.getChildByUserId(session.user.id)
          setChild(childData)
        } else {
          setChild(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch child data when user changes
  useEffect(() => {
    if (user && !child) {
      refreshChild()
    }
  }, [user, child])

  const value: SupabaseContextType = {
    session,
    user,
    child,
    loading,
    signOut,
    refreshChild,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export default SupabaseProvider