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
import LandingPage from "./components/landing-page/LandingPage";

import LearningPathHome from "./components/home/LearningPathHome";
import AuthPage from "./components/auth/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import TTSIntegrationTest from "./components/emotion-detective/TTSIntegrationTest";
import TTSQuickDemo from "./components/emotion-detective/TTSQuickDemo";
import { LiveClientOptions } from "./types";
import { StagewiseToolbar } from "@stagewise/toolbar-react";
import { ReactPlugin } from "@stagewise-plugins/react";
import { useEffect } from "react";
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function AppContent() {
  const { isAuthenticated, isLoading } = useKindeAuth();

  useEffect(() => {
    // Redirect to dashboard after authentication
    if (isAuthenticated && window.location.pathname === '/login') {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

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
    <Router>
      <Routes>
        {/* Landing Page - Public Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication - Public Route */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <LearningPathHome />
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <>
              <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
              <LiveAPIProvider options={apiOptions}>
                <MainInterfaceWithAvatar />
              </LiveAPIProvider>
            </>
          </ProtectedRoute>
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
        
        {/* Catch all route - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
      <AppContent />
    </KindeProvider>
  );
}

export default App;
