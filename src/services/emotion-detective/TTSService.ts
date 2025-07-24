import { TTSRequest } from '../../types/emotion-detective';
import { VisemeTranscriptionService, VisemeData, SubtitleData } from '../../lib/viseme-transcription-service';
import { synthesize, getVoices } from '@echristian/edge-tts';

export interface TTSWithVisemeCallbacks {
  onVisemes?: (visemes: VisemeData[], subtitles: SubtitleData[]) => void;
  onSubtitles?: (subtitles: SubtitleData[]) => void;
  onStreamingChunk?: (chunkText: string, visemes: VisemeData[]) => void;
  onError?: (error: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

class TTSService {
  private visemeService: VisemeTranscriptionService;
  private currentAudio: HTMLAudioElement | null = null;
  private callbacks: TTSWithVisemeCallbacks = {};
  private isPlaying = false;

  constructor() {
    this.visemeService = new VisemeTranscriptionService();
    this.setupVisemeCallbacks();
  }

  /**
   * Set callbacks for viseme and subtitle events
   */
  setCallbacks(callbacks: TTSWithVisemeCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Initialize the viseme service connection
   */
  async initializeVisemeService(): Promise<boolean> {
    try {
      const connected = await this.visemeService.connect();
      if (connected) {
        console.log('✅ TTS Service: Viseme service connected successfully');
        return true;
      } else {
        console.error('❌ TTS Service: Failed to connect to viseme service');
        return false;
      }
    } catch (error) {
      console.error('❌ TTS Service: Error connecting to viseme service:', error);
      this.callbacks.onError?.(`Failed to connect to viseme service: ${error}`);
      return false;
    }
  }

  /**
   * Setup viseme service callbacks
   */
  private setupVisemeCallbacks(): void {
    this.visemeService.setCallbacks({
      onVisemes: (visemes, subtitles) => {
        console.log('🎯 TTS Service: Received final visemes and subtitles', { visemes: visemes.length, subtitles: subtitles.length });

        // Start audio playback now that we have visemes for synchronization
        if (this.currentAudio && !this.isPlaying) {
          console.log('🎵 TTS Service: Starting synchronized audio + viseme playback');
          this.currentAudio.play().catch(error => {
            console.error('❌ TTS Service: Failed to start audio playback:', error);
          });
        }

        this.callbacks.onVisemes?.(visemes, subtitles);
      },
      onSubtitles: (subtitles) => {
        console.log('📝 TTS Service: Received subtitles', { count: subtitles.length });
        this.callbacks.onSubtitles?.(subtitles);
      },
      onStreamingChunk: (chunkText, visemes) => {
        console.log('⚡ TTS Service: Received streaming chunk', { text: chunkText, visemes: visemes.length });
        this.callbacks.onStreamingChunk?.(chunkText, visemes);
      },
      onError: (error) => {
        console.error('❌ TTS Service: Viseme service error:', error);
        this.callbacks.onError?.(error);
      },
      onConnected: (sessionId) => {
        console.log('✅ TTS Service: Viseme service connected with session:', sessionId);
      },
      onFinalResults: (response) => {
        console.log('🏁 TTS Service: Final viseme results received:', response);
      }
    });
  }

  /**
   * Speak text using Edge TTS with viseme generation
   */
  async speak(request: TTSRequest): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Stop any current speech
        this.stop();

        console.log('🎤 TTS Service: Starting Edge TTS synthesis for:', request.text);

        // Ensure viseme service is connected
        if (!this.visemeService.connected) {
          const connected = await this.initializeVisemeService();
          if (!connected) {
            console.warn('⚠️ TTS Service: Continuing without viseme integration');
          }
        }

        // Configure Edge TTS voice - use child-friendly voice
        const voiceId = request.voiceId || 'en-US-JennyNeural'; // Child-friendly voice

        console.log('🎯 TTS Service: Using Edge TTS voice:', voiceId);

        // Generate speech with Edge TTS
        const { audio } = await synthesize({
          text: request.text,
          voice: voiceId,
          language: 'en-US'
        });

        console.log('✅ TTS Service: Edge TTS synthesis complete, audio size:', audio.size, 'bytes');

        // Create audio element but don't play yet - wait for visemes
        this.currentAudio = new Audio();
        const audioUrl = URL.createObjectURL(audio);
        this.currentAudio.src = audioUrl;

        // Set up audio event handlers
        this.currentAudio.onloadstart = () => {
          console.log('🎵 TTS Service: Audio loading started');
        };

        this.currentAudio.onplay = () => {
          console.log('🎵 TTS Service: Audio playback started');
          this.isPlaying = true;
          this.callbacks.onSpeechStart?.();
        };

        this.currentAudio.onended = () => {
          console.log('🎵 TTS Service: Audio playback ended');
          this.isPlaying = false;
          this.callbacks.onSpeechEnd?.();

          // Clean up
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;

          resolve();
        };

        this.currentAudio.onerror = (event) => {
          console.error('❌ TTS Service: Audio playback error:', event);
          this.isPlaying = false;

          // Clean up
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;

          reject(new Error('Audio playback failed'));
        };

        // Send audio to viseme service for lip-sync generation
        if (this.visemeService.connected && audio.size > 0) {
          console.log('🚀 TTS Service: Sending audio to viseme service for lip-sync generation');

          try {
            // Convert Edge TTS audio to PCM format expected by backend
            const pcmData = await this.convertAudioToPCM(audio);
            console.log('🎯 TTS Service: Converted audio to PCM format:', pcmData.length, 'bytes');

            // Send PCM audio data to viseme service
            await this.visemeService.sendAudioChunk(pcmData);

            // Request final results
            setTimeout(() => {
              this.visemeService.requestFinalResults();
            }, 100);

            console.log('⏳ TTS Service: Waiting for visemes before starting audio playback...');
          } catch (error) {
            console.error('❌ TTS Service: Error converting audio to PCM:', error);
            this.callbacks.onError?.(`Audio conversion failed: ${error}`);

            // If viseme processing fails, still play audio
            console.log('🎵 TTS Service: Starting audio playback without visemes due to error');
            await this.currentAudio.play();
          }
        } else {
          // If no viseme service, play audio immediately
          console.log('🎵 TTS Service: Starting audio playback without visemes (no service)');
          await this.currentAudio.play();
        }

      } catch (error) {
        console.error('❌ TTS Service: Error in speak method:', error);
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    }
  }

  /**
   * Check if TTS is currently speaking
   */
  isSpeaking(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if TTS is paused
   */
  isPaused(): boolean {
    return this.currentAudio ? this.currentAudio.paused : false;
  }

  /**
   * Get available Edge TTS voices
   */
  async getVoices(): Promise<string[]> {
    try {
      const voices = await getVoices();
      return voices.map((voice: any) => voice.Name);
    } catch (error) {
      console.error('❌ TTS Service: Error getting voices:', error);
      return [];
    }
  }

  /**
   * Get child-friendly voices (filtered by language and characteristics)
   */
  async getChildFriendlyVoices(): Promise<string[]> {
    try {
      const voices = await getVoices();

      // Filter for English voices and prefer child-friendly voices
      return voices
        .filter((voice: any) =>
          voice.Locale.startsWith('en') &&
          (voice.Name.includes('Jenny') ||
            voice.Name.includes('Aria') ||
            voice.Name.includes('Michelle') ||
            voice.Name.includes('Emma'))
        )
        .map((voice: any) => voice.Name);
    } catch (error) {
      console.error('❌ TTS Service: Error getting child-friendly voices:', error);
      return ['en-US-JennyNeural']; // Fallback to default child-friendly voice
    }
  }

  /**
   * Check if Edge TTS is supported
   */
  isSupported(): boolean {
    return true; // Edge TTS should work in all modern browsers
  }

  /**
   * Process visemes in parallel with audio playback
   */
  private async processVisemesInParallel(audio: Blob): Promise<void> {
    try {
      // Convert ttsmp3.com audio to PCM format expected by backend
      const pcmData = await this.convertAudioToPCM(audio);
      console.log('🎯 TTS Service: Converted audio to PCM format:', pcmData.length, 'bytes');

      // Send PCM audio data to viseme service
      await this.visemeService.sendAudioChunk(pcmData);

      // Request final results
      setTimeout(() => {
        this.visemeService.requestFinalResults();
      }, 100);

      console.log('✅ TTS Service: Viseme processing started in parallel');
    } catch (error) {
      console.error('❌ TTS Service: Error processing visemes in parallel:', error);
      this.callbacks.onError?.(`Viseme processing failed: ${error}`);
    }
  }

  /**
   * Convert Edge TTS audio to PCM format expected by backend
   * Backend expects: 24kHz, 16-bit, mono PCM data
   */
  private async convertAudioToPCM(audioBlob: Blob): Promise<Uint8Array> {
    try {
      console.log('🔄 TTS Service: Converting audio to PCM format...');

      // Create audio context with the target sample rate
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Backend expects 24kHz
      });

      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      console.log('🎯 TTS Service: Original audio - Sample Rate:', audioBuffer.sampleRate, 'Channels:', audioBuffer.numberOfChannels, 'Duration:', audioBuffer.duration);

      // Get the audio data (convert to mono if needed)
      let audioData: Float32Array;
      if (audioBuffer.numberOfChannels === 1) {
        audioData = audioBuffer.getChannelData(0);
      } else {
        // Convert stereo to mono by averaging channels
        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = audioBuffer.getChannelData(1);
        audioData = new Float32Array(leftChannel.length);
        for (let i = 0; i < leftChannel.length; i++) {
          audioData[i] = (leftChannel[i] + rightChannel[i]) / 2;
        }
      }

      // Resample to 24kHz if needed
      let resampledData = audioData;
      if (audioBuffer.sampleRate !== 24000) {
        console.log('🔄 TTS Service: Resampling from', audioBuffer.sampleRate, 'Hz to 24000 Hz');
        resampledData = this.resampleAudio(audioData, audioBuffer.sampleRate, 24000);
      }

      // Convert float32 to int16 PCM
      const pcmData = new Uint8Array(resampledData.length * 2); // 16-bit = 2 bytes per sample
      const view = new DataView(pcmData.buffer);

      for (let i = 0; i < resampledData.length; i++) {
        // Clamp to [-1, 1] and convert to 16-bit signed integer
        const sample = Math.max(-1, Math.min(1, resampledData[i]));
        const intSample = Math.round(sample * 32767);
        view.setInt16(i * 2, intSample, true); // little-endian
      }

      console.log('✅ TTS Service: Audio converted to PCM - Size:', pcmData.length, 'bytes, Duration:', resampledData.length / 24000, 'seconds');

      // Close audio context to free resources
      await audioContext.close();

      return pcmData;

    } catch (error) {
      console.error('❌ TTS Service: Error converting audio to PCM:', error);
      throw new Error(`Audio conversion failed: ${error}`);
    }
  }

  /**
   * Simple linear resampling (for basic resampling needs)
   */
  private resampleAudio(inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }

    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const inputIndexFloor = Math.floor(inputIndex);
      const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
      const fraction = inputIndex - inputIndexFloor;

      // Linear interpolation
      outputData[i] = inputData[inputIndexFloor] * (1 - fraction) + inputData[inputIndexCeil] * fraction;
    }

    return outputData;
  }



  /**
   * Disconnect from viseme service
   */
  async disconnect(): Promise<void> {
    try {
      // Stop any current speech
      this.stop();

      // Disconnect viseme service
      this.visemeService.disconnect();

      console.log('✅ TTS Service: Disconnected successfully');

    } catch (error) {
      console.error('❌ TTS Service: Error during disconnect:', error);
    }
  }

  /**
   * Get viseme service connection status
   */
  isVisemeServiceConnected(): boolean {
    return this.visemeService.connected;
  }

  /**
   * Get viseme service processing statistics
   */
  getVisemeServiceStats() {
    return this.visemeService.processingStatistics;
  }

  /**
   * Get current audio element for synchronization
   */
  getCurrentAudioElement(): HTMLAudioElement | null {
    return this.currentAudio;
  }
}

export default new TTSService();