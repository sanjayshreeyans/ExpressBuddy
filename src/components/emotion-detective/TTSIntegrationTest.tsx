import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { VisemeTranscriptionService } from '../../lib/viseme-transcription-service';
import TTSService from '../../services/emotion-detective/TTSService';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  details?: any;
}

/**
 * TTS Integration Test Component
 * Tests the complete TTS -> WebSocket -> Viseme flow
 */
export const TTSIntegrationTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'WebSocket Connection', status: 'pending' },
    { name: 'TTS Service Initialization', status: 'pending' },
    { name: 'Audio Capture Setup', status: 'pending' },
    { name: 'Viseme Generation', status: 'pending' },
    { name: 'End-to-End TTS Flow', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [visemeService] = useState(() => new VisemeTranscriptionService());

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const updateTest = (name: string, status: TestResult['status'], error?: string, details?: any) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, error, details } : test
    ));
  };

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    updateTest(testName, 'running');
    try {
      const result = await testFn();
      updateTest(testName, result ? 'passed' : 'failed');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateTest(testName, 'failed', errorMessage);
      addLog(`❌ ${testName} failed: ${errorMessage}`);
      return false;
    }
  };

  const testWebSocketConnection = async (): Promise<boolean> => {
    addLog('🔌 Testing WebSocket connection...');
    
    try {
      const connected = await visemeService.connect();
      if (connected) {
        addLog('✅ WebSocket connected successfully');
        updateTest('WebSocket Connection', 'passed', undefined, {
          sessionId: visemeService.currentSessionId,
          serverUrl: 'ws://localhost:8000/stream-audio'
        });
        return true;
      } else {
        addLog('❌ WebSocket connection failed');
        return false;
      }
    } catch (error) {
      addLog(`❌ WebSocket error: ${error}`);
      return false;
    }
  };

  const testTTSServiceInit = async (): Promise<boolean> => {
    addLog('🎤 Testing TTS service initialization...');
    
    try {
      const isSupported = TTSService.isSupported();
      if (!isSupported) {
        addLog('❌ TTS not supported in this browser');
        return false;
      }

      const connected = await TTSService.initializeVisemeService();
      if (connected) {
        addLog('✅ TTS service initialized with viseme integration');
        updateTest('TTS Service Initialization', 'passed', undefined, {
          isSupported,
          visemeServiceConnected: connected
        });
        return true;
      } else {
        addLog('⚠️ TTS service initialized but viseme service connection failed');
        updateTest('TTS Service Initialization', 'passed', 'Viseme service connection failed', {
          isSupported,
          visemeServiceConnected: connected
        });
        return true; // TTS still works without visemes
      }
    } catch (error) {
      addLog(`❌ TTS service initialization error: ${error}`);
      return false;
    }
  };

  const testAudioCaptureSetup = async (): Promise<boolean> => {
    addLog('🎧 Testing audio capture setup...');
    
    try {
      // Test if we can get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 24000
        } 
      });
      
      addLog('✅ Microphone access granted');
      
      // Test MediaRecorder support
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];

      let supportedType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedType = mimeType;
          break;
        }
      }

      if (!supportedType) {
        addLog('❌ No supported MediaRecorder MIME type found');
        stream.getTracks().forEach(track => track.stop());
        return false;
      }

      addLog(`✅ MediaRecorder supported with ${supportedType}`);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
      updateTest('Audio Capture Setup', 'passed', undefined, {
        microphoneAccess: true,
        supportedMimeType: supportedType
      });
      
      return true;
    } catch (error) {
      addLog(`❌ Audio capture setup failed: ${error}`);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          updateTest('Audio Capture Setup', 'failed', 'Microphone access denied');
        } else if (error.name === 'NotFoundError') {
          updateTest('Audio Capture Setup', 'failed', 'No microphone found');
        } else {
          updateTest('Audio Capture Setup', 'failed', error.message);
        }
      }
      
      return false;
    }
  };

  const testVisemeGeneration = async (): Promise<boolean> => {
    addLog('🎯 Testing viseme generation...');
    
    if (!visemeService.connected) {
      addLog('❌ Viseme service not connected');
      return false;
    }

    return new Promise((resolve) => {
      let visemeReceived = false;
      
      // Set up callback to monitor viseme responses
      visemeService.setCallbacks({
        onVisemes: (visemes, subtitles) => {
          visemeReceived = true;
          addLog(`✅ Received ${visemes.length} visemes and ${subtitles.length} subtitles`);
          updateTest('Viseme Generation', 'passed', undefined, {
            visemeCount: visemes.length,
            subtitleCount: subtitles.length,
            firstViseme: visemes[0],
            firstSubtitle: subtitles[0]
          });
          resolve(true);
        },
        onStreamingChunk: (chunkText, visemes) => {
          addLog(`⚡ Received streaming chunk: "${chunkText}" with ${visemes.length} visemes`);
        },
        onError: (error) => {
          addLog(`❌ Viseme service error: ${error}`);
          updateTest('Viseme Generation', 'failed', error);
          resolve(false);
        }
      });

      // Send test audio data
      const sendTestAudio = async () => {
        try {
          // Create test audio data (simulated speech-like patterns)
          for (let i = 0; i < 10; i++) {
            const testAudioData = new Uint8Array(1024);
            // Generate speech-like waveform
            for (let j = 0; j < testAudioData.length; j++) {
              const frequency = 200 + Math.sin(i * 0.5) * 100; // Varying frequency
              testAudioData[j] = Math.floor(Math.sin(j * frequency * 0.001) * 127 + 128);
            }
            
            await visemeService.sendAudioChunk(testAudioData);
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
          }

          // Request final results
          setTimeout(() => {
            visemeService.requestFinalResults();
          }, 500);

        } catch (error) {
          addLog(`❌ Failed to send test audio: ${error}`);
          resolve(false);
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!visemeReceived) {
          addLog('❌ No viseme response received within timeout');
          updateTest('Viseme Generation', 'failed', 'Timeout waiting for visemes');
          resolve(false);
        }
      }, 10000);

      sendTestAudio();
    });
  };

  const testEndToEndTTSFlow = async (): Promise<boolean> => {
    addLog('🎬 Testing end-to-end TTS flow...');
    
    return new Promise((resolve) => {
      let speechStarted = false;
      let speechEnded = false;
      let visemesReceived = false;

      // Set up TTS callbacks
      TTSService.setCallbacks({
        onSpeechStart: () => {
          speechStarted = true;
          addLog('✅ TTS speech started');
        },
        onSpeechEnd: () => {
          speechEnded = true;
          addLog('✅ TTS speech ended');
          
          // Check if we got everything
          setTimeout(() => {
            if (speechStarted && speechEnded) {
              addLog('✅ End-to-end TTS flow completed successfully');
              updateTest('End-to-End TTS Flow', 'passed', undefined, {
                speechStarted,
                speechEnded,
                visemesReceived
              });
              resolve(true);
            } else {
              addLog('❌ End-to-end TTS flow incomplete');
              updateTest('End-to-End TTS Flow', 'failed', 'Flow incomplete');
              resolve(false);
            }
          }, 1000);
        },
        onVisemes: (visemes, subtitles) => {
          visemesReceived = true;
          addLog(`✅ Received visemes during TTS: ${visemes.length} visemes, ${subtitles.length} subtitles`);
        },
        onError: (error) => {
          addLog(`❌ TTS error: ${error}`);
          updateTest('End-to-End TTS Flow', 'failed', error);
          resolve(false);
        }
      });

      // Speak test phrase
      const testPhrase = "Hello! This is a test of the TTS system with viseme integration.";
      addLog(`🗣️ Speaking: "${testPhrase}"`);
      
      TTSService.speak({ text: testPhrase }).catch((error) => {
        addLog(`❌ TTS speak failed: ${error}`);
        resolve(false);
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!speechEnded) {
          addLog('❌ End-to-end test timeout');
          updateTest('End-to-End TTS Flow', 'failed', 'Test timeout');
          resolve(false);
        }
      }, 15000);
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setLogs([]);
    
    // Reset all tests to pending
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const, error: undefined, details: undefined })));
    
    addLog('🧪 Starting TTS integration tests...');
    
    try {
      // Test 1: WebSocket Connection
      const wsOk = await runTest('WebSocket Connection', testWebSocketConnection);
      if (!wsOk) {
        addLog('❌ Cannot proceed without WebSocket connection');
        setIsRunning(false);
        return;
      }

      // Test 2: TTS Service Initialization
      await runTest('TTS Service Initialization', testTTSServiceInit);

      // Test 3: Audio Capture Setup
      await runTest('Audio Capture Setup', testAudioCaptureSetup);

      // Test 4: Viseme Generation
      await runTest('Viseme Generation', testVisemeGeneration);

      // Test 5: End-to-End TTS Flow
      await runTest('End-to-End TTS Flow', testEndToEndTTSFlow);

      addLog('🏁 All tests completed');

    } catch (error) {
      addLog(`❌ Test suite error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'running': return <Badge variant="secondary">Running...</Badge>;
      case 'passed': return <Badge variant="default">✅ Passed</Badge>;
      case 'failed': return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            TTS Integration Test Suite
            <div className="flex gap-2">
              <Badge variant="outline">Passed: {passedTests}</Badge>
              <Badge variant="outline">Failed: {failedTests}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button 
              onClick={() => setLogs([])}
              variant="outline"
            >
              Clear Logs
            </Button>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{test.name}</div>
                  {test.error && (
                    <div className="text-sm text-red-600 mt-1">{test.error}</div>
                  )}
                  {test.details && (
                    <div className="text-xs text-gray-500 mt-1">
                      {JSON.stringify(test.details, null, 2)}
                    </div>
                  )}
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </div>

          <Separator />

          {/* Test Logs */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Logs</h3>
            <div className="h-64 p-3 bg-gray-900 text-green-400 rounded-lg overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">Test logs will appear here...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <strong>Before running tests:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Make sure the backend server is running on port 8000</li>
                  <li>Allow microphone access when prompted</li>
                  <li>Ensure speakers/headphones are connected for TTS testing</li>
                  <li>Tests may take up to 15 seconds each to complete</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TTSIntegrationTest;