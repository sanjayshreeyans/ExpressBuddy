import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Plane, Puzzle, Smile, Sparkles, Heart, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { cn } from '../../lib/utils';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '../ui/navigation-menu';

const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

const navLinks = [
  { label: 'About', href: '#hero' },
  { label: 'Pricing', href: '#features' },
  { label: 'Support', href: '#footer' },
];

const featureCards = [
  {
    title: 'Emotion Detective',
    description: 'Guided missions that help children read and respond to emotions.',
    icon: Smile,
    iconClass: 'bg-[#f1a501]/15 text-[#f1a501]',
    cardClass: 'bg-white text-[#5e6282]',
    headingClass: 'text-[#1e1d4c]',
  },
  {
    title: "Pico's Challenges",
    description: 'Interactive problem-solving adventures with your ExpressBuddy coach.',
    icon: Puzzle,
    iconClass: 'bg-white/15 text-white',
    cardClass: 'bg-gradient-to-b from-[#ffae43] via-[#ff946d] to-[#ff7d68] text-white shadow-[0_120px_150px_-100px_rgba(223,105,81,0.45)]',
    headingClass: 'text-white',
    featured: true,
  },
  {
    title: 'Practice Conversations',
    description: 'Rehearse everyday dialogue with real-time feedback and encouragement.',
    icon: MessageCircle,
    iconClass: 'bg-[#6246e5]/15 text-[#6246e5]',
    cardClass: 'bg-white text-[#5e6282]',
    headingClass: 'text-[#1e1d4c]',
  },
];

const picoFeatures = [
  {
    title: 'Always Patient',
    description: 'Pico never rushes and creates a safe, judgment-free space for learning.',
    icon: Heart,
    gradient: 'from-[#ff7d68] to-[#ffae43]',
  },
  {
    title: 'Smart & Adaptive',
    description: 'Learns from each interaction to personalize the experience for every child.',
    icon: Brain,
    gradient: 'from-[#6246e5] to-[#b052f4]',
  },
  {
    title: 'Encouraging Mentor',
    description: 'Celebrates progress and provides gentle guidance through every challenge.',
    icon: Sparkles,
    gradient: 'from-[#f1a501] to-[#ff946d]',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSupabaseAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleTryDemo = () => navigate('/video-avatar-demo');

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#39425d]">
      <header className="border-b border-slate-100 bg-white">
        <div className={`${containerClass} flex flex-wrap items-center justify-between gap-4 py-6`}>
          <span className="font-['Volkhov',serif] text-2xl font-bold text-[#181e4b]">ExpressBuddy</span>
          <div className="flex flex-wrap items-center gap-6">
            <NavigationMenu className="flex items-center">
              <NavigationMenuList className="flex items-center gap-6 font-['Poppins',sans-serif] text-sm font-medium text-[#212832]">
                {navLinks.map((link) => (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuLink
                      href={link.href}
                      className="transition hover:text-[#1e88e5]"
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <button
              className="font-['Poppins',sans-serif] text-sm font-medium text-[#212832] transition hover:text-[#1e88e5]"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <Button
              variant="outline"
              className="h-10 rounded-full border border-[#1e88e5] px-6 font-['Poppins',sans-serif] text-sm font-medium text-[#1e88e5] hover:bg-[#1e88e5] hover:text-white"
              onClick={handleGetStarted}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section id="hero" className="relative overflow-hidden bg-white">
          <div className="absolute -right-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-[#fff1da] blur-[1px]" />
          <div className="absolute right-16 top-24 h-40 w-40 rounded-full bg-[#f8d698]/70 blur-2xl" />
          <div className={`${containerClass} grid gap-12 py-16 lg:grid-cols-2 lg:items-center`}>
            <div className="space-y-6">
              <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.35em] text-[#df6951]">
                Pico AI
              </p>
              <h1 className="font-['Volkhov',serif] text-[46px] leading-tight text-[#181e4b] sm:text-[60px] sm:leading-[68px]">
                Help young voices grow confident every day.
              </h1>
              <p className="max-w-xl font-['Poppins',sans-serif] text-lg leading-[30px] text-[#5e6282]">
                Personalized, encouraging AI conversations that make it easy for children to practice social skills.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 rounded-[10px] bg-[#f1a501] px-8 font-['Poppins',sans-serif] text-sm font-semibold text-white shadow-[0_22px_40px_-20px_rgba(241,165,1,0.75)] hover:bg-[#ffbb37]"
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-[10px] border border-[#1e88e5] px-8 font-['Poppins',sans-serif] text-sm font-semibold text-[#1e88e5] hover:bg-[#e3f2fd]"
                  onClick={handleTryDemo}
                >
                  Try Demo
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <Card className="relative w-full max-w-md overflow-hidden rounded-[36px] border-none bg-gradient-to-b from-white via-[#f9f3ff] to-[#ffe8d6] shadow-[0_60px_120px_-80px_rgba(24,30,75,0.55)]">
                <CardContent className="p-6">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/50 shadow-[0_35px_90px_-65px_rgba(24,30,75,0.55)]" style={{ height: '500px', minHeight: '500px' }}>
                    <VideoExpressBuddyAvatar
                      className="h-full w-full"
                      isListening={false}
                      hideDebugInfo
                      disableClickInteraction
                      backgroundSrc=""
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>

      <footer id="footer" className="border-t border-slate-200 bg-white py-8">
        <div className={`${containerClass} flex flex-wrap items-center justify-center gap-4 font-['Poppins',sans-serif] text-sm text-[#5e6282]`}>
          <span>ExpressBuddy © {new Date().getFullYear()}</span>
          <span className="hidden sm:block">•</span>
          <a href="/privacy" className="hover:text-[#1e88e5]">Privacy</a>
          <span className="hidden sm:block">•</span>
          <a href="/terms" className="hover:text-[#1e88e5]">Terms</a>
          <span className="hidden sm:block">•</span>
          <a href="mailto:support@expressbuddy.ai" className="hover:text-[#1e88e5]">Contact</a>
        </div>
      </footer>
    </div>
  );
}
