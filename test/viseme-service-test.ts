/**
 * Test script for the VisemeTranscriptionService
 * Run this to verify the WebSocket connection and real-time processing
 */

import { VisemeTranscriptionService } from '../src/lib/viseme-transcription-service';

async function testVisemeService() {
  console.log('🧪 Testing VisemeTranscriptionService...');
  
  const service = new VisemeTranscriptionService();
  
  // Set up callbacks to monitor performance
  service.setCallbacks({
    onConnected: (sessionId) => {
      console.log('✅ Connected to viseme service:', sessionId);
    },
    onStreamingChunk: (chunkText, visemes) => {
      console.log('⚡ Real-time chunk:', chunkText);
      console.log(`   - Visemes: ${visemes.length}`);
      console.log(`   - Latency: ${service.processingLatency.toFixed(1)}ms`);
      console.log(`   - Ultra-fast: ${service.isUltraFast ? '⚡ YES' : '🐌 NO'}`);
    },
    onVisemes: (visemes, subtitles) => {
      console.log('🎭 Final visemes received:', visemes.length);
      console.log('📝 Final subtitles received:', subtitles.length);
    },
    onError: (error) => {
      console.error('❌ Error:', error);
    },
    onFinalResults: (response) => {
      console.log('🏁 Final results:');
      console.log(`   - Success: ${response.success}`);
      console.log(`   - Total visemes: ${response.visemeCount}`);
      console.log(`   - Processing time: ${response.state_tracking.processing_time}`);
      console.log(`   - Duration: ${response.state_tracking.duration}s`);
    }
  });
  
  try {
    // Try to connect
    console.log('🔌 Attempting to connect to ws://localhost:8000/stream-audio...');
    const connected = await service.connect();
    
    if (connected) {
      console.log('✅ Connection successful!');
      console.log('📊 Service status:');
      console.log(`   - Connected: ${service.connected}`);
      console.log(`   - Session ID: ${service.currentSessionId}`);
      
      // Simulate some audio data
      console.log('🎵 Simulating audio data...');
      const dummyAudio = new Uint8Array(1024).fill(128); // Simple audio simulation
      
      for (let i = 0; i < 5; i++) {
        await service.sendAudioChunk(dummyAudio);
        console.log(`   Sent chunk ${i + 1}/5`);
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      }
      
      // Request final results
      console.log('🎯 Requesting final results...');
      await service.requestFinalResults();
      
      // Wait a bit for final results
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } else {
      console.log('❌ Connection failed');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    console.log('🧹 Cleaning up...');
    service.disconnect();
    console.log('✅ Test completed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVisemeService().catch(console.error);
}

export { testVisemeService };
