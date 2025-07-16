import { supabase } from '../lib/supabase'

// Types for your database tables
export interface Child {
  id: string
  kinde_user_id: string
  name: string
  age: number
  created_at: string
}

export interface Lesson {
  id: string
  title: string
  type: string
  level: number
  system_prompt: string
  content: any
  xp: number
}

export interface Progress {
  id: string
  child_id: string
  lesson_id: string
  completed: boolean
  xp_earned: number
  created_at: string
}

export interface AIChat {
  id: string
  child_id: string
  lesson_id: string
  message: any
  created_at: string
}

export interface DailyStreak {
  id: string
  child_id: string
  activity_date: string
  lessons_done: number
  xp_earned: number
  created_at: string
}

// Service class for database operations
export class SupabaseService {
  // Children operations
  async getChildByKindeUserId(kindeUserId: string): Promise<Child | null> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('kinde_user_id', kindeUserId)
        .single()

      if (error) {
        console.error('Error fetching child:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in getChildByKindeUserId:', err)
      return null
    }
  }

  async createChild(kindeUserId: string, name: string, age: number): Promise<Child | null> {
    try {
      const { data, error } = await supabase
        .from('children')
        .insert({ kinde_user_id: kindeUserId, name, age })
        .select()
        .single()

      if (error) {
        console.error('Error creating child:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in createChild:', err)
      return null
    }
  }

  // Lessons operations
  async getAllLessons(): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('level', { ascending: true })

      if (error) {
        console.error('Error fetching lessons:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getAllLessons:', err)
      return []
    }
  }

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) {
        console.error('Error fetching lesson:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in getLessonById:', err)
      return null
    }
  }

  async getLessonsByType(type: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('type', type)
        .order('level', { ascending: true })

      if (error) {
        console.error('Error fetching lessons by type:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getLessonsByType:', err)
      return []
    }
  }

  // Progress operations
  async getChildProgress(childId: string): Promise<Progress[]> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*, lessons(*)')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching progress:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getChildProgress:', err)
      return []
    }
  }

  async updateProgress(childId: string, lessonId: string, completed: boolean, xpEarned: number): Promise<Progress | null> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert({ 
          child_id: childId, 
          lesson_id: lessonId, 
          completed, 
          xp_earned: xpEarned 
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in updateProgress:', err)
      return null
    }
  }

  // AI Chat operations
  async saveAIChat(childId: string, lessonId: string, message: any): Promise<AIChat | null> {
    try {
      const { data, error } = await supabase
        .from('ai_chat')
        .insert({ child_id: childId, lesson_id: lessonId, message })
        .select()
        .single()

      if (error) {
        console.error('Error saving AI chat:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in saveAIChat:', err)
      return null
    }
  }

  async getAIChatHistory(childId: string, lessonId?: string): Promise<AIChat[]> {
    try {
      let query = supabase
        .from('ai_chat')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: true })

      if (lessonId) {
        query = query.eq('lesson_id', lessonId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching AI chat history:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getAIChatHistory:', err)
      return []
    }
  }

  // Daily Streaks operations
  async updateDailyStreak(childId: string, lessonsDone: number, xpEarned: number): Promise<DailyStreak | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('daily_streaks')
        .upsert({ 
          child_id: childId, 
          activity_date: today, 
          lessons_done: lessonsDone,
          xp_earned: xpEarned 
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating daily streak:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in updateDailyStreak:', err)
      return null
    }
  }

  async getDailyStreaks(childId: string, days: number = 7): Promise<DailyStreak[]> {
    try {
      const { data, error } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('child_id', childId)
        .order('activity_date', { ascending: false })
        .limit(days)

      if (error) {
        console.error('Error fetching daily streaks:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getDailyStreaks:', err)
      return []
    }
  }

  // Real-time subscriptions
  subscribeToProgress(childId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`progress-${childId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'progress', filter: `child_id=eq.${childId}` }, 
        callback
      )
      .subscribe()
  }

  subscribeToAIChat(childId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`ai-chat-${childId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_chat', filter: `child_id=eq.${childId}` }, 
        callback
      )
      .subscribe()
  }

  unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()
export default supabaseService
