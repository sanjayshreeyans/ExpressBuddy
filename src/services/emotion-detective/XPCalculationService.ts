/**
 * XP Calculation Service for Emotion Detective Learning
 * Handles all XP calculations, achievements, and progress tracking
 */

import { XP_REWARDS } from '../../types/emotion-detective';

export interface XPCalculationResult {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  icon: string;
}

export interface SessionStats {
  correctIdentifications: number;
  successfulMirrors: number;
  totalQuestions: number;
  averageResponseTime: number;
  perfectStreak: number;
  sessionDuration: number;
}

export class XPCalculationService {
  /**
   * Calculate XP for a correct emotion identification
   */
  static calculateIdentificationXP(responseTime: number, attempts: number = 1): XPCalculationResult {
    let baseXP = XP_REWARDS.CORRECT_IDENTIFICATION;
    let bonusXP = 0;
    const achievements: Achievement[] = [];

    // Speed bonus for quick responses (under 5 seconds)
    if (responseTime < 5000 && attempts === 1) {
      bonusXP += XP_REWARDS.SPEED_BONUS;
      achievements.push({
        id: 'quick_thinker',
        name: 'Quick Thinker',
        description: 'Answered in under 5 seconds!',
        xpBonus: XP_REWARDS.SPEED_BONUS,
        icon: '⚡'
      });
    }

    // First try bonus
    if (attempts === 1) {
      bonusXP += 2;
      achievements.push({
        id: 'first_try',
        name: 'First Try!',
        description: 'Got it right on the first try!',
        xpBonus: 2,
        icon: '🎯'
      });
    }

    return {
      baseXP,
      bonusXP,
      totalXP: baseXP + bonusXP,
      achievements
    };
  }

  /**
   * Calculate XP for successful emotion mirroring
   */
  static calculateMirroringXP(confidenceScore: number, attempts: number = 1): XPCalculationResult {
    let baseXP = XP_REWARDS.SUCCESSFUL_MIRRORING;
    let bonusXP = 0;
    const achievements: Achievement[] = [];

    // High confidence bonus (90%+ confidence)
    if (confidenceScore >= 90) {
      bonusXP += 5;
      achievements.push({
        id: 'perfect_mirror',
        name: 'Perfect Mirror',
        description: 'Excellent emotion expression!',
        xpBonus: 5,
        icon: '🎭'
      });
    }

    // First attempt bonus
    if (attempts === 1) {
      bonusXP += 3;
      achievements.push({
        id: 'natural_actor',
        name: 'Natural Actor',
        description: 'Nailed it on the first try!',
        xpBonus: 3,
        icon: '🌟'
      });
    }

    return {
      baseXP,
      bonusXP,
      totalXP: baseXP + bonusXP,
      achievements
    };
  }

  /**
   * Calculate session completion bonus and achievements
   */
  static calculateSessionBonus(stats: SessionStats): XPCalculationResult {
    let baseXP = XP_REWARDS.SESSION_COMPLETION_BONUS;
    let bonusXP = 0;
    const achievements: Achievement[] = [];

    // Perfect session (all correct on first try)
    if (stats.correctIdentifications === stats.totalQuestions && stats.perfectStreak === stats.totalQuestions) {
      bonusXP += 25;
      achievements.push({
        id: 'perfect_session',
        name: 'Perfect Session',
        description: 'All questions correct on first try!',
        xpBonus: 25,
        icon: '🏆'
      });
    }

    // Speed demon (average response under 3 seconds)
    if (stats.averageResponseTime < 3000) {
      bonusXP += 15;
      achievements.push({
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Lightning fast responses!',
        xpBonus: 15,
        icon: '🚀'
      });
    }

    // Emotion master (high mirroring success rate)
    const mirroringRate = stats.successfulMirrors / stats.totalQuestions;
    if (mirroringRate >= 0.9) {
      bonusXP += 20;
      achievements.push({
        id: 'emotion_master',
        name: 'Emotion Master',
        description: 'Excellent at expressing emotions!',
        xpBonus: 20,
        icon: '🎨'
      });
    }

    // Streak achievements
    if (stats.perfectStreak >= 5) {
      bonusXP += 10;
      achievements.push({
        id: 'streak_master',
        name: 'Streak Master',
        description: `${stats.perfectStreak} correct in a row!`,
        xpBonus: 10,
        icon: '🔥'
      });
    }

    return {
      baseXP,
      bonusXP,
      totalXP: baseXP + bonusXP,
      achievements
    };
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevel(totalXP: number): number {
    // Level progression: 100 XP for level 1, then +50 XP per level
    // Level 1: 0-99 XP
    // Level 2: 100-199 XP  
    // Level 3: 200-299 XP
    // etc.
    if (totalXP < 100) return 1;
    return Math.floor((totalXP - 100) / 100) + 2;
  }

  /**
   * Calculate XP needed for next level
   */
  static getXPForNextLevel(currentXP: number): { current: number; needed: number; total: number } {
    const currentLevel = this.calculateLevel(currentXP);
    const nextLevelXP = currentLevel === 1 ? 100 : (currentLevel - 1) * 100 + 100;
    
    return {
      current: currentXP,
      needed: nextLevelXP - currentXP,
      total: nextLevelXP
    };
  }

  /**
   * Get level progress as percentage
   */
  static getLevelProgress(currentXP: number): number {
    const { current, total } = this.getXPForNextLevel(currentXP);
    const levelStartXP = total - 100;
    const progressInLevel = current - levelStartXP;
    return Math.max(0, Math.min(100, (progressInLevel / 100) * 100));
  }
}