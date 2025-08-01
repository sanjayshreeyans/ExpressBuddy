/**
 * Video Avatar Demo Page
 * Simple demo showcasing the video-based avatar without backend complexity
 */

import React, { useState, useEffect } from 'react';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import { AvatarState, PlaybackState } from '../../types/avatar';

interface VideoAvatarDemoProps {
  // Add any props if needed
}

export const VideoAvatarDemo: React.FC<VideoAvatarDemoProps> = () => {
  const [isListening, setIsListening] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [autoToggle, setAutoToggle] = useState(false);

  // Auto-toggle demo for showcasing transitions
  useEffect(() => {
    if (!autoToggle) return;

    const interval = setInterval(() => {
      setIsListening(prev => !prev);
    }, 3000); // Toggle every 3 seconds

    return () => clearInterval(interval);
  }, [autoToggle]);

  // Mock silence detection object for debug info
  const mockSilenceDetection = {
    config: { enabled: true, maxNudges: 3 },
    state: { 
      conversationState: isListening ? 'listening' : 'idle',
      nudgeCount: 0 
    }
  };

  const handleAvatarStateChange = (state: AvatarState) => {
    setAvatarState(state);
  };

  const handlePlaybackStateChange = (state: PlaybackState) => {
    setPlaybackState(state);
  };

  const handleCurrentSubtitleChange = (subtitle: string) => {
    setCurrentSubtitle(subtitle);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Video Avatar Demo
          </h1>
          <p className="text-lg text-gray-600">
            Simple video-based avatar using MP4 animations instead of Rive
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Container */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ExpressBuddy Avatar
            </h2>
            
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              <VideoExpressBuddyAvatar
                className="w-full h-full"
                isListening={isListening}
                onAvatarStateChange={handleAvatarStateChange}
                onPlaybackStateChange={handlePlaybackStateChange}
                onCurrentSubtitleChange={handleCurrentSubtitleChange}
                silenceDetection={mockSilenceDetection}
              />
            </div>

            {/* Avatar Controls */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {isListening ? '🔴 Stop Talking' : '🎤 Start Talking'}
                </button>

                <button
                  onClick={() => setAutoToggle(!autoToggle)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    autoToggle
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {autoToggle ? '⏹️ Stop Auto Demo' : '🔄 Auto Demo'}
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Click "Start Talking" to switch to talking animation</li>
                  <li>Click "Stop Talking" to return to idle animation</li>
                  <li>Enable "Auto Demo" to see automatic transitions</li>
                  <li>Click on the avatar to manually toggle states</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Status & Debug Info
            </h2>

            <div className="space-y-4">
              {/* Current State */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Current State</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Listening:</span>
                    <span className={`ml-2 font-medium ${isListening ? 'text-red-600' : 'text-green-600'}`}>
                      {isListening ? '🔴 Yes' : '⚪ No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Auto Demo:</span>
                    <span className={`ml-2 font-medium ${autoToggle ? 'text-blue-600' : 'text-gray-600'}`}>
                      {autoToggle ? '🔄 Active' : '⏸️ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar State */}
              {avatarState && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Avatar State</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 font-medium ${
                        avatarState.status === 'speaking' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {avatarState.status === 'speaking' ? '🗣️ Speaking' : '😌 Idle'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Buffering:</span>
                      <span className={`ml-2 font-medium ${
                        avatarState.isBuffering ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {avatarState.isBuffering ? '⏳ Yes' : '✅ No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Content Ready:</span>
                      <span className={`ml-2 font-medium ${
                        avatarState.hasGeneratedContent ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {avatarState.hasGeneratedContent ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Playback State */}
              {playbackState && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Playback State</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Playing:</span>
                      <span className={`ml-2 font-medium ${
                        playbackState.isPlaying ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {playbackState.isPlaying ? '▶️ Yes' : '⏸️ No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="ml-2 font-mono text-blue-600">
                        {playbackState.currentTime.toFixed(2)}s
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-mono text-blue-600">
                        {playbackState.duration.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Features</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Video-based animations (No Rive dependency)</li>
                  <li>✅ Smooth state transitions</li>
                  <li>✅ Automatic looping</li>
                  <li>✅ Click interaction</li>
                  <li>✅ Debug information</li>
                  <li>✅ No backend server required</li>
                  <li>✅ Lightweight implementation</li>
                </ul>
              </div>

              {/* Animation Files */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Animation Files</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <div>🎬 Idle: <code>Pandaalter1_2.mp4</code></div>
                  <div>🗣️ Talking: <code>PandaTalkingAnim.mp4</code></div>
                  <div>📁 Location: <code>/public/VideoAnims/</code></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAvatarDemo;
