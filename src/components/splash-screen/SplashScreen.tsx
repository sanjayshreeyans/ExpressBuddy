
import React from 'react';
import './splash-screen.scss';

const SplashScreen = () => {
  return (
    <div className="splash-screen bg-gradient-to-br from-primary-light to-primary">
      <div className="splash-screen-content animate-bounce-in">
        <div className="logo-container animate-float">
          {/* Replace with your actual logo */}
          <svg
            className="w-24 h-24 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mt-6">ExpressBuddy</h1>
        <p className="text-white mt-2">Your learning adventure is about to begin!</p>
        <div className="loading-dots mt-8">
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
