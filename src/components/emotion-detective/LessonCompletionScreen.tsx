import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import AnimatedXPCounter from './AnimatedXPCounter';
import LevelProgressDisplay from './LevelProgressDisplay';
import AchievementNotification from './AchievementNotification';
import { Achievement, XPCalculationService, SessionStats } from '../../services/emotion-detective/XPCalculationService';
import { LessonResults } from '../../types/emotion-detective';

interface LessonCompletionScreenProps {
  results: LessonResults;
  sessionStats: SessionStats;
  achievements: Achievement[];
  onContinue: () => void;
  onReturnToPath: () => void;
  className?: string;
}

const LessonCompletionScreen: React.FC<LessonCompletionScreenProps> = ({
  results,
  sessionStats,
  achievements,
  onContinue,
  onReturnToPath,
  className = ''
}) => {
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(-1);
  const [showStats, setShowStats] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'xp' | 'achievements' | 'complete'>('initial');

  // Calculate session bonus
  const sessionBonus = XPCalculationService.calculateSessionBonus(sessionStats);
  const totalSessionXP = results.totalXP + sessionBonus.totalXP;

  // Animation sequence
  useEffect(() => {
    const sequence = async () => {
      // Phase 1: Initial celebration
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnimationPhase('xp');
      
      // Phase 2: Show XP after 1.5s
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnimationPhase('achievements');
      
      // Phase 3: Show achievements one by one
      if (achievements.length > 0) {
        for (let i = 0; i < achievements.length; i++) {
          setCurrentAchievementIndex(i);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        setCurrentAchievementIndex(-1);
      }
      
      // Phase 4: Complete
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnimationPhase('complete');
    };

    sequence();
  }, [achievements.length]);

  const currentAchievement = currentAchievementIndex >= 0 ? achievements[currentAchievementIndex] : null;

  // Calculate accuracy percentage
  const accuracyPercentage = sessionStats.totalQuestions > 0 
    ? Math.round((sessionStats.correctIdentifications / sessionStats.totalQuestions) * 100)
    : 0;

  // Calculate mirroring success rate
  const mirroringRate = sessionStats.totalQuestions > 0
    ? Math.round((sessionStats.successfulMirrors / sessionStats.totalQuestions) * 100)
    : 0;

  return (
    <div className={`lesson-completion-screen min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-100 flex items-center justify-center p-4 ${className}`}>
      {/* Achievement Notification Overlay */}
      <AchievementNotification 
        achievement={currentAchievement}
        onComplete={() => {}}
        duration={1800}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-2xl"
      >
        {/* Main Completion Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-2xl">
          <CardHeader className="text-center pb-4">
            {/* Celebration Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="mb-4"
            >
              <div className="text-6xl mb-2">🎉</div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Lesson Complete!
                </CardTitle>
              </motion.div>
            </motion.div>

            {/* XP Display */}
            <AnimatePresence>
              {animationPhase !== 'initial' && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mb-4"
                >
                  <div className="flex justify-center items-center gap-4 mb-2">
                    <AnimatedXPCounter 
                      value={totalSessionXP}
                      previousValue={0}
                      size="lg"
                      showBadge={true}
                      className="transform scale-125"
                    />
                  </div>
                  <p className="text-gray-600">
                    Amazing work! You earned {totalSessionXP} XP this session!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Level Progress */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <LevelProgressDisplay
                currentXP={results.totalXP + totalSessionXP}
                sessionXP={totalSessionXP}
                showSessionXP={true}
                animated={true}
                size="md"
              />
            </motion.div>

            {/* Session Statistics */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 flex items-center justify-between">
                    <span>Session Summary</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStats(!showStats)}
                      className="text-green-700 hover:text-green-800"
                    >
                      {showStats ? '▼ Hide' : '▶ Details'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {results.completedQuestions}
                      </div>
                      <div className="text-sm text-green-700">
                        Questions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {accuracyPercentage}%
                      </div>
                      <div className="text-sm text-blue-700">
                        Accuracy
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {mirroringRate}%
                      </div>
                      <div className="text-sm text-purple-700">
                        Mirroring
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <AnimatePresence>
                    {showStats && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-green-200 pt-4"
                      >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Correct Answers:</span>
                              <Badge variant="outline" className="text-green-700">
                                {results.correctIdentifications}/{sessionStats.totalQuestions}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Successful Mirrors:</span>
                              <Badge variant="outline" className="text-blue-700">
                                {results.successfulMirrors}/{sessionStats.totalQuestions}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Perfect Streak:</span>
                              <Badge variant="outline" className="text-purple-700">
                                {sessionStats.perfectStreak}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Time Spent:</span>
                              <span className="font-medium">
                                {Math.round(results.timeSpent / 60)}m {results.timeSpent % 60}s
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Response:</span>
                              <span className="font-medium">
                                {Math.round(sessionStats.averageResponseTime / 1000)}s
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Level:</span>
                              <Badge className="bg-yellow-500 text-white">
                                {results.level}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements Summary */}
            {achievements.length > 0 && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                      <span>🏆</span>
                      <span>Achievements Unlocked</span>
                      <Badge className="bg-orange-500 text-white">
                        {achievements.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {achievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1.4 + index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200"
                        >
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-800">
                              {achievement.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {achievement.description}
                            </p>
                          </div>
                          <Badge className="bg-yellow-400 text-yellow-900 text-xs">
                            +{achievement.xpBonus}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="flex gap-4 pt-4"
            >
              <Button
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
                size="lg"
              >
                Continue Learning
              </Button>
              <Button
                onClick={onReturnToPath}
                variant="outline"
                className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold py-3"
                size="lg"
              >
                Learning Path
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LessonCompletionScreen;