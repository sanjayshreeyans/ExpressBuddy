import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { XPCalculationService } from '../../services/emotion-detective/XPCalculationService';

interface LevelProgressDisplayProps {
  currentXP: number;
  sessionXP?: number;
  showSessionXP?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LevelProgressDisplay: React.FC<LevelProgressDisplayProps> = ({
  currentXP,
  sessionXP = 0,
  showSessionXP = false,
  animated = true,
  size = 'md',
  className = ''
}) => {
  const currentLevel = XPCalculationService.calculateLevel(currentXP);
  const levelProgress = XPCalculationService.getLevelProgress(currentXP);
  const { needed, total } = XPCalculationService.getXPForNextLevel(currentXP);

  const sizeClasses = {
    sm: {
      container: 'p-3',
      level: 'text-lg font-bold',
      progress: 'h-2',
      text: 'text-xs'
    },
    md: {
      container: 'p-4',
      level: 'text-2xl font-bold',
      progress: 'h-3',
      text: 'text-sm'
    },
    lg: {
      container: 'p-6',
      level: 'text-3xl font-bold',
      progress: 'h-4',
      text: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 ${className}`}>
      <CardContent className={classes.container}>
        <div className="flex items-center justify-between mb-3">
          <motion.div
            initial={animated ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white font-bold text-lg">
                  {currentLevel}
                </span>
              </motion.div>
              {showSessionXP && sessionXP > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <Badge className="bg-green-500 text-white text-xs font-bold px-2 py-1">
                    +{sessionXP}
                  </Badge>
                </motion.div>
              )}
            </div>
            <div>
              <h3 className={`${classes.level} text-blue-800`}>
                Level {currentLevel}
              </h3>
              <p className={`${classes.text} text-blue-600`}>
                Emotion Detective
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={animated ? { opacity: 0, x: 20 } : {}}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-right"
          >
            <p className={`${classes.text} text-gray-600`}>
              {needed} XP to level {currentLevel + 1}
            </p>
            <p className={`${classes.text} text-gray-500`}>
              {currentXP} / {total} XP
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={animated ? { scaleX: 0 } : {}}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-full"
        >
          <Progress 
            value={levelProgress} 
            className={`${classes.progress} bg-blue-200`}
          />
        </motion.div>

        <motion.div
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-between mt-2"
        >
          <span className={`${classes.text} text-blue-600 font-medium`}>
            {Math.round(levelProgress)}% Complete
          </span>
          <span className={`${classes.text} text-gray-500`}>
            Level {currentLevel + 1}
          </span>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default LevelProgressDisplay;