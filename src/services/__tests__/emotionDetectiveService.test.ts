import { supabaseService } from '../supabaseService'

// Mock Supabase completely to avoid database calls
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
          }))
        }))
      }))
    }))
  }
}))

describe('Emotion Detective Service Methods', () => {
  describe('XP Calculation Logic', () => {
    test('should calculate XP correctly for different scenarios', () => {
      // Test correct identification + successful mirroring + speed bonus
      const xp1 = supabaseService.calculateXP(true, 80, 25, false)
      expect(xp1).toBe(30) // 10 + 15 + 5

      // Test session completion bonus
      const xp2 = supabaseService.calculateXP(true, 80, 25, true)
      expect(xp2).toBe(80) // 10 + 15 + 5 + 50

      // Test failed mirroring (score <= 70)
      const xp3 = supabaseService.calculateXP(true, 60, 35, false)
      expect(xp3).toBe(10) // Only identification XP

      // Test incorrect identification
      const xp4 = supabaseService.calculateXP(false, 80, 25, false)
      expect(xp4).toBe(20) // 0 + 15 + 5

      // Test slow completion (no speed bonus)
      const xp5 = supabaseService.calculateXP(true, 80, 35, false)
      expect(xp5).toBe(25) // 10 + 15 + 0

      // Test minimum XP (all failed)
      const xp6 = supabaseService.calculateXP(false, 50, 40, false)
      expect(xp6).toBe(0) // 0 + 0 + 0
    })
  })

  describe('Emotion Unlocking Logic', () => {
    test('should unlock emotions based on level progression', () => {
      const service = supabaseService as any
      
      // Level 1: Basic emotions
      expect(service.getUnlockedEmotions(1)).toEqual(['happy', 'sad', 'angry', 'neutral'])
      
      // Level 2: Add intermediate emotions
      expect(service.getUnlockedEmotions(2)).toEqual(['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful'])
      
      // Level 3: Add disgusted
      expect(service.getUnlockedEmotions(3)).toEqual(['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted'])
      
      // Level 4: Add complex emotions
      expect(service.getUnlockedEmotions(4)).toEqual(['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'excited', 'worried'])
      
      // Level 5: All emotions
      expect(service.getUnlockedEmotions(5)).toEqual(['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'excited', 'worried', 'confused', 'proud'])
      
      // Level 6+ should cap at level 5 emotions
      expect(service.getUnlockedEmotions(10)).toEqual(['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'excited', 'worried', 'confused', 'proud'])
    })
  })

  describe('Service Method Structure', () => {
    test('should have all required emotion detective methods', () => {
      // Verify all required methods exist
      expect(typeof supabaseService.getEmotionDetectiveProgress).toBe('function')
      expect(typeof supabaseService.createEmotionDetectiveProgress).toBe('function')
      expect(typeof supabaseService.updateEmotionDetectiveProgress).toBe('function')
      expect(typeof supabaseService.createEmotionDetectiveSession).toBe('function')
      expect(typeof supabaseService.updateEmotionDetectiveSession).toBe('function')
      expect(typeof supabaseService.completeEmotionDetectiveSession).toBe('function')
      expect(typeof supabaseService.getEmotionDetectiveSessions).toBe('function')
      expect(typeof supabaseService.createEmotionAttempt).toBe('function')
      expect(typeof supabaseService.updateEmotionAttempt).toBe('function')
      expect(typeof supabaseService.getEmotionAttempts).toBe('function')
      expect(typeof supabaseService.calculateXP).toBe('function')
      expect(typeof supabaseService.updateProgressWithXP).toBe('function')
      expect(typeof supabaseService.subscribeToEmotionDetectiveProgress).toBe('function')
      expect(typeof supabaseService.subscribeToEmotionDetectiveSession).toBe('function')
    })
  })
})