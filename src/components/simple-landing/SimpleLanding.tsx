/**
 * ExpressBuddy Simple Landing Page
 * Clean welcome screen with sign in functionality
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Heart, Play } from 'lucide-react';

export default function SimpleLanding() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSupabaseAuth();

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleStartChat = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo and Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to ExpressBuddy
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-600 leading-relaxed"
        >
          Sign in to start your child's learning journey with personalized AI support
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          <Button
            onClick={handleSignIn}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Sign In
          </Button>
          
          <Button
            onClick={handleSignIn}
            variant="outline"
            size="lg"
            className="w-full text-lg py-6 rounded-2xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
          >
            Sign Up
          </Button>
        </motion.div>

        {/* Quick Demo Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            onClick={handleStartChat}
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300"
          >
            <Play className="w-4 h-4 mr-2" />
            Try Demo (No Sign-up Required)
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
