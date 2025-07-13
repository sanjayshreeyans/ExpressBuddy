import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  MessageCircle, 
  Heart, 
  CheckCircle, 
  Lock, 
  Star, 
  Trophy,
  User,
  Settings,
  LogOut,
  Play,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface LearningNode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'locked';
  progress?: number;
  lessons: number;
  xp: number;
  color: string;
}

export default function LearningPathHome() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, logout } = useKindeAuth();

  const handleStartChat = () => {
    navigate('/chat');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const learningPaths: LearningNode[] = [
    {
      id: 'emotion-detective',
      title: 'Emotion Detective',
      description: 'Help children recognize and mirror facial expressions through interactive games with Pico',
      icon: <Heart className="w-8 h-8" />,
      status: 'current',
      progress: 65,
      lessons: 12,
      xp: 250,
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'picos-challenges',
      title: "Pico's Challenges",
      description: 'Learn conflict resolution and problem-solving through guided scenarios with your AI companion',
      icon: <Brain className="w-8 h-8" />,
      status: 'current',
      progress: 30,
      lessons: 15,
      xp: 300,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'practice-conversations',
      title: 'Practice Conversations',
      description: 'Master turn-taking and social dialogue skills in a safe, supportive environment',
      icon: <MessageCircle className="w-8 h-8" />,
      status: 'locked',
      progress: 0,
      lessons: 18,
      xp: 400,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const skills = [
    'Facial expression recognition',
    'Emotion identification games',
    'Mirror practice sessions',
    'Real-time feedback',
    'Conflict resolution scenarios',
    'Decision-making practice',
    'Social problem solving',
    'Guided conversations',
    'Turn-taking practice',
    'Social dialogue training',
    'Conversation starters',
    'Communication confidence'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ExpressBuddy
              </div>
              <Badge variant="secondary" className="text-xs">
                Learning Mode
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">950 XP</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="font-medium">5 Day Streak</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.given_name?.[0] || 'U'}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Learning Path */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.given_name}!
              </h1>
              <p className="text-gray-600">
                Continue your journey and unlock new social-emotional skills
              </p>
            </div>

            {/* Learning Path Visualization */}
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 rounded-full"></div>
              
              <div className="space-y-12">
                {learningPaths.map((path, index) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative"
                  >
                    {/* Node Circle */}
                    <div className={`absolute left-4 w-8 h-8 rounded-full flex items-center justify-center ${
                      path.status === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : path.status === 'current'
                        ? `bg-gradient-to-r ${path.color} text-white`
                        : 'bg-gray-300 text-gray-500'
                    } shadow-lg z-10`}>
                      {path.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : path.status === 'locked' ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        path.icon
                      )}
                    </div>

                    {/* Card */}
                    <Card className={`ml-20 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                      path.status === 'locked' ? 'opacity-60' : 'hover:scale-105'
                    } ${selectedPath === path.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => path.status !== 'locked' && setSelectedPath(path.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {path.title}
                              </h3>
                              {path.status === 'current' && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-4">
                              {path.description}
                            </p>
                            
                            {path.status !== 'locked' && (
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{path.lessons} lessons</span>
                                <span>•</span>
                                <span>{path.xp} XP</span>                              {(path.progress ?? 0) > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{path.progress}% complete</span>
                                </>
                              )}
                              </div>
                            )}
                          </div>
                          
                          {path.status === 'current' && (
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat();
                              }}
                              className={`bg-gradient-to-r ${path.color} hover:opacity-90 text-white`}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Continue
                            </Button>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {(path.progress ?? 0) > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                            <div 
                              className={`bg-gradient-to-r ${path.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${path.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Challenge */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Daily Challenge</h3>
                    <p className="text-sm text-gray-600">Practice facial expressions</p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white">
                  Start Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Skills Overview */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Skills You'll Learn</h3>
                <div className="space-y-2">
                  {skills.slice(0, 6).map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                      <span className="text-gray-600">{skill}</span>
                    </div>
                  ))}
                  <button className="text-blue-600 text-sm hover:underline">
                    View all skills →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Achievement */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">New Achievement!</h3>
                    <p className="text-sm text-gray-600">Emotion Expert</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You've successfully identified 50 different emotions. Keep it up!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
