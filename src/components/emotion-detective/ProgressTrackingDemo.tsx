import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import ProgressTracking from './ProgressTracking';
import LessonCompletionScreen from './LessonCompletionScreen';
import AnimatedXPCounter from './AnimatedXPCounter';
import LevelProgressDisplay from './LevelProgressDisplay';
import AchievementNotification from './AchievementNotification';
import { LessonResults, SessionStats } from '../../types/emotion-detective';
import { Achievement } from '../../services/emotion-detective/XPCalculationService';

/**
 * Demo component to test progress tracking and XP system
 */
const ProgressTrackingDemo: React.FC = () => {
  const [currentXP, setCurrentXP] = useState(150);
  const [sessionXP, setSessionXP] = useState(0);
  const [level, setLevel] = useState(2);
  const [completedQuestions, setCompletedQuestions] = useState(3);
  const [totalQuestions] = useState(10);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  // Mock data for completion screen
  const mockResults: LessonResults = {
    sessionId: 'demo-session',
    totalXP: currentXP,
    correctIdentifications: 8,
    successfulMirrors: 7,
    completedQuestions: 10,
    timeSpent: 420, // 7 minutes
    level: level
  };

  const mockSessionStats: SessionStats = {
    correctIdentifications: 8,
    successfulMirrors: 7,
    totalQuestions: 10,
    averageResponseTime: 3500, // 3.5 seconds
    perfectStreak: 5,
    sessionDuration: 420
  };

  const mockAchievements: Achievement[] = [
    {
      id: 'perfect_streak',
      name: 'Streak Master',
      description: '5 correct answers in a row!',
      xpBonus: 10,
      icon: '🔥'
    },
    {
      id: 'emotion_master',
      name: 'Emotion Master',
      description: 'Excellent at expressing emotions!',
      xpBonus: 20,
      icon: '🎭'
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Lightning fast responses!',
      xpBonus: 15,
      icon: '🚀'
    }
  ];

  const handleAddXP = (amount: number) => {
    setSessionXP(prev => prev + amount);
    setCurrentXP(prev => prev + amount);
  };

  const handleCompleteQuestion = () => {
    if (completedQuestions < totalQuestions) {
      setCompletedQuestions(prev => prev + 1);
      handleAddXP(25); // 10 for identification + 15 for mirroring
    }
  };

  const handleShowAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
  };

  const handleResetDemo = () => {
    setCurrentXP(150);
    setSessionXP(0);
    setLevel(2);
    setCompletedQuestions(3);
    setShowCompletion(false);
    setCurrentAchievement(null);
  };

  if (showCompletion) {
    return (
      <LessonCompletionScreen
        results={mockResults}
        sessionStats={mockSessionStats}
        achievements={mockAchievements}
        onContinue={() => {
          setShowCompletion(false);
          handleResetDemo();
        }}
        onReturnToPath={() => {
          setShowCompletion(false);
          handleResetDemo();
        }}
      />
    );
  }

  return (
    <div className="progress-tracking-demo min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Achievement Notification */}
      <AchievementNotification 
        achievement={currentAchievement}
        onComplete={() => setCurrentAchievement(null)}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Demo Header */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-purple-800">
              🎮 Progress Tracking & XP System Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              Test the Duolingo-style XP system, animated counters, and achievement notifications
            </p>
            <div className="flex justify-center">
              <Button onClick={handleResetDemo} variant="outline">
                Reset Demo
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Progress Tracking */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">
                  📊 Progress Tracking Component
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressTracking
                  currentXP={currentXP}
                  sessionXP={sessionXP}
                  level={level}
                  completedQuestions={completedQuestions}
                  totalQuestions={totalQuestions}
                />
              </CardContent>
            </Card>

            {/* Individual Component Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-800">
                  🧪 Individual Components
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Animated XP Counter */}
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Animated XP Counter:</h4>
                  <div className="flex gap-4 items-center">
                    <AnimatedXPCounter value={sessionXP} size="sm" />
                    <AnimatedXPCounter value={sessionXP} size="md" />
                    <AnimatedXPCounter value={sessionXP} size="lg" />
                  </div>
                </div>

                {/* Level Progress Display */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Level Progress Display:</h4>
                  <LevelProgressDisplay
                    currentXP={currentXP}
                    sessionXP={sessionXP}
                    showSessionXP={true}
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-purple-800">
                  🎮 Demo Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* XP Controls */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Add XP:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => handleAddXP(10)} size="sm" variant="outline">
                      +10 XP (Identification)
                    </Button>
                    <Button onClick={() => handleAddXP(15)} size="sm" variant="outline">
                      +15 XP (Mirroring)
                    </Button>
                    <Button onClick={() => handleAddXP(5)} size="sm" variant="outline">
                      +5 XP (Speed Bonus)
                    </Button>
                    <Button onClick={() => handleAddXP(50)} size="sm" variant="outline">
                      +50 XP (Session Bonus)
                    </Button>
                  </div>
                </div>

                {/* Question Progress */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Question Progress:</h4>
                  <Button 
                    onClick={handleCompleteQuestion}
                    disabled={completedQuestions >= totalQuestions}
                    className="w-full"
                  >
                    Complete Question (+25 XP)
                  </Button>
                </div>

                {/* Achievement Tests */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Test Achievements:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {mockAchievements.map((achievement) => (
                      <Button
                        key={achievement.id}
                        onClick={() => handleShowAchievement(achievement)}
                        size="sm"
                        variant="outline"
                        className="text-left justify-start"
                      >
                        {achievement.icon} {achievement.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Completion Screen */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Completion Screen:</h4>
                  <Button 
                    onClick={() => setShowCompletion(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Show Completion Screen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Stats Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">
                  📈 Current Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total XP:</span>
                    <div className="font-bold text-lg">{currentXP}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Session XP:</span>
                    <div className="font-bold text-lg text-green-600">{sessionXP}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>
                    <div className="font-bold text-lg text-blue-600">{level}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Progress:</span>
                    <div className="font-bold text-lg text-purple-600">
                      {completedQuestions}/{totalQuestions}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTrackingDemo;