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
import { lazy, Suspense, useEffect } from "react";
import { SupabaseAuthProvider, useSupabaseAuth } from "./contexts/SupabaseAuthContext";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { UserProvider, useUser } from "./contexts/UserContext";
import { LiveClientOptions } from "./types";

// Lazy load components for code splitting (70-80% bundle size reduction)
const MainInterfaceWithAvatar = lazy(() => import("./components/main-interface/MainInterfaceWithAvatar"));
const MainInterfaceWithVideoAvatar = lazy(() => import("./components/main-interface/MainInterfaceWithVideoAvatar"));
const PicoChallengeInterface = lazy(() => import("./components/pico-challenges/PicoChallengeInterface"));
const ChallengesHub = lazy(() => import("./components/pico-challenges/ChallengesHub"));
const LandingPage = lazy(() => import("./components/landing-page/LandingPage"));
const LearningPathHome = lazy(() => import("./components/home/LearningPathHome"));
const AuthPage = lazy(() => import("./components/auth/AuthPage"));
const ProtectedRoute = lazy(() => import("./components/auth/ProtectedRoute"));
const OnboardingPage = lazy(() => import("./components/auth/OnboardingPage"));
const VideoAvatarDemo = lazy(() => import("./components/demo/VideoAvatarDemo"));
const EmotionDetectionDemo = lazy(() => import("./components/emotion-detective/EmotionDetectionDemo"));
const EmotionMirroringDemo = lazy(() => import("./components/emotion-detective/EmotionMirroringDemo"));
const EmotionDetectiveLearning = lazy(() => import("./components/emotion-detective").then(m => ({ default: m.EmotionDetectiveLearning })));
const QuestionTypesDemo = lazy(() => import("./components/emotion-detective").then(m => ({ default: m.QuestionTypesDemo })));
const ProgressTrackingDemo = lazy(() => import("./components/emotion-detective").then(m => ({ default: m.ProgressTrackingDemo })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const { child, loading: userLoading, isFirstTimeUser } = useUser();

  useEffect(() => {
    // Handle redirects after authentication
    if (isAuthenticated && !userLoading && !authLoading) {
      const currentPath = window.location.pathname;

      if (currentPath === '/login') {
        if (isFirstTimeUser) {
          window.location.href = '/onboarding';
        } else if (child) {
          window.location.href = '/dashboard';
        }
      }
    }
  }, [isAuthenticated, child, isFirstTimeUser, userLoading, authLoading]);

  // Do not block public routes with auth loading spinners
  const publicPaths = ['/', '/login', '/video-avatar-demo', '/emotion-detective'];
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  if (!publicPaths.includes(currentPath) && (authLoading || userLoading)) {
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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Default route - Landing Page */}
          <Route path="/" element={<LandingPage />} />

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
              <LiveAPIProvider options={apiOptions}>
                <MainInterfaceWithVideoAvatar onGoToLanding={() => window.location.href = '/'} />
              </LiveAPIProvider>
            </>
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

          {/* Pico Challenges Hub - Selection Page */}
          <Route path="/Pico-challenges" element={
            <>
              <LiveAPIProvider options={apiOptions}>
                <ChallengesHub />
              </LiveAPIProvider>
            </>
          } />

          {/* Pico Challenge - Dynamic Route for All Challenges */}
          <Route path="/Pico-challenge/:id" element={
            <>
              <LiveAPIProvider options={apiOptions}>
                <PicoChallengeInterface />
              </LiveAPIProvider>
            </>
          } />

          {/* Pico Challenge - Restaurant Ordering Level 1 - Legacy Route (for backwards compatibility) */}
          <Route path="/Pico-challenge/restaurant-ordering-level1" element={
            <>
              <LiveAPIProvider options={apiOptions}>
                <PicoChallengeInterface />
              </LiveAPIProvider>
            </>
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

          {/* Catch all route - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <SupabaseAuthProvider>
      <SupabaseProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </SupabaseProvider>
    </SupabaseAuthProvider>
  );
}

export default App;
