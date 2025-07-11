/**
 * ExpressBuddy Landing Page
 * Built with Tailwind CSS and shadcn/ui components
 */

import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface LandingPageProps {
  onStartChat: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onStartChat, onSignIn }: LandingPageProps) {
  const features = [
    'Emotion Recognition',
    'Problem Solving', 
    'Social Conversations'
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] font-[var(--font-family-primary)]">
      {/* Header Navigation */}
      <header className="w-full bg-[var(--surface)] shadow-[var(--shadow-sm)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-full flex items-center justify-center animate-float">
                <span className="text-white font-bold text-lg">🐼</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">ExpressBuddy</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                Home
              </a>
              <a href="#about" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                About
              </a>
              <a href="#contact" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            {/* Main Headline */}
            <div className="space-y-4 animate-bounce-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight">
                Help Your Child Master
                <br />
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] bg-clip-text text-transparent">
                  Social & Emotional Skills
                </span>
              </h1>
            </div>

            {/* Pico Avatar Section */}
            <div className="flex justify-center my-12">
              <Card className="card-playful max-w-sm animate-wiggle">
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="text-6xl animate-float">🐼</div>
                  <div className="text-4xl">😊</div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">PICO</h3>
                    <p className="text-white/90 text-sm">Your AI Learning Companion</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              AI-powered learning companion
              <br />
              for ages 3-8
            </p>

            {/* Features List */}
            <div className="space-y-4 my-12">
              {features.map((feature, index) => (
                <div 
                  key={feature}
                  className="flex items-center justify-center space-x-3 animate-bounce-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="w-6 h-6 bg-[var(--success)] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-lg md:text-xl text-[var(--text-primary)] font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="space-y-6 pt-8">
              <Button
                onClick={onStartChat}
                className="btn-primary text-lg px-12 py-6 transform hover:scale-105 transition-all duration-300 shadow-[var(--shadow-playful)] animate-bounce-in"
                style={{ animationDelay: '0.6s' }}
              >
                START FREE TRIAL
              </Button>

              <div className="space-y-2">
                <p className="text-[var(--text-muted)] text-sm">
                  Already have account?
                </p>
                <button
                  onClick={onSignIn}
                  className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            © 2025 ExpressBuddy. Helping children develop social and emotional skills through AI-powered conversations.
          </p>
        </div>
      </footer>
    </div>
  );
}
