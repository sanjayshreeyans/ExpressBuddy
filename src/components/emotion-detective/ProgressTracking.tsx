import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressTrackingProps } from '../../types/emotion-detective';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import AnimatedXPCounter from './AnimatedXPCounter';
import LevelProgressDisplay from './LevelProgressDisplay';
import AchievementNotification from './AchievementNotification';
import { Achievement } from '../../services/emotion-detective/XPCalculationService';

/**
 * Progress Tracking Component with Duolingo-style XP system
 * Features animated counters, level progression, and achievement notifications
 */
const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  currentXP,
  sessionXP,
  level,
  completedQuestions,
  totalQuestions
}) => {
  const [previousXP, setPreviousXP] = useState(currentXP);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [showSessionStats, setShowSessionStats] = useState(false);

  // Update previous XP when current XP changes
  useEffect(() => {
    if (currentXP !== previousXP) {
      setPreviousXP(currentXP);
    }
  }, [currentXP, previousXP]);

  // Calculate session progress percentage
  const sessionProgress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

  // Mock achievement for demonstration (in real implementation, this would come from props)
  const handleShowAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
  };

  const clearAchievement = () => {
    setCurrentAchievement(null);
  };

  return (
    <div className="progress-tracking space-y-4">
      {/* Achievement Notification Overlay */}
      <AchievementNotification 
        achievement={currentAchievement}
        onComplete={clearAchievement}
      />

      {/* Level Progress Display */}
      <LevelProgressDisplay
        currentXP={currentXP}
        sessionXP={sessionXP}
        showSessionXP={sessionXP > 0}
        animated={true}
        size="md"
      />

      {/* Session Progress Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-800 flex items-center justify-between">
            <span>Session Progress</span>
            <AnimatedXPCounter 
              value={sessionXP}
              previousValue={0}
              size="sm"
              showBadge={true}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Questions Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">
                  Questions Completed
                </span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {completedQuestions}/{totalQuestions}
                </Badge>
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Progress 
                  value={sessionProgress} 
                  className="h-3 bg-green-200"
                />
              </motion.div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-green-600">
                  {Math.round(sessionProgress)}% Complete
                </span>
                <span className="text-xs text-gray-500">
                  {totalQuestions - completedQuestions} remaining
                </span>
              </div>
            </div>

            {/* Session Stats Toggle */}
            <motion.button
              onClick={() => setShowSessionStats(!showSessionStats)}
              className="w-full text-sm text-green-700 hover:text-green-800 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showSessionStats ? '▼ Hide Details' : '▶ Show Details'}
            </motion.button>

            {/* Expandable Session Details */}
            <AnimatePresence>
              {showSessionStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-green-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Current Level:</span>
                      <Badge className="bg-blue-500 text-white">
                        Level {level}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Total XP:</span>
                      <span className="font-semibold text-green-800">
                        {currentXP} XP
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Session XP:</span>
                      <AnimatedXPCounter 
                        value={sessionXP}
                        previousValue={0}
                        size="sm"
                        showBadge={false}
                        className="text-green-800"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {currentXP}
              </div>
              <div className="text-xs text-yellow-700">
                Total XP
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {level}
              </div>
              <div className="text-xs text-purple-700">
                Level
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(sessionProgress)}%
              </div>
              <div className="text-xs text-green-700">
                Complete
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Demo Achievement Button (for testing) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.button
          onClick={() => handleShowAchievement({
            id: 'demo',
            name: 'Demo Achievement',
            description: 'This is a test achievement!',
            xpBonus: 10,
            icon: '🎉'
          })}
          className="w-full p-2 bg-gray-200 rounded text-sm text-gray-600 hover:bg-gray-300 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Test Achievement (Dev Only)
        </motion.button>
      )}
    </div>
  );
};

export default ProgressTracking;