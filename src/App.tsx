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
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import MainInterfaceWithAvatar from "./components/main-interface/MainInterfaceWithAvatar";
import LandingPage from "./components/landing-page/LandingPage";
import TestAuthPage from "./components/auth/TestAuthPage";
import { LiveClientOptions } from "./types";
import { StagewiseToolbar } from "@stagewise/toolbar-react";
import { ReactPlugin } from "@stagewise-plugins/react";
import { useEffect, useState } from "react";
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'auth' | 'chat'>('landing');
  const { isAuthenticated, isLoading } = useKindeAuth();

  useEffect(() => {
    if (isAuthenticated && currentScreen === 'auth') {
      setCurrentScreen('chat');
    }
  }, [isAuthenticated, currentScreen]);

  const handleStartChat = () => {
    if (isAuthenticated) {
      setCurrentScreen('chat');
    } else {
      setCurrentScreen('auth');
    }
  };

  const handleSignIn = () => {
    setCurrentScreen('auth');
  };

  const handleGoToLanding = () => {
    setCurrentScreen('landing');
  };

  const handleBackToLanding = () => {
    setCurrentScreen('landing');
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
    <div className="App">
      {currentScreen === 'landing' && (
        <LandingPage 
          onStartChat={handleStartChat}
          onSignIn={handleSignIn}
        />
      )}

      {currentScreen === 'chat' && (
        <>
          <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
          <LiveAPIProvider options={apiOptions}>
            <MainInterfaceWithAvatar onGoToLanding={handleGoToLanding} />
          </LiveAPIProvider>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    // <KindeProvider
    //   clientId="0531b02ab7864ba89c419db341727945"
    //   domain="https://mybuddy.kinde.com"
    //   redirectUri={window.location.origin}
    //   logoutUri={window.location.origin}
    //   useInsecureForRefreshToken={process.env.NODE_ENV === 'development'}
    // >
    //   <AppContent />
    // </KindeProvider>
  );
}

export default App;