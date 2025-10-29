import { TTSRequest } from '../../types/emotion-detective';
import { synthesize, getVoices } from '@echristian/edge-tts';

export interface TTSCallbacks {
  onError?: (error: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private callbacks: TTSCallbacks = {};
  private isPlaying = false;

  /**
   * Set callbacks for speech events
   */
  setCallbacks(callbacks: TTSCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Speak text using Edge TTS
   */
  async speak(request: TTSRequest): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Stop any current speech
        this.stop();

        console.log('🎤 TTS Service: Starting Edge TTS synthesis for:', request.text);

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

        // Create audio element
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

        // Start playback
        await this.currentAudio.play();

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
   * Get current audio element for synchronization
   */
  getCurrentAudioElement(): HTMLAudioElement | null {
    return this.currentAudio;
  }
}

export default new TTSService();