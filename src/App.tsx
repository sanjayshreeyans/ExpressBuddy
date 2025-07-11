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
import { LiveClientOptions } from "./types";
import { StagewiseToolbar } from "@stagewise/toolbar-react";
import { ReactPlugin } from "@stagewise-plugins/react";
import SplashScreen from "./components/splash-screen/SplashScreen";
import { useEffect, useState } from "react";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'chat'>('landing');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // Show splash for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleStartChat = () => {
    setCurrentScreen('chat');
  };

  const handleSignIn = () => {
    // For now, just navigate to chat - implement sign in later
    setCurrentScreen('chat');
  };

  const handleGoToLanding = () => {
    setCurrentScreen('landing');
  };

  return (
    <div className="App">
      {showSplash ? (
        <SplashScreen />
      ) : currentScreen === 'landing' ? (
        <LandingPage 
          onStartChat={handleStartChat}
          onSignIn={handleSignIn}
        />
      ) : (
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

export default App;