import { supabase } from '../lib/supabase'

// Types for your database tables
export interface Child {
  id: string
  user_id: string
  name: string
  age: number
  created_at: string
}

// Emotion Detective specific types
export interface EmotionDetectiveProgress {
  id: string
  child_id: string
  level: number
  total_xp: number
  completed_sessions: number
  current_streak: number
  best_streak: number
  unlocked_emotions: string[]
  created_at: string
  updated_at: string
}

export interface EmotionDetectiveSession {
  id: string
  child_id: string
  level: number
  emotions_presented: string[]
  total_attempts: number
  correct_identifications: number
  successful_mirrors: number
  xp_earned: number
  duration_seconds?: number
  completed_at?: string
  created_at: string
}

export interface EmotionAttempt {
  id: string
  session_id: string
  emotion_name: string
  identification_attempts: number
  identification_correct: boolean
  mirroring_attempts: number
  mirroring_score?: number
  time_spent_seconds: number
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

// Additional interfaces for business logic
export interface EmotionSession {
  id: string
  child_id: string
  lesson_id: string
  emotion: string
  attempts: number
  completed: boolean
  xp_earned: number
  created_at: string
}

export interface LessonSession {
  id: string
  child_id: string
  lesson_id: string
  session_type: 'emotion' | 'challenge' | 'conversation'
  session_data: any
  completed: boolean
  xp_earned: number
  created_at: string
}

// Service class for database operations
export class SupabaseService {
  // Children operations
  async getChildByUserId(userId: string): Promise<Child | null> {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching child:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in getChildByUserId:', err)
      return null
    }
  }

  // Legacy method for backwards compatibility


  async createChild(userId: string, name: string, age: number): Promise<Child | null> {
    try {
      const { data, error } = await supabase
        .from('children')
        .insert({ user_id: userId, name, age })
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

  // Emotion Sessions
  async startEmotionSession(childId: string, lessonId: string): Promise<EmotionSession | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_sessions')
        .insert({ 
          child_id: childId, 
          lesson_id: lessonId, 
          emotion: '', 
          attempts: 0, 
          completed: false, 
          xp_earned: 0 
        })
        .select()
        .single()

      if (error) {
        console.error('Error starting emotion session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in startEmotionSession:', err)
      return null
    }
  }

  async completeEmotionSession(sessionId: string, success: boolean): Promise<EmotionSession | null> {
    try {
      const xpEarned = success ? 10 : 5 // Award XP based on success
      const { data, error } = await supabase
        .from('emotion_sessions')
        .update({ completed: true, xp_earned: xpEarned })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error completing emotion session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in completeEmotionSession:', err)
      return null
    }
  }

  async evaluateEmotionFeedback(sessionId: string, emotion: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('emotion_sessions')
        .update({ emotion })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error evaluating emotion feedback:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('Error in evaluateEmotionFeedback:', err)
      return false
    }
  }

  // Challenge Sessions
  async startChallengeSession(childId: string, challengeId: string): Promise<LessonSession | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_sessions')
        .insert({ 
          child_id: childId, 
          lesson_id: challengeId, 
          session_type: 'challenge',
          session_data: {},
          completed: false, 
          xp_earned: 0 
        })
        .select()
        .single()

      if (error) {
        console.error('Error starting challenge session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in startChallengeSession:', err)
      return null
    }
  }

  async completeChallengeSession(sessionId: string): Promise<LessonSession | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_sessions')
        .update({ completed: true, xp_earned: 15 })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error completing challenge session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in completeChallengeSession:', err)
      return null
    }
  }

  // Conversation Practices
  async initiateConversation(childId: string, conversationType: string): Promise<LessonSession | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_sessions')
        .insert({ 
          child_id: childId, 
          lesson_id: conversationType, 
          session_type: 'conversation',
          session_data: { type: conversationType },
          completed: false, 
          xp_earned: 0 
        })
        .select()
        .single()

      if (error) {
        console.error('Error initiating conversation:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in initiateConversation:', err)
      return null
    }
  }

  async conductPracticeInteraction(sessionId: string, interaction: any): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('lesson_sessions')
        .update({ session_data: interaction })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error conducting practice interaction:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('Error in conductPracticeInteraction:', err)
      return false
    }
  }

  // Experience and Progress Tracking
  async trackXP(childId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('xp_earned')
        .eq('child_id', childId)

      if (error) {
        console.error('Error tracking XP:', error)
        return 0
      }
      
      const totalXP = data?.reduce((sum, record) => sum + record.xp_earned, 0) || 0
      return totalXP
    } catch (err) {
      console.error('Error in trackXP:', err)
      return 0
    }
  }

  async updateChildProgress(childId: string, lessonId: string): Promise<Progress | null> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert({ 
          child_id: childId, 
          lesson_id: lessonId, 
          completed: true, 
          xp_earned: 10 
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating child progress:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in updateChildProgress:', err)
      return null
    }
  }

  // ===== EMOTION DETECTIVE SERVICE METHODS =====

  // Progress tracking methods
  async getEmotionDetectiveProgress(childId: string): Promise<EmotionDetectiveProgress | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_progress')
        .select('*')
        .eq('child_id', childId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create initial progress
          return await this.createEmotionDetectiveProgress(childId)
        }
        console.error('Error fetching emotion detective progress:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in getEmotionDetectiveProgress:', err)
      return null
    }
  }

  async createEmotionDetectiveProgress(childId: string): Promise<EmotionDetectiveProgress | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_progress')
        .insert({
          child_id: childId,
          level: 1,
          total_xp: 0,
          completed_sessions: 0,
          current_streak: 0,
          best_streak: 0,
          unlocked_emotions: ['happy', 'sad', 'angry', 'neutral']
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating emotion detective progress:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in createEmotionDetectiveProgress:', err)
      return null
    }
  }

  async updateEmotionDetectiveProgress(
    childId: string, 
    updates: Partial<Omit<EmotionDetectiveProgress, 'id' | 'child_id' | 'created_at' | 'updated_at'>>
  ): Promise<EmotionDetectiveProgress | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_progress')
        .update(updates)
        .eq('child_id', childId)
        .select()
        .single()

      if (error) {
        console.error('Error updating emotion detective progress:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in updateEmotionDetectiveProgress:', err)
      return null
    }
  }

  // Session management methods
  async createEmotionDetectiveSession(
    childId: string, 
    level: number, 
    emotionsPresented: string[]
  ): Promise<EmotionDetectiveSession | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_sessions')
        .insert({
          child_id: childId,
          level: level,
          emotions_presented: emotionsPresented,
          total_attempts: 0,
          correct_identifications: 0,
          successful_mirrors: 0,
          xp_earned: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating emotion detective session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in createEmotionDetectiveSession:', err)
      return null
    }
  }

  async updateEmotionDetectiveSession(
    sessionId: string,
    updates: Partial<Omit<EmotionDetectiveSession, 'id' | 'child_id' | 'created_at'>>
  ): Promise<EmotionDetectiveSession | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating emotion detective session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in updateEmotionDetectiveSession:', err)
      return null
    }
  }

  async completeEmotionDetectiveSession(
    sessionId: string,
    durationSeconds: number
  ): Promise<EmotionDetectiveSession | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_sessions')
        .update({
          duration_seconds: durationSeconds,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error completing emotion detective session:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in completeEmotionDetectiveSession:', err)
      return null
    }
  }

  async getEmotionDetectiveSessions(
    childId: string, 
    limit: number = 10
  ): Promise<EmotionDetectiveSession[]> {
    try {
      const { data, error } = await supabase
        .from('emotion_detective_sessions')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching emotion detective sessions:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getEmotionDetectiveSessions:', err)
      return []
    }
  }

  // Emotion attempt tracking methods
  async createEmotionAttempt(
    sessionId: string,
    emotionName: string
  ): Promise<EmotionAttempt | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_attempts')
        .insert({
          session_id: sessionId,
          emotion_name: emotionName,
          identification_attempts: 0,
          identification_correct: false,
          mirroring_attempts: 0,
          time_spent_seconds: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating emotion attempt:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in createEmotionAttempt:', err)
      return null
    }
  }

  async updateEmotionAttempt(
    attemptId: string,
    updates: Partial<Omit<EmotionAttempt, 'id' | 'session_id' | 'created_at'>>
  ): Promise<EmotionAttempt | null> {
    try {
      const { data, error } = await supabase
        .from('emotion_attempts')
        .update(updates)
        .eq('id', attemptId)
        .select()
        .single()

      if (error) {
        console.error('Error updating emotion attempt:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('Error in updateEmotionAttempt:', err)
      return null
    }
  }

  async getEmotionAttempts(sessionId: string): Promise<EmotionAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('emotion_attempts')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching emotion attempts:', error)
        return []
      }
      return data || []
    } catch (err) {
      console.error('Error in getEmotionAttempts:', err)
      return []
    }
  }

  // XP calculation and level progression methods
  calculateXP(
    identificationCorrect: boolean,
    mirroringScore: number,
    timeSpent: number,
    isSessionComplete: boolean = false
  ): number {
    let xp = 0
    
    // Base XP for correct identification
    if (identificationCorrect) {
      xp += 10
    }
    
    // XP for successful mirroring (score > 70)
    if (mirroringScore > 70) {
      xp += 15
    }
    
    // Speed bonus (if completed in under 30 seconds)
    if (timeSpent < 30) {
      xp += 5
    }
    
    // Session completion bonus
    if (isSessionComplete) {
      xp += 50
    }
    
    return xp
  }

  async updateProgressWithXP(
    childId: string,
    xpEarned: number,
    sessionCompleted: boolean = false
  ): Promise<EmotionDetectiveProgress | null> {
    try {
      // Get current progress
      const currentProgress = await this.getEmotionDetectiveProgress(childId)
      if (!currentProgress) {
        console.error('No progress found for child')
        return null
      }

      // Calculate new values
      const newTotalXP = currentProgress.total_xp + xpEarned
      const newCompletedSessions = sessionCompleted 
        ? currentProgress.completed_sessions + 1 
        : currentProgress.completed_sessions
      
      // Calculate new level (every 100 XP = 1 level)
      const newLevel = Math.floor(newTotalXP / 100) + 1
      
      // Update streak
      const newCurrentStreak = sessionCompleted 
        ? currentProgress.current_streak + 1 
        : currentProgress.current_streak
      const newBestStreak = Math.max(newCurrentStreak, currentProgress.best_streak)
      
      // Unlock new emotions based on level
      const unlockedEmotions = this.getUnlockedEmotions(newLevel)

      return await this.updateEmotionDetectiveProgress(childId, {
        level: newLevel,
        total_xp: newTotalXP,
        completed_sessions: newCompletedSessions,
        current_streak: newCurrentStreak,
        best_streak: newBestStreak,
        unlocked_emotions: unlockedEmotions
      })
    } catch (err) {
      console.error('Error in updateProgressWithXP:', err)
      return null
    }
  }

  private getUnlockedEmotions(level: number): string[] {
    const emotionLevels = {
      1: ['happy', 'sad', 'angry', 'neutral'],
      2: ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful'],
      3: ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted'],
      4: ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'excited', 'worried'],
      5: ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'excited', 'worried', 'confused', 'proud']
    }
    
    return emotionLevels[Math.min(level, 5) as keyof typeof emotionLevels] || emotionLevels[1]
  }

  // Real-time subscriptions for emotion detective
  subscribeToEmotionDetectiveProgress(childId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`emotion-detective-progress-${childId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'emotion_detective_progress', 
          filter: `child_id=eq.${childId}` 
        }, 
        callback
      )
      .subscribe()
  }

  subscribeToEmotionDetectiveSession(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`emotion-detective-session-${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'emotion_detective_sessions', 
          filter: `id=eq.${sessionId}` 
        }, 
        callback
      )
      .subscribe()
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService()
export default supabaseService
