/**
 * Example usage of Emotion Detective Service Methods
 * This file demonstrates how to use the service methods for a complete lesson flow
 */

import { supabaseService } from './supabaseService'

export class EmotionDetectiveLessonFlow {
  private childId: string
  private sessionId: string | null = null

  constructor(childId: string) {
    this.childId = childId
  }

  /**
   * Start a new emotion detective lesson
   */
  async startLesson(level: number = 1): Promise<string | null> {
    try {
      // 1. Get or create child progress
      let progress = await supabaseService.getEmotionDetectiveProgress(this.childId)
      if (!progress) {
        progress = await supabaseService.createEmotionDetectiveProgress(this.childId)
      }

      if (!progress) {
        throw new Error('Failed to initialize progress')
      }

      // 2. Determine emotions for this level
      const unlockedEmotions = progress.unlocked_emotions
      const emotionsForLesson = this.selectEmotionsForLesson(unlockedEmotions, level)

      // 3. Create a new session
      const session = await supabaseService.createEmotionDetectiveSession(
        this.childId,
        level,
        emotionsForLesson
      )

      if (!session) {
        throw new Error('Failed to create session')
      }

      this.sessionId = session.id
      return session.id
    } catch (error) {
      console.error('Error starting lesson:', error)
      return null
    }
  }

  /**
   * Process a question attempt
   */
  async processQuestionAttempt(
    emotionName: string,
    identificationCorrect: boolean,
    mirroringScore: number,
    timeSpent: number
  ): Promise<number> {
    if (!this.sessionId) {
      throw new Error('No active session')
    }

    try {
      // 1. Create emotion attempt record
      const attempt = await supabaseService.createEmotionAttempt(this.sessionId, emotionName)
      if (!attempt) {
        throw new Error('Failed to create attempt')
      }

      // 2. Update attempt with results
      await supabaseService.updateEmotionAttempt(attempt.id, {
        identification_attempts: 1,
        identification_correct: identificationCorrect,
        mirroring_attempts: 1,
        mirroring_score: mirroringScore,
        time_spent_seconds: timeSpent
      })

      // 3. Calculate XP for this attempt
      const xpEarned = supabaseService.calculateXP(
        identificationCorrect,
        mirroringScore,
        timeSpent,
        false
      )

      // 4. Update session stats
      const session = await supabaseService.updateEmotionDetectiveSession(this.sessionId, {
        total_attempts: 1, // This would be incremented in real usage
        correct_identifications: identificationCorrect ? 1 : 0,
        successful_mirrors: mirroringScore > 70 ? 1 : 0,
        xp_earned: xpEarned
      })

      return xpEarned
    } catch (error) {
      console.error('Error processing question attempt:', error)
      return 0
    }
  }

  /**
   * Complete the lesson session
   */
  async completeLesson(totalTimeSpent: number): Promise<boolean> {
    if (!this.sessionId) {
      throw new Error('No active session')
    }

    try {
      // 1. Complete the session
      const completedSession = await supabaseService.completeEmotionDetectiveSession(
        this.sessionId,
        totalTimeSpent
      )

      if (!completedSession) {
        throw new Error('Failed to complete session')
      }

      // 2. Calculate session completion bonus
      const sessionBonusXP = supabaseService.calculateXP(false, 0, 0, true) // Just the bonus
      const totalSessionXP = completedSession.xp_earned + sessionBonusXP

      // 3. Update child progress with total XP
      const updatedProgress = await supabaseService.updateProgressWithXP(
        this.childId,
        totalSessionXP,
        true
      )

      if (!updatedProgress) {
        throw new Error('Failed to update progress')
      }

      // 4. Reset session ID
      this.sessionId = null

      return true
    } catch (error) {
      console.error('Error completing lesson:', error)
      return false
    }
  }

  /**
   * Get current progress for the child
   */
  async getCurrentProgress() {
    return await supabaseService.getEmotionDetectiveProgress(this.childId)
  }

  /**
   * Get recent sessions for the child
   */
  async getRecentSessions(limit: number = 5) {
    return await supabaseService.getEmotionDetectiveSessions(this.childId, limit)
  }

  /**
   * Select emotions for a lesson based on level and unlocked emotions
   */
  private selectEmotionsForLesson(unlockedEmotions: string[], level: number): string[] {
    // For this example, select 4 random emotions from unlocked emotions
    const shuffled = [...unlockedEmotions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(4, unlockedEmotions.length))
  }
}

/**
 * Example usage:
 * 
 * const lessonFlow = new EmotionDetectiveLessonFlow('child-123')
 * 
 * // Start lesson
 * const sessionId = await lessonFlow.startLesson(1)
 * 
 * // Process questions
 * const xp1 = await lessonFlow.processQuestionAttempt('happy', true, 85, 20)
 * const xp2 = await lessonFlow.processQuestionAttempt('sad', false, 60, 35)
 * 
 * // Complete lesson
 * const success = await lessonFlow.completeLesson(120)
 * 
 * // Check progress
 * const progress = await lessonFlow.getCurrentProgress()
 * console.log(`Level: ${progress?.level}, XP: ${progress?.total_xp}`)
 */