import TTSService, { TTSCallbacks } from './TTSService';
import { TTSRequest } from '../../types/emotion-detective';

export interface TTSPlaybackCallbacks extends TTSCallbacks {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

/**
 * TTS Playback Controller
 * Simplified controller for TTS playback without lip-sync
 */
export class TTSPlaybackController {
  private callbacks: TTSPlaybackCallbacks = {};
  private isPlaying = false;

  constructor() {
    // Setup TTS service callbacks
    this.setupTTSCallbacks();
  }

  /**
   * Setup TTS service callbacks
   */
  private setupTTSCallbacks(): void {
    TTSService.setCallbacks({
      onSpeechStart: () => {
        this.isPlaying = true;
        this.callbacks.onPlaybackStart?.();
        this.callbacks.onSpeechStart?.();
      },
      onSpeechEnd: () => {
        this.isPlaying = false;
        this.callbacks.onPlaybackEnd?.();
        this.callbacks.onSpeechEnd?.();
      },
      onError: (error) => {
        this.callbacks.onError?.(error);
      }
    });
  }

  /**
   * Set callbacks for playback events
   */
  setCallbacks(callbacks: TTSPlaybackCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Speak text with TTS
   * @param request - TTS request with text and optional voice
   */
  async speak(request: TTSRequest): Promise<void> {
    try {
      console.log('🎤 TTS Playback Controller: Starting speech with TTS:', request.text);

      // Call TTS service to generate and play speech
      await TTSService.speak(request);

      console.log('✅ TTS Playback Controller: Speech completed');
    } catch (error) {
      console.error('❌ TTS Playback Controller: Error during speech:', error);
      this.callbacks.onError?.(`Speech playback failed: ${error}`);
      throw error;
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    TTSService.stop();
    this.isPlaying = false;
  }

  /**
   * Pause current speech
   */
  pause(): void {
    TTSService.pause();
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    TTSService.resume();
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
    return TTSService.isPaused();
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<string[]> {
    return TTSService.getVoices();
  }

  /**
   * Get child-friendly voices
   */
  async getChildFriendlyVoices(): Promise<string[]> {
    return TTSService.getChildFriendlyVoices();
  }
}
