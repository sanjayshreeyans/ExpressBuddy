/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./App.scss";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import MainInterfaceWithAvatar from "./components/main-interface/MainInterfaceWithAvatar";
import MainInterfaceWithVideoAvatar from "./components/main-interface/MainInterfaceWithVideoAvatar";
import LandingPage from "./components/landing-page/LandingPage";

import LearningPathHome from "./components/home/LearningPathHome";
import AuthPage from "./components/auth/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import OnboardingPage from "./components/auth/OnboardingPage";
import VideoAvatarDemo from "./components/demo/VideoAvatarDemo";
import TTSIntegrationTest from "./components/emotion-detective/TTSIntegrationTest";
import TTSQuickDemo from "./components/emotion-detective/TTSQuickDemo";
import TTSVisemeTest from "./components/emotion-detective/TTSVisemeTest";
import EmotionDetectionDemo from "./components/emotion-detective/EmotionDetectionDemo";
import EmotionMirroringDemo from "./components/emotion-detective/EmotionMirroringDemo";
import { EmotionDetectiveLearning, QuestionTypesDemo, ProgressTrackingDemo } from "./components/emotion-detective";
import { LiveClientOptions } from "./types";
import { StagewiseToolbar } from "@stagewise/toolbar-react";
import { ReactPlugin } from "@stagewise-plugins/react";
import { useEffect } from "react";
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { UserProvider, useUser } from "./contexts/UserContext";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function AppContent() {
  const { isAuthenticated, isLoading: kindeLoading } = useKindeAuth();
  const { child, loading: userLoading, isFirstTimeUser } = useUser();

  useEffect(() => {
    // Handle redirects after authentication
    if (isAuthenticated && !userLoading && !kindeLoading) {
      const currentPath = window.location.pathname;
      
      if (currentPath === '/login') {
        if (isFirstTimeUser) {
          window.location.href = '/onboarding';
        } else if (child) {
          window.location.href = '/dashboard';
        }
      }
    }
  }, [isAuthenticated, child, isFirstTimeUser, userLoading, kindeLoading]);

  // Do not block demo/public routes with auth loading spinners
  const publicPaths = ['/', '/video-avatar-demo', '/emotion-detective'];
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (!publicPaths.includes(currentPath) && (kindeLoading || userLoading)) {
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
    <Router>
      <Routes>
        {/* Default route - redirect straight to Video Avatar Demo */}
        <Route path="/" element={<Navigate to="/video-avatar-demo" replace />} />

        {/* Authentication - Public Route (kept for completeness) */}
        <Route path="/login" element={<AuthPage />} />

        {/* Onboarding - Semi-Protected Route (authenticated but no profile) */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiresProfile={true}>
            <LearningPathHome />
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute requiresProfile={true}>
            <>
              <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
              <LiveAPIProvider options={apiOptions}>
                <MainInterfaceWithAvatar />
              </LiveAPIProvider>
            </>
          </ProtectedRoute>
        } />

        {/* Video Avatar Chat - Public Demo Route */}
        <Route path="/video-avatar-demo" element={
          <>
            {/* Integrated toolbar only; moved demo nav button into header of the interface */}
            <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
            <LiveAPIProvider options={apiOptions}>
              <MainInterfaceWithVideoAvatar onGoToLanding={() => window.location.href = '/'} />
            </LiveAPIProvider>
          </>
        } />

        {/* TTS Quick Demo - Development Route */}
        <Route path="/demo-tts" element={
          <ProtectedRoute>
            <TTSQuickDemo />
          </ProtectedRoute>
        } />

        {/* TTS Integration Test - Development Route */}
        <Route path="/test-tts" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <TTSIntegrationTest />
            </div>
          </ProtectedRoute>
        } />

        {/* TTS Viseme Test - Development Route */}
        <Route path="/test-visemes" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <TTSVisemeTest />
            </div>
          </ProtectedRoute>
        } />

        {/* Emotion Detection Demo - Development Route */}
        <Route path="/demo-emotion" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <EmotionDetectionDemo />
            </div>
          </ProtectedRoute>
        } />

        {/* Emotion Detective Learning - Public Demo Route */}
        <Route path="/emotion-detective" element={
          <EmotionDetectiveLearning
            lessonId="emotion-detective-level-1"
            childId="current-child"
            onComplete={(results) => {
              console.log('Lesson completed:', results);
              // Navigate back to dashboard after completion
              window.location.href = '/dashboard';
            }}
          />
        } />

        {/* Question Types Demo - Development Route */}
        <Route path="/demo-questions" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <QuestionTypesDemo />
            </div>
          </ProtectedRoute>
        } />

        {/* Emotion Mirroring - Production Route */}
        <Route path="/emotion-mirroring" element={
          <ProtectedRoute requiresProfile={true}>
            <EmotionMirroringDemo />
          </ProtectedRoute>
        } />

        {/* Progress Tracking Demo - Development Route */}
        <Route path="/demo-progress" element={
          <ProtectedRoute>
            <ProgressTrackingDemo />
          </ProtectedRoute>
        } />

        {/* Catch all route - redirect to demo */}
        <Route path="*" element={<Navigate to="/video-avatar-demo" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <KindeProvider
      clientId="0531b02ab7864ba89c419db341727945"
      domain="https://mybuddy.kinde.com"
      redirectUri="http://localhost:3000/dashboard"
      logoutUri="http://localhost:3000"
    >
      <SupabaseProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </SupabaseProvider>
    </KindeProvider>
  );
}

export default App;
