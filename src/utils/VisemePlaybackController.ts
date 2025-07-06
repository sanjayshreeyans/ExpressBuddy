import { VisemeData, RiveInputs, VisemePlaybackOptions, SUPPORTED_VISEME_IDS } from '../types/avatar';

/**
 * VisemePlaybackController - Handles scheduling and playback of viseme data
 * Adapted from PandabotLipsync for ExpressBuddy integration
 */
export class VisemePlaybackController {
  private _playing = false;
  private startTime: number | null = null;
  private playbackOffset = 0;
  private animationFrameId: number | null = null;
  private transitionDuration = 20;
  private _chunks: VisemeData[] = [];
  private lastPlayedIndex = -1;
  private previousVisemeId: number | null = null;
  private riveInputs: RiveInputs;
  private setSpeakingState = true;
  private manualSpeakingStateControl = false;
  private audioDuration: number | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  constructor(options: VisemePlaybackOptions) {
    this.riveInputs = options.riveInputs;
    this.transitionDuration = options.transitionDuration ?? 21;
    this.setSpeakingState = options.setSpeakingState ?? true;
    this.manualSpeakingStateControl = options.manualSpeakingStateControl ?? false;
    if (options.audioElement) {
      this.audioElement = options.audioElement;
    }
  }

  /**
   * Update the rive inputs without recreating the controller
   */
  updateRiveInputs(riveInputs: RiveInputs): void {
    this.riveInputs = riveInputs;
  }

  /**
   * Set audio reference for better synchronization
   */
  setAudioElement(audioElement: HTMLAudioElement | null): void {
    this.audioElement = audioElement;
    this.audioDuration = audioElement?.duration || null;
  }

  /**
   * Add viseme data to the playback queue
   */
  add(visemes: VisemeData[]): void {
    // Clear existing visemes first to prevent duplication
    this._chunks.length = 0;
    
    if (visemes.length > 0) {
      // Normalize viseme offsets to start from 0 for this chunk
      const firstOffset = visemes[0].offset;
      const normalizedVisemes = visemes.map(viseme => ({
        ...viseme,
        offset: viseme.offset - firstOffset
      }));
      
      this._chunks.push(...normalizedVisemes);
      console.log(`Added ${visemes.length} visemes to playback queue (normalized from ${firstOffset}ms, duration: ${this.audioDuration ? this.audioDuration * 1000 : 'unknown'}ms)`);
      console.log(`First viseme offset: ${normalizedVisemes[0]?.offset}ms, Last: ${normalizedVisemes[normalizedVisemes.length - 1]?.offset}ms`);
    } else {
      console.log('No visemes to add to playback queue');
    }
  }

  /**
   * Start playback with optional callback
   */
  play(options?: { callback?: () => void }): void {
    if (this._playing) return;

    this._playing = true;
    this.startTime = performance.now() - this.playbackOffset;
    
    if (options?.callback) {
      options.callback();
    }

    console.log('Started viseme playback...');
    this.runPlayback();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this._playing) return;

    this._playing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.playbackOffset = this.currentTime();
    console.log('Paused viseme playback');
  }

  /**
   * Seek to specific time offset
   */
  seek(offset: number): void {
    this.pause();
    this.playbackOffset = offset;
    this.previousVisemeId = null;
    this.startTime = null;
    this.lastPlayedIndex = -1;
    console.log(`Seeked to offset: ${offset}ms`);
  }

  /**
   * Reset playback to initial state
   */
  reset(): void {
    this.pause();
    
    try {
      // Reset to neutral viseme (100 - which should be neutral/silence)
      this.run(100);
      
      // Reset speaking state
      if (this.setSpeakingState && !this.manualSpeakingStateControl && this.riveInputs.emotions?.is_speaking) {
        this.riveInputs.emotions.is_speaking.value = false;
      }
    } catch (error) {
      console.warn('Could not reset Rive inputs (they may be null):', error);
    }

    this.previousVisemeId = null;
    this.startTime = null;
    this.playbackOffset = 0;
    this.animationFrameId = null;
    this.lastPlayedIndex = -1;
    this._chunks.length = 0;
    
    console.log('Reset viseme playback controller');
  }

  /**
   * Get current playback time
   */
  currentTime(): number {
    return this.startTime ? performance.now() - this.startTime : this.playbackOffset;
  }

  /**
   * Main playback loop - schedules viseme changes
   */
  private runPlayback(): void {
    if (!this._playing) return;

    const currentTime = this.currentTime();
    
    // Check if we've exceeded audio duration - stop playback if so
    if (this.audioDuration && currentTime > (this.audioDuration * 1000)) {
      console.log(`Viseme playback stopped: exceeded audio duration (${currentTime}ms > ${this.audioDuration * 1000}ms)`);
      this.pause();
      return;
    }

    // Process visemes that should be played at current time
    const maxProcessPerFrame = 50;
    let processed = 0;

    for (let i = this.lastPlayedIndex + 1; i < this._chunks.length && processed < maxProcessPerFrame; i++) {
      const viseme = this._chunks[i];
      
      // Skip visemes that are scheduled beyond audio duration
      if (this.audioDuration && viseme.offset > (this.audioDuration * 1000)) {
        console.log(`Skipping viseme ID ${viseme.visemeId} at ${viseme.offset}ms - beyond audio duration (${this.audioDuration * 1000}ms)`);
        continue;
      }
      
      if (viseme.offset <= currentTime) {
        this.run(viseme.visemeId);
        this.lastPlayedIndex = i;
        this.previousVisemeId = viseme.visemeId;
        processed++;
      } else {
        break; // Stop at first future viseme
      }
    }

    // Continue playback loop only if still playing
    if (this._playing) {
      this.animationFrameId = requestAnimationFrame(() => this.runPlayback());
    }
  }

  /**
   * Execute a single viseme animation
   */
  private run(visemeId: number): void {
    if (!this.riveInputs) {
      console.warn('RiveInputs is null or undefined - skipping viseme animation');
      return;
    }

    // Check if visemeId is supported (100-118 range)
    if (!SUPPORTED_VISEME_IDS.includes(visemeId)) {
      throw new Error(`Unknown viseme id received: ${visemeId}`);
    }

    // Set speaking state
    if (this.setSpeakingState && !this.manualSpeakingStateControl && this.riveInputs.emotions?.is_speaking) {
      this.riveInputs.emotions.is_speaking.value = true;
    }

    // Use viseme ID directly as Rive animation name (no mapping needed)
    const currentInput = this.riveInputs.mouth?.[visemeId];
    const previousInput = this.previousVisemeId !== null ? this.riveInputs.mouth?.[this.previousVisemeId] : null;

    // Apply viseme transitions
    if (currentInput) {
      currentInput.value = this.transitionDuration;
    }

    if (previousInput) {
      previousInput.value = -this.transitionDuration;
    }

    // Log viseme changes occasionally to avoid spam
    if (Math.random() < 0.1) { // Log 10% of viseme changes
      console.log(`Viseme ID: ${visemeId} at offset: ${this.currentTime()}ms`);
    }
  }

  /**
   * Check if currently playing
   */
  get isPlaying(): boolean {
    return this._playing;
  }

  /**
   * Get number of queued visemes
   */
  get visemeCount(): number {
    return this._chunks.length;
  }

  /**
   * Get current viseme data
   */
  get visemes(): VisemeData[] {
    return [...this._chunks];
  }
}
