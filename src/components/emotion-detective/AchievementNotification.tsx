import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Achievement } from '../../services/emotion-detective/XPCalculationService';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onComplete?: () => void;
  duration?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onComplete,
  duration = 3000
}) => {
  React.useEffect(() => {
    if (achievement && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [achievement, onComplete, duration]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: -50 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-none shadow-2xl">
            <CardContent className="p-4">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="flex items-center gap-3 text-white"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl"
                >
                  {achievement.icon}
                </motion.span>
                <div>
                  <motion.h3
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-bold text-lg"
                  >
                    {achievement.name}
                  </motion.h3>
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm opacity-90"
                  >
                    {achievement.description}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Badge className="bg-yellow-400 text-yellow-900 font-bold">
                    +{achievement.xpBonus} XP
                  </Badge>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;