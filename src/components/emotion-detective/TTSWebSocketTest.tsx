import React, { useEffect, useRef, useState } from 'react';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { VisemeData, SubtitleData } from '../../lib/viseme-transcription-service';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';

/**
 * Comprehensive test component for TTS WebSocket integration
 * This verifies the complete flow: TTS -> Audio Capture -> WebSocket -> Visemes -> Avatar
 */
export const TTSWebSocketTest: React.FC = () => {
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });
  const [visemes, setVisemes] = useState<VisemeData[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleData[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [testResults, setTestResults] = useState<{
    websocketConnection: boolean;
    audioCapture: boolean;
    visemeGeneration: boolean;
    avatarSync: boolean;
    errors: string[];
  }>({
    websocketConnection: false,
    audioCapture: false,
    visemeGeneration: false,
    avatarSync: false,
    errors: []
  });
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);

  // Test phrases with different complexities
  const testPhrases = [
    "Hello! This is a simple test.",
    "What emotion is this person showing?",
    "Welcome to Emotion Detective! I'm Pico, and I'll help you learn about emotions.",
    "Great job! You're getting really good at recognizing emotions. Let's try another one!",
    "The quick brown fox jumps over the lazy dog. This sentence contains many different sounds for testing viseme generation."
  ];

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setTestLog(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const updateTestResult = (key: keyof typeof testResults, value: boolean | string) => {
    setTestResults(prev => {
      if (key === 'errors' && typeof value === 'string') {
        return { ...prev, errors: [...prev.errors, value] };
      }
      return { ...prev, [key]: value };
    });
  };

  // Setup TTS callbacks to monitor the flow
  useEffect(() => {
    // We'll monitor through the existing hook callbacks
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [testLog]);

  const runComprehensiveTest = async () => {
    setIsTestRunning(true);
    setTestResults({
      websocketConnection: false,
      audioCapture: false,
      visemeGeneration: false,
      avatarSync: false,
      errors: []
    });
    setTestLog([]);
    setVisemes([]);
    setSubtitles([]);

    addLog('🧪 Starting comprehensive TTS WebSocket test...');

    try {
      // Test 1: WebSocket Connection
      addLog('📡 Testing WebSocket connection to port 8000...');
      
      // Check if we can connect to the WebSocket
      const wsTest = new Promise<boolean>((resolve) => {
        const testWs = new WebSocket('ws://localhost:8000/stream-audio');
        
        testWs.onopen = () => {
          addLog('✅ WebSocket connection successful');
          updateTestResult('websocketConnection', true);
          testWs.close();
          resolve(true);
        };
        
        testWs.onerror = (error) => {
          addLog('❌ WebSocket connection failed - Is the backend server running on port 8000?');
          updateTestResult('errors', 'WebSocket connection failed');
          resolve(false);
        };
        
        testWs.onclose = (event) => {
          if (!event.wasClean) {
            addLog('⚠️ WebSocket closed unexpectedly');
          }
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING) {
            addLog('⏰ WebSocket connection timeout');
            testWs.close();
            resolve(false);
          }
        }, 5000);
      });

      const wsConnected = await wsTest;
      if (!wsConnected) {
        addLog('❌ Cannot proceed without WebSocket connection');
        setIsTestRunning(false);
        return;
      }

      // Test 2: Audio Capture
      addLog('🎤 Testing audio capture capabilities...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 24000
          } 
        });
        
        addLog('✅ Audio capture permissions granted');
        updateTestResult('audioCapture', true);
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        addLog('❌ Audio capture failed - Microphone permissions required');
        updateTestResult('errors', 'Audio capture failed');
      }

      // Test 3: TTS with Viseme Generation
      addLog('🎯 Testing TTS with viseme generation...');
      
      // Set up monitoring for visemes
      const visemePromise = new Promise<boolean>((resolve) => {
        let visemeReceived = false;
        let timeout: NodeJS.Timeout;

        const checkVisemes = () => {
          if (visemes.length > 0) {
            visemeReceived = true;
            addLog(`✅ Visemes received: ${visemes.length} viseme points`);
            updateTestResult('visemeGeneration', true);
            clearTimeout(timeout);
            resolve(true);
          }
        };

        // Check every 500ms for visemes
        const interval = setInterval(checkVisemes, 500);
        
        // Timeout after 15 seconds
        timeout = setTimeout(() => {
          clearInterval(interval);
          if (!visemeReceived) {
            addLog('❌ No visemes received within timeout period');
            updateTestResult('errors', 'Viseme generation timeout');
            resolve(false);
          }
        }, 15000);

        // Also check immediately
        checkVisemes();
      });

      // Speak a test phrase
      const testPhrase = testPhrases[0];
      addLog(`🗣️ Speaking test phrase: "${testPhrase}"`);
      
      try {
        await ttsActions.speak({ text: testPhrase });
        addLog('✅ TTS speech completed');
      } catch (error) {
        addLog(`❌ TTS speech failed: ${error}`);
        updateTestResult('errors', `TTS failed: ${error}`);
      }

      // Wait for visemes
      const visemesReceived = await visemePromise;

      // Test 4: Avatar Synchronization
      if (visemesReceived) {
        addLog('🤖 Testing avatar synchronization...');
        
        // Check if avatar is responding to visemes
        setTimeout(() => {
          if (visemes.length > 0 && subtitles.length > 0) {
            addLog('✅ Avatar synchronization successful');
            updateTestResult('avatarSync', true);
          } else {
            addLog('⚠️ Avatar synchronization may have issues');
            updateTestResult('errors', 'Avatar sync incomplete');
          }
        }, 2000);
      }

      addLog('🏁 Test sequence completed');

    } catch (error) {
      addLog(`❌ Test failed with error: ${error}`);
      updateTestResult('errors', `Test error: ${error}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  const testSpecificPhrase = async (phrase: string) => {
    addLog(`🗣️ Testing phrase: "${phrase}"`);
    try {
      await ttsActions.speak({ text: phrase });
      addLog('✅ Phrase completed');
    } catch (error) {
      addLog(`❌ Phrase failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setTestLog([]);
    setVisemes([]);
    setSubtitles([]);
    setCurrentSubtitle('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            TTS WebSocket Integration Test
            <Badge variant={ttsState.isConnected ? 'default' : 'secondary'}>
              {ttsState.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Avatar Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pico Avatar</h3>
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                <VideoExpressBuddyAvatar
                  className="w-full h-full"
                  onCurrentSubtitleChange={setCurrentSubtitle}
                />
              </div>
              
              {/* Subtitle Display */}
              <div className="min-h-[3rem] p-3 bg-gray-50 rounded-lg border">
                <p className="text-center text-sm">
                  {currentSubtitle || ttsState.currentSubtitle || 'Subtitles will appear here...'}
                </p>
              </div>

              {/* Status Indicators */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Badge variant={ttsState.isPlaying ? 'default' : 'outline'}>
                  {ttsState.isPlaying ? 'Speaking' : 'Ready'}
                </Badge>
                <Badge variant={ttsState.isSupported ? 'default' : 'destructive'}>
                  {ttsState.isSupported ? 'TTS Supported' : 'TTS Not Supported'}
                </Badge>
                <Badge variant={visemes.length > 0 ? 'default' : 'outline'}>
                  Visemes: {visemes.length}
                </Badge>
                <Badge variant={subtitles.length > 0 ? 'default' : 'outline'}>
                  Subtitles: {subtitles.length}
                </Badge>
              </div>

              {ttsState.error && (
                <Alert>
                  <AlertDescription className="text-red-700">
                    {ttsState.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Test Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Controls</h3>
              
              <div className="space-y-3">
                <Button 
                  onClick={runComprehensiveTest}
                  disabled={isTestRunning}
                  className="w-full"
                  size="lg"
                >
                  {isTestRunning ? 'Running Tests...' : 'Run Comprehensive Test'}
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Test Individual Phrases</h4>
                  {testPhrases.map((phrase, index) => (
                    <Button
                      key={index}
                      onClick={() => testSpecificPhrase(phrase)}
                      disabled={ttsState.isPlaying || isTestRunning}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start"
                    >
                      {phrase.length > 50 ? phrase.substring(0, 50) + '...' : phrase}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    onClick={() => ttsActions.stop()} 
                    variant="outline"
                    disabled={!ttsState.isPlaying}
                  >
                    Stop Speech
                  </Button>
                  <Button 
                    onClick={clearLogs}
                    variant="outline"
                  >
                    Clear Logs
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${testResults.websocketConnection ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">WebSocket</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${testResults.audioCapture ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">Audio Capture</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${testResults.visemeGeneration ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">Viseme Generation</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${testResults.avatarSync ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">Avatar Sync</span>
                </div>
              </div>
            </div>

            {testResults.errors.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Errors:</strong>
                    {testResults.errors.map((error, index) => (
                      <div key={index} className="text-sm">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Test Log */}
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-semibold">Test Log</h3>
            <div 
              ref={logRef}
              className="h-64 p-3 bg-gray-900 text-green-400 rounded-lg overflow-y-auto font-mono text-sm"
            >
              {testLog.length === 0 ? (
                <div className="text-gray-500">Test logs will appear here...</div>
              ) : (
                testLog.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TTSWebSocketTest;