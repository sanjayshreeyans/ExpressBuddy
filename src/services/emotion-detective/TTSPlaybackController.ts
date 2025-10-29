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
   * Set callbacks for TTS and playback events
   */
  setCallbacks(callbacks: TTSPlaybackCallbacks): void {
    this.callbacks = callbacks;

    // Update TTS service callbacks
    TTSService.setCallbacks({
      onVisemes: this.handleVisemes.bind(this),
      onSubtitles: this.handleSubtitles.bind(this),
      onStreamingChunk: this.handleStreamingChunk.bind(this),
      onError: this.handleError.bind(this),
      onSpeechStart: this.handleSpeechStart.bind(this),
      onSpeechEnd: this.handleSpeechEnd.bind(this)
    });
  }

  /**
   * Setup TTS service callbacks
   */
  private setupTTSCallbacks(): void {
    TTSService.setCallbacks({
      onVisemes: this.handleVisemes.bind(this),
      onSubtitles: this.handleSubtitles.bind(this),
      onStreamingChunk: this.handleStreamingChunk.bind(this),
      onError: this.handleError.bind(this),
      onSpeechStart: this.handleSpeechStart.bind(this),
      onSpeechEnd: this.handleSpeechEnd.bind(this)
    });
  }

  /**
   * Speak text with lip-sync animation
   */
  async speak(request: TTSRequest): Promise<void> {
    try {
      console.log('🎤 TTS Playback Controller: Starting speech with lip-sync:', request.text);

      // Reset state
      this.reset();

      // Initialize viseme service if needed
      if (!TTSService.isVisemeServiceConnected()) {
        await TTSService.initializeVisemeService();
      }

      // Start TTS
      await TTSService.speak(request);

    } catch (error) {
      console.error('❌ TTS Playback Controller: Error during speech:', error);
      this.callbacks.onError?.(`Speech error: ${error}`);
      throw error;
    }
  }

  /**
   * Stop current speech and animation
   */
  stop(): void {
    console.log('🛑 TTS Playback Controller: Stopping speech and animation');

    // Stop TTS
    TTSService.stop();

    // Stop viseme playback
    if (this.visemePlaybackController) {
      this.visemePlaybackController.reset();
    }

    // Stop subtitle updates
    this.stopSubtitleUpdates();

    // Reset state
    this.isPlaying = false;
    this.callbacks.onPlaybackEnd?.();
  }

  /**
   * Pause current speech and animation
   */
  pause(): void {
    console.log('⏸️ TTS Playback Controller: Pausing speech and animation');

    // Pause TTS
    TTSService.pause();

    // Pause viseme playback
    if (this.visemePlaybackController) {
      this.visemePlaybackController.pause();
    }

    // Stop subtitle updates
    this.stopSubtitleUpdates();
  }

  /**
   * Resume paused speech and animation
   */
  resume(): void {
    console.log('▶️ TTS Playback Controller: Resuming speech and animation');

    // Resume TTS
    TTSService.resume();

    // Resume viseme playback
    if (this.visemePlaybackController && this.currentVisemes.length > 0) {
      this.visemePlaybackController.play();
    }

    // Resume subtitle updates
    this.startSubtitleUpdates();
  }

  /**
   * Reset controller state
   */
  private reset(): void {
    this.currentVisemes = [];
    this.currentSubtitles = [];
    this.currentSubtitleIndex = -1;
    this.isPlaying = false;
    this.stopSubtitleUpdates();

    // Only reset viseme controller if we're not currently playing
    // This prevents interrupting ongoing viseme playback
    if (this.visemePlaybackController && !this.visemePlaybackController.isPlaying) {
      console.log('🧹 TTSPlaybackController: Resetting viseme controller');
      this.visemePlaybackController.reset();
    } else if (this.visemePlaybackController) {
      console.log('⏸️ TTSPlaybackController: Skipping viseme reset - playback in progress');
    }
  }

  /**
   * Handle visemes from TTS service
   */
  private handleVisemes(visemes: VisemeData[], subtitles: SubtitleData[]): void {
    console.log('🎯 TTS Playback Controller: Received visemes and subtitles', {
      visemes: visemes.length,
      subtitles: subtitles.length
    });

    this.currentVisemes = visemes;
    this.currentSubtitles = subtitles;

    // Start viseme playback if controller is available
    if (this.visemePlaybackController && visemes.length > 0) {
      // Get the current audio element from TTSService for synchronization
      const audioElement = this.getCurrentAudioElement();
      if (audioElement) {
        console.log('🎵 TTS Playback Controller: Setting audio element for viseme sync');
        this.visemePlaybackController.setAudioElement(audioElement);

        // Wait for audio to be ready before starting viseme playback
        const startVisemePlayback = () => {
          if (audioElement.readyState >= 2) { // HAVE_CURRENT_DATA
            this.visemePlaybackController!.add(visemes);
            this.visemePlaybackController!.play();
            console.log('🎬 TTS Playback Controller: Started viseme playback with', visemes.length, 'visemes');
          } else {
            // Wait for audio to be ready
            audioElement.addEventListener('canplay', () => {
              this.visemePlaybackController!.add(visemes);
              this.visemePlaybackController!.play();
              console.log('🎬 TTS Playback Controller: Started viseme playback with', visemes.length, 'visemes (after canplay)');
            }, { once: true });
          }
        };

        startVisemePlayback();
      } else {
        // No audio element yet, start visemes anyway but they might not be perfectly synced
        console.log('⚠️ TTS Playback Controller: No audio element available, starting visemes without sync');
        this.visemePlaybackController.add(visemes);
        this.visemePlaybackController.play();
        console.log('🎬 TTS Playback Controller: Started viseme playback with', visemes.length, 'visemes (no sync)');
      }
    }

    // Start subtitle updates
    if (subtitles.length > 0) {
      this.startSubtitleUpdates();
    }

    // Forward to callbacks
    this.callbacks.onVisemes?.(visemes, subtitles);
  }

  /**
   * Get current audio element from TTS service
   */
  private getCurrentAudioElement(): HTMLAudioElement | null {
    return TTSService.getCurrentAudioElement();
  }

  /**
   * Handle subtitles from TTS service
   */
  private handleSubtitles(subtitles: SubtitleData[]): void {
    console.log('📝 TTS Playback Controller: Received subtitles', { count: subtitles.length });

    this.currentSubtitles = subtitles;
    this.callbacks.onSubtitles?.(subtitles);
  }

  /**
   * Handle streaming chunks from TTS service
   */
  private handleStreamingChunk(chunkText: string, visemes: VisemeData[]): void {
    console.log('⚡ TTS Playback Controller: Received streaming chunk', {
      text: chunkText,
      visemes: visemes.length
    });

    // For streaming chunks, immediately start viseme playback
    if (this.visemePlaybackController && visemes.length > 0) {
      this.visemePlaybackController.add(visemes);
      if (!this.visemePlaybackController.isPlaying) {
        this.visemePlaybackController.play();
      }
    }

    this.callbacks.onStreamingChunk?.(chunkText, visemes);
  }

  /**
   * Handle errors from TTS service
   */
  private handleError(error: string): void {
    console.error('❌ TTS Playback Controller: TTS service error:', error);
    this.callbacks.onError?.(error);
  }

  /**
   * Handle speech start
   */
  private handleSpeechStart(): void {
    console.log('🎤 TTS Playback Controller: Speech started');
    this.isPlaying = true;
    this.callbacks.onPlaybackStart?.();
  }

  /**
   * Handle speech end
   */
  private handleSpeechEnd(): void {
    console.log('🎤 TTS Playback Controller: Speech ended');
    this.isPlaying = false;
    this.callbacks.onPlaybackEnd?.();
  }

  /**
   * Start subtitle updates
   */
  private startSubtitleUpdates(): void {
    if (this.subtitleUpdateInterval) {
      clearInterval(this.subtitleUpdateInterval);
    }

    this.subtitleUpdateInterval = window.setInterval(() => {
      if (!this.isPlaying || this.currentSubtitles.length === 0) {
        return;
      }

      // Get current time from audio element for accurate subtitle timing
      const audioElement = this.getCurrentAudioElement();
      const currentTimeSeconds = audioElement ? audioElement.currentTime : 0;

      // Find current subtitle
      const currentSubtitle = this.currentSubtitles.find(
        sub => currentTimeSeconds >= sub.start && currentTimeSeconds <= sub.end
      );

      if (currentSubtitle) {
        this.callbacks.onCurrentSubtitle?.(currentSubtitle.text);
      } else {
        this.callbacks.onCurrentSubtitle?.('');
      }
    }, 50); // Update every 50ms for smooth subtitle display
  }

  /**
   * Stop subtitle updates
   */
  private stopSubtitleUpdates(): void {
    if (this.subtitleUpdateInterval) {
      clearInterval(this.subtitleUpdateInterval);
      this.subtitleUpdateInterval = null;
    }
    this.callbacks.onCurrentSubtitle?.('');
  }

  /**
   * Check if currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if TTS is supported
   */
  get isSupported(): boolean {
    return 'speechSynthesis' in window && TTSService.isSupported();
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<string[]> {
    if (!this.isSupported) return [];
    return await TTSService.getVoices();
  }

  /**
   * Get child-friendly voices
   */
  async getChildFriendlyVoices(): Promise<string[]> {
    if (!this.isSupported) return [];
    return await TTSService.getChildFriendlyVoices();
  }

  /**
   * Get viseme service connection status
   */
  get isVisemeServiceConnected(): boolean {
    return TTSService.isVisemeServiceConnected();
  }

  /**
   * Get viseme service statistics
   */
  getVisemeServiceStats() {
    return TTSService.getVisemeServiceStats();
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    console.log('🛑 TTS Playback Controller: Disconnecting...');

    // Stop any current playback
    this.stop();

    // Disconnect TTS service
    await TTSService.disconnect();

    // Reset controller
    this.visemePlaybackController = null;
    this.riveInputs = null;

    console.log('✅ TTS Playback Controller: Disconnected successfully');
  }
}

// Export singleton instance
export default new TTSPlaybackController();