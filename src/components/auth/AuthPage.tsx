/**
 * Authentication Page Component
 * Integrated with Kinde authentication and shadcn/ui sign-in component
 */

import React, { useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-react/dist/components';
import { useRive } from '@rive-app/react-canvas';
import { SignInPage } from '../ui/sign-in';
import { Button } from '../ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthPageProps {
  onBack: () => void;
  mode?: 'signin' | 'signup';
}

export default function AuthPage({ onBack, mode = 'signin' }: AuthPageProps) {
  const { login, register, isAuthenticated, isLoading } = useKindeAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(mode);

  // Rive animation for Pico
  const { RiveComponent } = useRive({
    src: '/pandabot.riv',
    autoplay: true,
    stateMachines: 'State Machine 1',
  });

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleCreateAccount = async () => {
    try {
      await register();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleResetPassword = () => {
    // Implement password reset logic
    console.log('Password reset requested');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-6 left-6 z-10"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </motion.div>

      {/* Sign In Page with Pico on the right */}
      <SignInPage
        title={
          authMode === 'signin' ? (
            <span className="font-light text-gray-900 tracking-tighter">Welcome Back</span>
          ) : (
            <span className="font-light text-gray-900 tracking-tighter">Join ExpressBuddy</span>
          )
        }
        description={
          authMode === 'signin' 
            ? "Sign in to continue your child's learning journey with Pico"
            : "Create your account and start your child's specialized learning path"
        }
        heroImageSrc="/api/placeholder/600/800"
        testimonials={[
          {
            avatarSrc: "/api/placeholder/40/40",
            name: "Sarah M.",
            handle: "@sarahm_mom",
            text: "ExpressBuddy has been amazing for my son with autism. He loves talking to Pico!"
          },
          {
            avatarSrc: "/api/placeholder/40/40",
            name: "Michael R.",
            handle: "@mike_dad",
            text: "The speech therapy games have helped my daughter build confidence."
          }
        ]}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={authMode === 'signin' ? () => setAuthMode('signup') : handleCreateAccount}
      />

      {/* Custom Right Side with Pico */}
      <div className="hidden md:block fixed right-0 top-0 w-1/2 h-full bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="h-full flex flex-col items-center justify-center p-8">
          {/* Pico Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mb-8"
          >
            <div className="w-80 h-80 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-gray-200">
              <div className="w-64 h-64">
                {RiveComponent && (
                  <RiveComponent 
                    width="100%" 
                    height="100%"
                    style={{ borderRadius: '24px' }}
                  />
                )}
              </div>
            </div>
            
            {/* Floating Animation Elements */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center space-y-4"
          >
            <h3 className="text-3xl font-bold text-gray-900">Meet Pico!</h3>
            <p className="text-lg text-gray-700 max-w-md">
              Your child's AI learning companion, ready to help them master social skills through fun, interactive conversations.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Autism Support</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Speech Therapy</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Social Skills</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
