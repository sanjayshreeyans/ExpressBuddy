/**
 * ExpressBuddy Landing Page
 * Built with Tailwind CSS and goodStyles.css
 */

import React from 'react';

interface LandingPageProps {
  onStartChat: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onStartChat, onSignIn }: LandingPageProps) {
  const features = [
    {
      title: 'Emotion Recognition',
      description: 'Helps children identify and understand their feelings through AI-powered emotion detection'
    },
    {
      title: 'Problem Solving',
      description: 'Interactive challenges that build critical thinking and decision-making skills'
    },
    {
      title: 'Social Conversations',
      description: 'Practice real conversations in a safe, supportive environment with Pico'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  ExpressBuddy
                </h1>
                <p className="text-sm text-gray-500 font-medium">AI Learning Companion</p>
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary font-medium transition-colors duration-300">
                Features
              </a>
              <a href="#about" className="text-gray-600 hover:text-primary font-medium transition-colors duration-300">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-primary font-medium transition-colors duration-300">
                Contact
              </a>
              <button 
                onClick={onSignIn}
                className="inline-flex items-center justify-center px-6 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium rounded-lg transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-light to-secondary-light">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="text-gray-900">Help Your Child</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-primary-dark to-secondary bg-clip-text text-transparent">
                    Master Emotions
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  AI-powered learning companion that helps children ages 3-8 develop 
                  <span className="text-primary font-semibold"> social and emotional skills</span> through 
                  interactive conversations and play.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={onStartChat}
                  className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white text-xl px-12 py-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Start Free Trial
                </button>
                <button
                  className="inline-flex items-center justify-center text-lg px-8 py-6 rounded-2xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-primary rounded-full"></span>
                  <span>Free 7-day trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-primary rounded-full"></span>
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Right Content - Pico Avatar */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* Main Avatar Card */}
                <div className="bg-gradient-to-br from-primary to-primary-dark w-80 h-96 flex items-center justify-center transform hover:scale-105 transition-all duration-500 shadow-2xl rounded-xl">
                  <div className="text-center space-y-6 p-8">
                    <div className="relative">
                      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <div className="text-6xl">🤖</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">Meet Pico!</h3>
                      <p className="text-white/90 text-lg">Your friendly AI companion</p>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-yellow-300 rounded-full"></div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 bg-secondary-dark rounded-full"></div>
                </div>
                <div className="absolute top-1/2 -right-8 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-4 h-4 bg-pink-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900">
              Why Choose <span className="text-primary">ExpressBuddy</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI companion uses proven techniques to help children develop essential life skills through fun, interactive experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-100 hover:border-primary/30 p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <div className="text-3xl text-white">
                      {index === 0 ? '❤️' : index === 1 ? '🧩' : '💬'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary-light to-secondary-light">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8 space-y-8">
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900">
            Ready to start your child's
            <br />
            <span className="text-primary">emotional learning journey?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of families who trust ExpressBuddy to help their children develop confidence, empathy, and social skills.
          </p>
          <div className="space-y-4">
            <button
              onClick={onStartChat}
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white text-2xl px-16 py-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Start Your Free Trial
            </button>
            <p className="text-sm text-gray-500">
              No credit card required • Cancel anytime • Safe & secure
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold">ExpressBuddy</h3>
              </div>
              <p className="text-gray-400">
                Empowering children through AI-powered emotional learning and social skill development.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-gray-400">
                <button className="block hover:text-white transition-colors text-left">Features</button>
                <button className="block hover:text-white transition-colors text-left">Pricing</button>
                <button className="block hover:text-white transition-colors text-left">Support</button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-400">
                <button className="block hover:text-white transition-colors text-left">About</button>
                <button className="block hover:text-white transition-colors text-left">Blog</button>
                <button className="block hover:text-white transition-colors text-left">Careers</button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-gray-400">
                <button className="block hover:text-white transition-colors text-left">Privacy</button>
                <button className="block hover:text-white transition-colors text-left">Terms</button>
                <button className="block hover:text-white transition-colors text-left">Security</button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ExpressBuddy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
