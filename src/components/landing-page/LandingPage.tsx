/**
 * ExpressBuddy Modern Landing Page
 * Specialized learning platform for children with autism, speech delays, and social anxiety
 * Built with shadcn/ui, Tailwind CSS, and Framer Motion
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Heart, 
  Brain, 
  MessageCircle, 
  Star, 
  Play, 
  CheckCircle,
  Sparkles,
  Users,
  Shield,
  Clock,
  Target,
  Trophy,
  Zap,
  BookOpen,
  Smile,
  Camera,
  Mic,
  ChevronRight,
  ArrowRight,
  Award,
  BarChart3,
  Gamepad2,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  // Remove props since we'll use navigation
}

export default function LandingPage({}: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useSupabaseAuth();

  const handleStartChat = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };
  
  // Learning paths for ExpressBuddy
  const learningPaths = [
    {
      icon: Smile,
      title: 'Emotion Detective',
      description: 'Help children recognize and mirror facial expressions through interactive games with Pico',
      features: ['Facial expression recognition', 'Emotion identification games', 'Mirror practice sessions', 'Real-time feedback'],
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50'
    },
    {
      icon: Target,
      title: "Pico's Challenges", 
      description: 'Learn conflict resolution and problem-solving through guided scenarios with your AI companion',
      features: ['Conflict resolution scenarios', 'Decision-making practice', 'Social problem solving', 'Guided conversations'],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MessageCircle,
      title: 'Practice Conversations',
      description: 'Master turn-taking and social dialogue skills in a safe, supportive environment',
      features: ['Turn-taking practice', 'Social dialogue training', 'Conversation starters', 'Communication confidence'],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    }
  ];

  const features = [
    {
      icon: Camera,
      title: 'Real-time Video Processing',
      description: 'Advanced camera integration for facial expression analysis and real-time feedback',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Mic,
      title: 'Voice Recognition',
      description: 'Natural speech processing that understands and responds to children\'s communication',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Trophy,
      title: 'Duolingo-style Progression',
      description: 'Engaging XP points, achievements, and unlockable content to maintain motivation',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: BarChart3,
      title: 'Parent Dashboard',
      description: 'Comprehensive progress tracking and insights for parents and caregivers',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Safe Environment',
      description: 'COPPA-compliant platform designed specifically for children\'s safety and privacy',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: Gamepad2,
      title: 'Interactive Learning',
      description: 'Game-based learning that makes skill development fun and engaging',
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  const stats = [
    { icon: Users, value: '1000+', label: 'Children Helped' },
    { icon: Star, value: '95%', label: 'Parent Satisfaction' },
    { icon: Clock, value: '24/7', label: 'Available Support' },
    { icon: Award, value: '89%', label: 'Skill Improvement' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-300 to-purple-400 opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      {/* Modern Navigation Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                ExpressBuddy
              </h1>
              <p className="text-xs text-gray-600 font-medium">AI Learning Companion</p>
            </div>
          </motion.div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#learning-paths" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Learning Paths
            </a>
            <a href="#about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              About
            </a>
            <Button 
              variant="outline" 
              onClick={handleSignIn}
              className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Sign In
            </Button>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#learning-paths" className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Learning Paths
              </a>
              <a href="#about" className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                About
              </a>
              <Button 
                variant="outline" 
                onClick={handleSignIn}
                className="w-full rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="inline-flex items-center rounded-full px-4 py-2 text-sm bg-blue-50 text-blue-800 border border-blue-200 font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Specialized for Autism & Speech Delays
                </motion.div>
                
                <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
                  <span className="text-gray-900">Help Your Child</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    Master Social Skills
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-700 leading-relaxed max-w-2xl">
                  AI-powered learning companion designed specifically for children with autism, speech delays, and social anxiety. 
                  <span className="text-gray-900 font-semibold"> Three specialized learning paths</span> to build confidence and communication skills.
                </p>
              </div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button
                  onClick={handleStartChat}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Try Now!
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 rounded-2xl border-2 hover:bg-accent transition-all duration-300"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-600"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">COPPA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Evidence-Based</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Parent Dashboard</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Larger Pico Avatar */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex justify-center lg:justify-start lg:pl-8"
            >
              <div className="relative">
                {/* Main Avatar Card - Much Bigger */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-br from-white to-gray-50 w-full max-w-md lg:max-w-lg h-[450px] lg:h-[520px] flex items-center justify-center shadow-2xl rounded-3xl border border-gray-200 overflow-hidden backdrop-blur-sm"
                >
                  <div className="text-center space-y-8 p-8 relative z-10">
                    <div className="relative">
                      <div className="w-64 h-64 lg:w-72 lg:h-72 mx-auto bg-gradient-to-br from-sky-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                        <div className="text-6xl">🐼</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Meet ExpressBuddy!</h3>
                      <p className="text-gray-700 text-lg lg:text-xl">Your AI learning companion</p>
                      <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                        Specially designed to help children practice social skills through interactive conversations
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-cyan-50/30 rounded-3xl" />
                </motion.div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Star className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.div 
                  animate={{ 
                    y: [0, 15, 0],
                    rotate: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Heart className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section id="learning-paths" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-purple-50 text-purple-700 border border-purple-200 mb-6">
              <Target className="w-4 h-4 mr-2" />
              Three Specialized Learning Paths
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6">
              Personalized Learning Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Each learning path is designed by child development experts to address specific needs and build essential social-emotional skills progressively.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {learningPaths.map((path, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className={`${path.bgColor} rounded-3xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${path.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <path.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{path.title}</h3>
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                  {path.description}
                </p>
                <ul className="space-y-3">
                  {path.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Advanced AI Technology
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6">
              Cutting-Edge Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built with the latest AI technology to provide personalized, engaging, and effective learning experiences for every child.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-background rounded-3xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 lg:p-16 text-center text-white shadow-2xl"
          >
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
              Start Your Child's Journey Today
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of families using ExpressBuddy to help their children build confidence, improve communication, and develop essential social skills.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleStartChat}
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-12 py-6 rounded-2xl shadow-lg font-semibold"
              >
                <Play className="w-6 h-6 mr-3" />
                Try ExpressBuddy Now
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </motion.div>
            <p className="text-sm opacity-75 mt-6">
              Safe, secure, and designed specifically for children with special needs
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">ExpressBuddy</h3>
                  <p className="text-sm text-gray-600">AI Learning Companion</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Empowering children with autism, speech delays, and social anxiety to build confidence and master essential communication skills through AI-powered learning.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Learning Paths</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Emotion Detective</li>
                <li>Pico's Challenges</li>
                <li>Practice Conversations</li>
                <li>Parent Dashboard</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 ExpressBuddy. All rights reserved. Designed for children with special needs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
