import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
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
  Zap,
  Smile,
  Eye,
  Lightbulb,
  Users,
  Puzzle,
  Mic,
  Camera,
  HandHeart,
  Sparkles,
  Crown,
  Shield,
  Gem,
  Rocket,
  PartyPopper,
  Gift,
  Gauge,
  Compass,
  Map
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
  position: {
    x: number;
    y: number;
  };
  size: 'small' | 'medium' | 'large';
  type: 'lesson' | 'milestone' | 'bonus';
}

export default function DuolingoStyleLearningPath() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();

  const handleStartChat = () => {
    navigate('/chat');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Extended learning paths with Duolingo-style progression
  const learningPaths: LearningNode[] = [
    // Emotion Detective Path
    {
      id: 'emotion-basics',
      title: 'Emotion Basics',
      description: 'Learn to recognize basic emotions',
      icon: <Heart className="w-6 h-6" />,
      status: 'completed',
      progress: 100,
      lessons: 5,
      xp: 100,
      color: 'from-pink-500 to-rose-500',
      position: { x: 20, y: 0 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'facial-expressions',
      title: 'Facial Expressions',
      description: 'Practice identifying facial expressions',
      icon: <Smile className="w-6 h-6" />,
      status: 'completed',
      progress: 100,
      lessons: 8,
      xp: 150,
      color: 'from-pink-500 to-rose-500',
      position: { x: 80, y: 200 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'emotion-detective-milestone',
      title: 'Emotion Detective',
      description: 'Congratulations! You\'ve mastered basic emotions',
      icon: <Crown className="w-8 h-8" />,
      status: 'completed',
      progress: 100,
      lessons: 0,
      xp: 250,
      color: 'from-yellow-400 to-orange-400',
      position: { x: 20, y: 400 },
      size: 'large',
      type: 'milestone'
    },
    {
      id: 'emotion-mirroring',
      title: 'Emotion Mirroring',
      description: 'Learn to mirror emotions you see',
      icon: <Eye className="w-6 h-6" />,
      status: 'current',
      progress: 65,
      lessons: 6,
      xp: 180,
      color: 'from-purple-500 to-pink-500',
      position: { x: 80, y: 600 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'social-cues',
      title: 'Social Cues',
      description: 'Understanding body language and social signals',
      icon: <Users className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 10,
      xp: 200,
      color: 'from-indigo-500 to-purple-500',
      position: { x: 20, y: 800 },
      size: 'medium',
      type: 'lesson'
    },
    
    // Pico's Challenges Path
    {
      id: 'problem-solving-basics',
      title: 'Problem Solving',
      description: 'Learn basic problem-solving steps',
      icon: <Lightbulb className="w-6 h-6" />,
      status: 'current',
      progress: 30,
      lessons: 7,
      xp: 140,
      color: 'from-blue-500 to-cyan-500',
      position: { x: 80, y: 1000 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'conflict-resolution',
      title: 'Conflict Resolution',
      description: 'Practice resolving disagreements peacefully',
      icon: <HandHeart className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 12,
      xp: 220,
      color: 'from-cyan-500 to-blue-500',
      position: { x: 20, y: 1200 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'decision-making',
      title: 'Smart Decisions',
      description: 'Learn to make good choices',
      icon: <Compass className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 9,
      xp: 180,
      color: 'from-teal-500 to-green-500',
      position: { x: 80, y: 1400 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'picos-challenges-milestone',
      title: 'Challenge Master',
      description: 'You\'ve conquered Pico\'s challenges!',
      icon: <Trophy className="w-8 h-8" />,
      status: 'locked',
      progress: 0,
      lessons: 0,
      xp: 300,
      color: 'from-yellow-400 to-orange-400',
      position: { x: 20, y: 1600 },
      size: 'large',
      type: 'milestone'
    },
    
    // Practice Conversations Path
    {
      id: 'conversation-starters',
      title: 'Conversation Starters',
      description: 'Learn how to start conversations',
      icon: <MessageCircle className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 8,
      xp: 160,
      color: 'from-green-500 to-emerald-500',
      position: { x: 80, y: 1800 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'turn-taking',
      title: 'Turn-Taking',
      description: 'Practice taking turns in conversations',
      icon: <Users className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 10,
      xp: 200,
      color: 'from-emerald-500 to-green-500',
      position: { x: 20, y: 2000 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'social-dialogue',
      title: 'Social Dialogue',
      description: 'Master complex social conversations',
      icon: <Mic className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 15,
      xp: 300,
      color: 'from-lime-500 to-green-500',
      position: { x: 80, y: 2200 },
      size: 'medium',
      type: 'lesson'
    },
    {
      id: 'conversation-master',
      title: 'Conversation Master',
      description: 'You\'re a social conversation expert!',
      icon: <Sparkles className="w-8 h-8" />,
      status: 'locked',
      progress: 0,
      lessons: 0,
      xp: 500,
      color: 'from-yellow-400 to-orange-400',
      position: { x: 20, y: 2400 },
      size: 'large',
      type: 'milestone'
    },
    
    // Bonus Challenges
    {
      id: 'bonus-empathy',
      title: 'Empathy Boost',
      description: 'Special empathy building challenge',
      icon: <Gift className="w-6 h-6" />,
      status: 'locked',
      progress: 0,
      lessons: 5,
      xp: 250,
      color: 'from-purple-500 to-pink-500',
      position: { x: 50, y: 2600 },
      size: 'small',
      type: 'bonus'
    },
    {
      id: 'final-celebration',
      title: 'Social Skills Master',
      description: 'You\'ve mastered all social skills!',
      icon: <PartyPopper className="w-10 h-10" />,
      status: 'locked',
      progress: 0,
      lessons: 0,
      xp: 1000,
      color: 'from-pink-500 via-purple-500 to-indigo-500',
      position: { x: 50, y: 2800 },
      size: 'large',
      type: 'milestone'
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
    'Communication confidence',
    'Body language reading',
    'Empathy building',
    'Active listening',
    'Emotional regulation'
  ];

  // Create the winding path SVG
  const pathData = learningPaths.map((node, index) => {
    if (index === 0) return `M ${node.position.x + 50} ${node.position.y + 50}`;
    const prev = learningPaths[index - 1];
    const current = node;
    
    // Create smooth curves between nodes
    const midX = (prev.position.x + current.position.x) / 2;
    const midY = (prev.position.y + current.position.y) / 2;
    
    return `Q ${midX + 50} ${midY + 50} ${current.position.x + 50} ${current.position.y + 50}`;
  }).join(' ');

  const getNodeSize = (size: string) => {
    switch (size) {
      case 'small': return 'w-12 h-12';
      case 'medium': return 'w-16 h-16';
      case 'large': return 'w-20 h-20';
      default: return 'w-16 h-16';
    }
  };

  const getNodeStyle = (node: LearningNode) => {
    const baseClasses = `absolute rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${getNodeSize(node.size)}`;
    
    if (node.status === 'completed') {
      return `${baseClasses} bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:scale-110 hover:shadow-xl`;
    } else if (node.status === 'current') {
      return `${baseClasses} bg-gradient-to-r ${node.color} text-white animate-pulse hover:scale-110 hover:shadow-xl`;
    } else {
      return `${baseClasses} bg-gray-300 text-gray-500 hover:bg-gray-400`;
    }
  };

  const renderNode = (node: LearningNode, index: number) => (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={getNodeStyle(node)}
      style={{ 
        left: `${node.position.x}px`, 
        top: `${node.position.y}px`,
        zIndex: hoveredNode === node.id ? 20 : 10
      }}
      onClick={() => node.status !== 'locked' && setSelectedPath(node.id)}
      onMouseEnter={() => setHoveredNode(node.id)}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {node.status === 'completed' ? (
        <CheckCircle className="w-6 h-6" />
      ) : node.status === 'locked' ? (
        <Lock className="w-4 h-4" />
      ) : (
        node.icon
      )}
      
      {/* Progress ring for current lessons */}
      {node.status === 'current' && node.progress && (
        <div className="absolute inset-0 rounded-full">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeDasharray={`${node.progress * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
      
      {/* XP badge */}
      {node.status !== 'locked' && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {node.xp}
        </div>
      )}
      
      {/* Hover tooltip */}
      {hoveredNode === node.id && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-30"
        >
          {node.title}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </motion.div>
      )}
    </motion.div>
  );

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
                <span className="font-medium">1,240 XP</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="font-medium">7 Day Streak</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Learning Path */}
          <div className="xl:col-span-3">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600 mb-4">
                Continue your journey and unlock new social-emotional skills
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-gray-600">Locked</span>
                </div>
              </div>
            </div>

            {/* Duolingo-style Learning Path */}
            <div className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
              <div 
                className="relative"
                style={{ 
                  height: '3000px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 25%, #fdf2f8 50%, #f0f9ff 75%, #f3e8ff 100%)'
                }}
              >
                {/* Winding Path SVG */}
                <svg 
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 140 3000"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="25%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="75%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="10,5"
                    opacity="0.6"
                    filter="url(#glow)"
                  />
                </svg>

                {/* Decorative Elements */}
                <div className="absolute top-20 right-10 text-6xl opacity-20">🌟</div>
                <div className="absolute top-300 left-10 text-4xl opacity-20">🎯</div>
                <div className="absolute top-600 right-20 text-5xl opacity-20">🏆</div>
                <div className="absolute top-900 left-5 text-3xl opacity-20">💫</div>
                <div className="absolute top-1200 right-15 text-4xl opacity-20">🎉</div>
                <div className="absolute top-1500 left-20 text-5xl opacity-20">🌈</div>
                <div className="absolute top-1800 right-10 text-4xl opacity-20">🚀</div>
                <div className="absolute top-2100 left-10 text-6xl opacity-20">✨</div>
                <div className="absolute top-2400 right-20 text-5xl opacity-20">🎈</div>
                <div className="absolute top-2700 left-15 text-7xl opacity-20">🎊</div>

                {/* Learning Nodes */}
                {learningPaths.map((node, index) => renderNode(node, index))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Progress */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Progress Overview</h3>
                    <p className="text-sm text-gray-600">Your learning journey</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Lessons</span>
                    <span className="font-semibold text-gray-900">15/25</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>3 milestones reached</span>
                    <span>1,240 XP earned</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Lesson */}
            {selectedPath && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Current Lesson</h3>
                      <p className="text-sm text-gray-600">
                        {learningPaths.find(p => p.id === selectedPath)?.title}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleStartChat}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            )}

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
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Skills Overview */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Skills You'll Learn</h3>
                <div className="space-y-2">
                  {skills.slice(0, 8).map((skill, index) => (
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
                <div className="flex items-center space-x-2">
                  <Gem className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">+250 XP Bonus</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
