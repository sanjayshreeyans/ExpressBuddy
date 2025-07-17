import React, { useState } from 'react';
import { RealtimeExpressBuddyAvatar } from '../avatar/RealtimeExpressBuddyAvatar';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { SpeakerIcon } from './SpeakerIcon';

/**
 * Quick TTS Demo - Simple test interface for TTS + Pico Avatar integration
 */
export const TTSQuickDemo: React.FC = () => {
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });
  const [inputText, setInputText] = useState('Hello! I am Pico, your emotion detective buddy. Type something for me to say!');
  const [riveInputs, setRiveInputs] = useState<any>(null);

  // Get visemes and subtitles directly from the TTS state
  const visemes = ttsState.visemes;
  const subtitles = ttsState.subtitles;
  const currentSubtitle = ttsState.currentSubtitle;

  // Update TTS system with Rive inputs when they become available
  React.useEffect(() => {
    if (riveInputs) {
      console.log('🎯 TTSQuickDemo: Updating TTS system with Rive inputs');
      ttsActions.updateRiveInputs(riveInputs);
    }
  }, [riveInputs, ttsActions]);

  const handleSpeak = async () => {
    if (!inputText.trim()) return;

    try {
      await ttsActions.speak({ text: inputText.trim() });
    } catch (error) {
      console.error('Error speaking:', error);
    }
  };

  const handleStop = () => {
    ttsActions.stop();
  };

  const quickTexts = [
    "Hello! I'm Pico, your friendly emotion detective!",
    "What emotion is this person showing?",
    "Great job! You're getting really good at recognizing emotions!",
    "Let's try another emotion. Can you guess what this person is feeling?",
    "Emotions help us understand how people are feeling inside."
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              🎤 TTS + Pico Avatar Quick Demo
              <div className="flex gap-2">
                <Badge variant={ttsState.isConnected ? 'default' : 'secondary'}>
                  WebSocket: {ttsState.isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                <Badge variant={ttsState.isSupported ? 'default' : 'destructive'}>
                  TTS: {ttsState.isSupported ? 'Supported' : 'Not Supported'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pico Avatar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pico Avatar</h3>
                <div className="h-[40rem] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  <RealtimeExpressBuddyAvatar
                    className="w-full h-full"
                    visemes={visemes}
                    subtitles={subtitles}
                    onCurrentSubtitleChange={(subtitle) => {
                      // The subtitle is already handled by the TTS hook
                      console.log('Current subtitle:', subtitle);
                    }}
                    onRiveInputsReady={setRiveInputs}
                  />
                </div>

                {/* Subtitle Display */}
                <div className="min-h-[4rem] p-4 bg-white rounded-lg border-2 border-blue-200">
                  <p className="text-center text-lg font-medium text-blue-800">
                    {currentSubtitle || ttsState.currentSubtitle || '💬 Subtitles will appear here...'}
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant={ttsState.isPlaying ? 'default' : 'outline'} className="justify-center py-2">
                    {ttsState.isPlaying ? '🔴 Speaking' : '⚪ Ready'}
                  </Badge>
                  <Badge variant={visemes.length > 0 ? 'default' : 'outline'} className="justify-center py-2">
                    Visemes: {visemes.length}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Text Input</h3>

                {/* Text Input */}
                <div className="space-y-3">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type something for Pico to say..."
                    className="min-h-[120px] text-base"
                    disabled={ttsState.isPlaying}
                  />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSpeak}
                      disabled={!inputText.trim() || ttsState.isPlaying || !ttsState.isSupported}
                      size="lg"
                      className="flex-1"
                    >
                      {ttsState.isPlaying ? '🎤 Speaking...' : '🎤 Speak Text'}
                    </Button>
                    <Button
                      onClick={handleStop}
                      disabled={!ttsState.isPlaying}
                      variant="outline"
                      size="lg"
                    >
                      🛑 Stop
                    </Button>
                  </div>
                </div>

                {/* Quick Text Buttons */}
                <div className="space-y-3">
                  <h4 className="font-medium">Quick Test Phrases</h4>
                  <div className="space-y-2">
                    {quickTexts.map((text, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <SpeakerIcon
                          text={text}
                          size="sm"
                          disabled={ttsState.isPlaying}
                        />
                        <button
                          onClick={() => setInputText(text)}
                          className="text-left text-sm flex-1 hover:text-blue-600 transition-colors"
                          disabled={ttsState.isPlaying}
                        >
                          {text}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Status */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <h4 className="font-medium">System Status</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>WebSocket Server:</span>
                      <span className={ttsState.isConnected ? 'text-green-600' : 'text-red-600'}>
                        {ttsState.isConnected ? '✅ Connected (port 8000)' : '❌ Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Browser TTS:</span>
                      <span className={ttsState.isSupported ? 'text-green-600' : 'text-red-600'}>
                        {ttsState.isSupported ? '✅ Supported' : '❌ Not Supported'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Status:</span>
                      <span className={ttsState.isPlaying ? 'text-blue-600' : 'text-gray-600'}>
                        {ttsState.isPlaying ? '🎤 Speaking' : '⏸️ Idle'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {ttsState.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Error</h4>
                    <p className="text-red-700 text-sm">{ttsState.error}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">🧪 How to Test Edge TTS</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Make sure the backend server is running on port 8000</p>
                <p>2. No microphone access needed - Edge TTS generates high-quality audio directly</p>
                <p>3. Type text in the box above or click a quick phrase</p>
                <p>4. Click "Speak Text" and watch Pico's lips sync with the speech!</p>
                <p>5. Edge TTS audio is sent directly to backend for ultra-fast processing</p>
                <p>6. Subtitles should appear below the avatar in real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TTSQuickDemo;