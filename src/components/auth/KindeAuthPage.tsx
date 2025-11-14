/**
 * Simple Kinde Authentication Component
 * Following the exact Kinde guide implementation
 */

import React from 'react';
// @ts-ignore
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface KindeAuthPageProps {
  onBack: () => void;
}

export default function KindeAuthPage({ onBack }: KindeAuthPageProps) {
  const { login, register, isAuthenticated, isLoading, user } = useKindeAuth();

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

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome!</CardTitle>
            <p className="text-gray-600">You are successfully signed in</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Hello {user.given_name}!</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            )}
            <Button onClick={onBack} className="w-full">
              Continue to ExpressBuddy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
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
          className="flex items-center gap-2 hover:bg-white/20 rounded-full px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </motion.div>

      <div className="flex min-h-screen items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome to ExpressBuddy
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Sign in to start your child's learning journey with Pico
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Kinde Auth Buttons - Following exact guide */}
              <Button 
                onClick={() => register()} 
                type="button"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Register
              </Button>
              
              <Button 
                onClick={() => login()} 
                type="button"
                variant="outline"
                size="lg"
                className="w-full border-gray-300 hover:bg-gray-50 py-3 rounded-xl transition-all duration-300"
              >
                Log In
              </Button>

              {/* Features */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-center space-x-6 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>COPPA Compliant</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Privacy First</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
