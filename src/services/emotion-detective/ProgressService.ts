import { 
  EmotionDetectiveProgress, 
  LessonSession, 
  QuestionAttempt, 
  LessonResults,
  XP_REWARDS 
} from '../../types/emotion-detective';

class ProgressService {
  /**
   * Calculate XP for a question attempt
   */
  calculateQuestionXP(
    identificationCorrect: boolean,
    mirroringSuccess: boolean,
    timeSpent: number,
    attempts: number
  ): number {
    let xp = 0;

    // Base XP for correct identification
    if (identificationCorrect) {
      xp += XP_REWARDS.CORRECT_IDENTIFICATION;
    }

    // Additional XP for successful mirroring
    if (mirroringSuccess) {
      xp += XP_REWARDS.SUCCESSFUL_MIRRORING;
    }

    // Speed bonus (if completed quickly and on first attempt)
    if (identificationCorrect && attempts === 1 && timeSpent < 10) {
      xp += XP_REWARDS.SPEED_BONUS;
    }

    return xp;
  }

  /**
   * Calculate session completion XP
   */
  calculateSessionXP(
    questionAttempts: QuestionAttempt[],
    sessionCompleted: boolean
  ): number {
    let totalXP = 0;

    // Sum up individual question XP
    totalXP = questionAttempts.reduce((sum, attempt) => sum + attempt.xpEarned, 0);

    // Session completion bonus
    if (sessionCompleted && questionAttempts.length >= 10) {
      totalXP += XP_REWARDS.SESSION_COMPLETION_BONUS;
    }

    return totalXP;
  }

  /**
   * Determine if child should level up
   */
  shouldLevelUp(currentLevel: number, totalXP: number): boolean {
    const xpRequiredForNextLevel = this.getXPRequiredForLevel(currentLevel + 1);
    return totalXP >= xpRequiredForNextLevel;
  }

  /**
   * Get XP required for a specific level
   */
  getXPRequiredForLevel(level: number): number {
    // Progressive XP requirements: Level 1 = 0, Level 2 = 100, Level 3 = 250, etc.
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(1.5, level - 2));
  }

  /**
   * Get current level from total XP
   */
  getLevelFromXP(totalXP: number): number {
    let level = 1;
    while (totalXP >= this.getXPRequiredForLevel(level + 1)) {
      level++;
    }
    return level;
  }

  /**
   * Get XP progress towards next level
   */
  getXPProgressToNextLevel(totalXP: number): { current: number; required: number; percentage: number } {
    const currentLevel = this.getLevelFromXP(totalXP);
    const currentLevelXP = this.getXPRequiredForLevel(currentLevel);
    const nextLevelXP = this.getXPRequiredForLevel(currentLevel + 1);
    
    const current = totalXP - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    const percentage = Math.floor((current / required) * 100);

    return { current, required, percentage };
  }

  /**
   * Update streak based on session performance
   */
  updateStreak(
    currentStreak: number,
    bestStreak: number,
    sessionSuccess: boolean
  ): { newStreak: number; newBestStreak: number } {
    let newStreak = sessionSuccess ? currentStreak + 1 : 0;
    let newBestStreak = Math.max(bestStreak, newStreak);

    return { newStreak, newBestStreak };
  }

  /**
   * Determine if session was successful
   */
  isSessionSuccessful(questionAttempts: QuestionAttempt[]): boolean {
    if (questionAttempts.length === 0) return false;

    const correctIdentifications = questionAttempts.filter(
      attempt => attempt.identificationCorrect
    ).length;

    const successRate = correctIdentifications / questionAttempts.length;
    return successRate >= 0.7; // 70% success rate required
  }

  /**
   * Get emotions that should be unlocked at a given level
   */
  getUnlockedEmotionsForLevel(level: number): string[] {
    const baseEmotions = ['happy', 'sad', 'angry', 'neutral'];
    
    if (level >= 2) {
      baseEmotions.push('surprised', 'fearful');
    }
    
    if (level >= 3) {
      baseEmotions.push('disgusted');
    }
    
    if (level >= 4) {
      baseEmotions.push('excited', 'worried');
    }
    
    if (level >= 5) {
      baseEmotions.push('confused', 'proud');
    }

    return baseEmotions;
  }

  /**
   * Create lesson results summary
   */
  createLessonResults(
    sessionId: string,
    questionAttempts: QuestionAttempt[],
    sessionData: Partial<LessonSession>
  ): LessonResults {
    const correctIdentifications = questionAttempts.filter(
      attempt => attempt.identificationCorrect
    ).length;

    const successfulMirrors = questionAttempts.filter(
      attempt => attempt.mirroringScore >= 60 // 60% confidence threshold
    ).length;

    const totalXP = this.calculateSessionXP(questionAttempts, true);
    const totalTimeSpent = questionAttempts.reduce(
      (sum, attempt) => sum + attempt.timeSpent, 0
    );

    return {
      sessionId,
      totalXP,
      correctIdentifications,
      successfulMirrors,
      completedQuestions: questionAttempts.length,
      timeSpent: totalTimeSpent,
      level: sessionData.level || 1
    };
  }

  /**
   * Generate performance feedback
   */
  generatePerformanceFeedback(results: LessonResults): string {
    const identificationRate = results.correctIdentifications / results.completedQuestions;
    const mirroringRate = results.successfulMirrors / results.completedQuestions;

    if (identificationRate >= 0.9 && mirroringRate >= 0.8) {
      return "Excellent work! You're a true emotion detective!";
    } else if (identificationRate >= 0.7 && mirroringRate >= 0.6) {
      return "Great job! You're getting better at reading emotions!";
    } else if (identificationRate >= 0.5) {
      return "Good effort! Keep practicing to become an emotion expert!";
    } else {
      return "Nice try! Remember to look carefully at facial expressions!";
    }
  }
}

export default new ProgressService();