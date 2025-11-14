import { useState, useEffect, useCallback } from 'react'
import { supabaseService, type Child, type Lesson, type Progress, type AIChat, type DailyStreak } from '../services/supabaseService'

// Hook for managing child data
export const useChild = (kindeUserId: string) => {
  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChild = useCallback(async () => {
    if (!kindeUserId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const childData = await supabaseService.getChildByKindeUserId(kindeUserId)
      setChild(childData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch child')
    } finally {
      setLoading(false)
    }
  }, [kindeUserId])

  const createChild = useCallback(async (name: string, age: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const childData = await supabaseService.createChild(kindeUserId, name, age)
      setChild(childData)
      return childData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create child')
      return null
    } finally {
      setLoading(false)
    }
  }, [kindeUserId])

  useEffect(() => {
    fetchChild()
  }, [fetchChild])

  return { child, loading, error, createChild, refetchChild: fetchChild }
}

// Hook for managing lessons
export const useLessons = (type?: string) => {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const lessonsData = type 
        ? await supabaseService.getLessonsByType(type)
        : await supabaseService.getAllLessons()
      setLessons(lessonsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  return { lessons, loading, error, refetchLessons: fetchLessons }
}

// Hook for managing child progress
export const useProgress = (childId: string) => {
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!childId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const progressData = await supabaseService.getChildProgress(childId)
      setProgress(progressData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress')
    } finally {
      setLoading(false)
    }
  }, [childId])

  const updateProgress = useCallback(async (lessonId: string, completed: boolean, xpEarned: number) => {
    if (!childId) return null
    
    try {
      const updatedProgress = await supabaseService.updateProgress(childId, lessonId, completed, xpEarned)
      if (updatedProgress) {
        await fetchProgress() // Refresh progress data
      }
      return updatedProgress
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress')
      return null
    }
  }, [childId, fetchProgress])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { progress, loading, error, updateProgress, refetchProgress: fetchProgress }
}

// Hook for managing AI chat
export const useAIChat = (childId: string, lessonId?: string) => {
  const [chatHistory, setChatHistory] = useState<AIChat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChatHistory = useCallback(async () => {
    if (!childId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const chatData = await supabaseService.getAIChatHistory(childId, lessonId)
      setChatHistory(chatData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat history')
    } finally {
      setLoading(false)
    }
  }, [childId, lessonId])

  const saveMessage = useCallback(async (message: any, lessonId: string) => {
    if (!childId) return null
    
    try {
      const savedMessage = await supabaseService.saveAIChat(childId, lessonId, message)
      if (savedMessage) {
        await fetchChatHistory() // Refresh chat history
      }
      return savedMessage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message')
      return null
    }
  }, [childId, fetchChatHistory])

  useEffect(() => {
    fetchChatHistory()
  }, [fetchChatHistory])

  return { chatHistory, loading, error, saveMessage, refetchChatHistory: fetchChatHistory }
}

// Hook for managing daily streaks
export const useDailyStreaks = (childId: string, days: number = 7) => {
  const [streaks, setStreaks] = useState<DailyStreak[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStreaks = useCallback(async () => {
    if (!childId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const streaksData = await supabaseService.getDailyStreaks(childId, days)
      setStreaks(streaksData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch streaks')
    } finally {
      setLoading(false)
    }
  }, [childId, days])

  const updateStreak = useCallback(async (lessonsDone: number, xpEarned: number) => {
    if (!childId) return null
    
    try {
      const updatedStreak = await supabaseService.updateDailyStreak(childId, lessonsDone, xpEarned)
      if (updatedStreak) {
        await fetchStreaks() // Refresh streaks data
      }
      return updatedStreak
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streak')
      return null
    }
  }, [childId, fetchStreaks])

  useEffect(() => {
    fetchStreaks()
  }, [fetchStreaks])

  return { streaks, loading, error, updateStreak, refetchStreaks: fetchStreaks }
}

// Hook for real-time subscriptions
export const useRealTimeSubscription = (childId: string, type: 'progress' | 'ai_chat') => {
  const [subscription, setSubscription] = useState<any>(null)

  const subscribe = useCallback((callback: (payload: any) => void) => {
    if (!childId) return

    const channel = type === 'progress' 
      ? supabaseService.subscribeToProgress(childId, callback)
      : supabaseService.subscribeToAIChat(childId, callback)
    
    setSubscription(channel)
    return channel
  }, [childId, type])

  const unsubscribe = useCallback(() => {
    if (subscription) {
      supabaseService.unsubscribe(subscription)
      setSubscription(null)
    }
  }, [subscription])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return { subscribe, unsubscribe }
}
