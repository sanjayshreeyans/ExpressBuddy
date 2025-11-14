import React, { createContext, useContext, useEffect, useState } from 'react'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { supabaseService } from '../services/supabaseService'
import type { Child } from '../services/supabaseService'

interface UserContextType {
  child: Child | null
  loading: boolean
  isFirstTimeUser: boolean
  createChildProfile: (name: string, age: number) => Promise<Child | null>
  refreshChild: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: React.ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading: kindeLoading } = useKindeAuth()
  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)

  const refreshChild = async () => {
    if (user?.id) {
      try {
        const childData = await supabaseService.getChildByKindeUserId(user.id)
        setChild(childData)
        
        // If user is authenticated but no child record exists, they're a first-time user
        if (!childData && isAuthenticated) {
          setIsFirstTimeUser(true)
        } else {
          setIsFirstTimeUser(false)
        }
      } catch (error) {
        console.error('Error fetching child:', error)
      }
    }
  }

  const createChildProfile = async (name: string, age: number): Promise<Child | null> => {
    if (!user?.id) {
      console.error('No user ID available')
      return null
    }

    try {
      const newChild = await supabaseService.createChild(user.id, name, age)
      if (newChild) {
        setChild(newChild)
        setIsFirstTimeUser(false)
        
        // Create initial progress record for emotion detective
        await supabaseService.createEmotionDetectiveProgress(newChild.id)
      }
      return newChild
    } catch (error) {
      console.error('Error creating child profile:', error)
      return null
    }
  }

  useEffect(() => {
    const initializeUser = async () => {
      if (!kindeLoading) {
        if (isAuthenticated && user?.id) {
          await refreshChild()
        } else {
          setChild(null)
          setIsFirstTimeUser(false)
        }
        setLoading(false)
      }
    }

    initializeUser()
  }, [isAuthenticated, user?.id, kindeLoading])

  const value: UserContextType = {
    child,
    loading: loading || kindeLoading,
    isFirstTimeUser,
    createChildProfile,
    refreshChild,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
