/**
 * TTS WebSocket Integration Test
 * This script tests the complete TTS -> WebSocket -> Viseme flow
 * Run this to verify the backend server integration is working correctly
 */

import { VisemeTranscriptionService } from '../src/lib/viseme-transcription-service';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class TTSWebSocketIntegrationTest {
  private results: TestResult[] = [];
  private visemeService: VisemeTranscriptionService;

  constructor() {
    this.visemeService = new VisemeTranscriptionService();
  }

  private addResult(name: string, passed: boolean, error?: string, details?: any) {
    this.results.push({ name, passed, error, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (error) console.log(`   Error: ${error}`);
    if (details) console.log(`   Details:`, details);
  }

  async testWebSocketConnection(): Promise<boolean> {
    console.log('\n🔌 Testing WebSocket Connection...');
    
    try {
      const connected = await this.visemeService.connect();
      
      if (connected) {
        this.addResult('WebSocket Connection', true, undefined, {
          serverUrl: 'ws://localhost:8000/stream-audio',
          sessionId: this.visemeService.currentSessionId
        });
        return true;
      } else {
        this.addResult('WebSocket Connection', false, 'Failed to connect to WebSocket server');
        return false;
      }
    } catch (error) {
      this.addResult('WebSocket Connection', false, `Connection error: ${error}`);
      return false;
    }
  }

  async testAudioDataSending(): Promise<boolean> {
    console.log('\n📡 Testing Audio Data Sending...');
    
    if (!this.visemeService.connected) {
      this.addResult('Audio Data Sending', false, 'WebSocket not connected');
      return false;
    }

    try {
      // Create test audio data (simulated PCM data)
      const testAudioData = new Uint8Array(1024);
      // Fill with some test data
      for (let i = 0; i < testAudioData.length; i++) {
        testAudioData[i] = Math.floor(Math.sin(i * 0.1) * 127 + 128);
      }

      // Send test audio chunk
      await this.visemeService.sendAudioChunk(testAudioData);
      
      this.addResult('Audio Data Sending', true, undefined, {
        audioDataSize: testAudioData.length,
        format: 'PCM -> WAV conversion'
      });
      return true;
    } catch (error) {
      this.addResult('Audio Data Sending', false, `Failed to send audio data: ${error}`);
      return false;
    }
  }

  async testVisemeResponse(): Promise<boolean> {
    console.log('\n🎯 Testing Viseme Response...');
    
    return new Promise((resolve) => {
      let visemeReceived = false;
      let streamingReceived = false;
      
      // Set up callbacks to monitor responses
      this.visemeService.setCallbacks({
        onVisemes: (visemes, subtitles) => {
          visemeReceived = true;
          this.addResult('Final Viseme Response', true, undefined, {
            visemeCount: visemes.length,
            subtitleCount: subtitles.length,
            firstViseme: visemes[0],
            firstSubtitle: subtitles[0]
          });
        },
        onStreamingChunk: (chunkText, visemes) => {
          streamingReceived = true;
          this.addResult('Streaming Viseme Response', true, undefined, {
            chunkText,
            visemeCount: visemes.length,
            firstViseme: visemes[0]
          });
        },
        onError: (error) => {
          this.addResult('Viseme Response', false, `Server error: ${error}`);
          resolve(false);
        }
      });

      // Send more substantial test audio data
      const sendTestAudio = async () => {
        try {
          // Send multiple chunks to simulate real audio
          for (let chunk = 0; chunk < 5; chunk++) {
            const testAudioData = new Uint8Array(2048);
            // Create more realistic audio-like data
            for (let i = 0; i < testAudioData.length; i++) {
              const frequency = 440 + chunk * 100; // Different frequencies per chunk
              testAudioData[i] = Math.floor(Math.sin(i * frequency * 0.001) * 127 + 128);
            }
            
            await this.visemeService.sendAudioChunk(testAudioData);
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between chunks
          }

          // Request final results
          setTimeout(() => {
            this.visemeService.requestFinalResults();
          }, 500);

        } catch (error) {
          this.addResult('Viseme Response', false, `Failed to send test audio: ${error}`);
          resolve(false);
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!visemeReceived && !streamingReceived) {
          this.addResult('Viseme Response', false, 'No viseme response received within timeout');
          resolve(false);
        } else {
          resolve(true);
        }
      }, 10000);

      // Start sending test audio
      sendTestAudio();
    });
  }

  async testConnectionStability(): Promise<boolean> {
    console.log('\n🔄 Testing Connection Stability...');
    
    try {
      const stats = this.visemeService.processingStatistics;
      
      this.addResult('Connection Stability', true, undefined, {
        isConnected: this.visemeService.connected,
        isUltraFast: stats.isUltraFast,
        currentLatency: stats.currentLatency,
        queuedPackets: stats.queuedPackets,
        totalPacketsSent: stats.totalPacketsSent
      });
      
      return true;
    } catch (error) {
      this.addResult('Connection Stability', false, `Failed to get connection stats: ${error}`);
      return false;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting TTS WebSocket Integration Tests...');
    console.log('📋 Testing against backend server on ws://localhost:8000/stream-audio');
    console.log('⚠️  Make sure the backend server is running before running these tests!\n');

    try {
      // Test 1: WebSocket Connection
      const connectionOk = await this.testWebSocketConnection();
      if (!connectionOk) {
        console.log('\n❌ Cannot proceed without WebSocket connection');
        this.printSummary();
        return;
      }

      // Test 2: Audio Data Sending
      const audioSendingOk = await this.testAudioDataSending();
      if (!audioSendingOk) {
        console.log('\n⚠️  Audio sending failed, but continuing with other tests...');
      }

      // Test 3: Viseme Response
      await this.testVisemeResponse();

      // Test 4: Connection Stability
      await this.testConnectionStability();

    } catch (error) {
      console.error('\n💥 Test suite failed with error:', error);
      this.addResult('Test Suite', false, `Suite error: ${error}`);
    } finally {
      // Cleanup
      this.visemeService.disconnect();
      this.printSummary();
    }
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! TTS WebSocket integration is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above for details.');
      console.log('\nCommon issues:');
      console.log('- Backend server not running on port 8000');
      console.log('- WebSocket server not accepting connections');
      console.log('- Audio processing pipeline issues');
      console.log('- Network connectivity problems');
    }

    // Print failed tests
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
    }
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new TTSWebSocketIntegrationTest();
  tester.runAllTests().catch(console.error);
}

export { TTSWebSocketIntegrationTest };