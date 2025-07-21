import { useEffect, useRef, useState, useCallback } from 'react';
import { TTSPlaybackController, TTSPlaybackCallbacks } from '../services/emotion-detective/TTSPlaybackController';
import { VisemeData, SubtitleData } from '../lib/viseme-transcription-service';
import { RiveInputs } from '../types/avatar';
import { TTSRequest } from '../types/emotion-detective';

export interface UseTTSPlaybackOptions {
  riveInputs?: RiveInputs;
  transitionDuration?: number;
  setSpeakingState?: boolean;
  manualSpeakingStateControl?: boolean;
  autoConnect?: boolean;
}

export interface TTSPlaybackState {
  isPlaying: boolean;
  isConnected: boolean;
  currentSubtitle: string;
  error: string | null;
  isSupported: boolean;
  visemes: VisemeData[];
  subtitles: SubtitleData[];
}

export interface TTSPlaybackActions {
  speak: (request: TTSRequest) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  updateRiveInputs: (riveInputs: RiveInputs) => void;
  getVoices: () => Promise<string[]>;
  getChildFriendlyVoices: () => Promise<string[]>;
  createSpeakerButton: (text: string, options?: Partial<TTSRequest>) => React.ComponentProps<'button'>;
}

/**
 * React hook for TTS playback with viseme integration
 * Provides easy-to-use interface for Pico avatar speech with lip-sync
 */
export function useTTSPlayback(options: UseTTSPlaybackOptions = {}): [TTSPlaybackState, TTSPlaybackActions] {
  const [state, setState] = useState<TTSPlaybackState>({
    isPlaying: false,
    isConnected: false,
    currentSubtitle: '',
    error: null,
    isSupported: true,
    visemes: [],
    subtitles: []
  });

  const controllerRef = useRef<TTSPlaybackController | null>(null);
  const mountedRef = useRef(true);

  // Initialize controller
  useEffect(() => {
    controllerRef.current = new TTSPlaybackController(options);

    // Setup callbacks
    const callbacks: TTSPlaybackCallbacks = {
      onPlaybackStart: () => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, isPlaying: true, error: null }));
        }
      },
      onPlaybackEnd: () => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, isPlaying: false }));
        }
      },
      onCurrentSubtitle: (subtitle: string) => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, currentSubtitle: subtitle }));
        }
      },
      onError: (error: string) => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, error, isPlaying: false }));
        }
      },
      onVisemes: (visemes: VisemeData[], subtitles: SubtitleData[]) => {
        console.log('🎯 useTTSPlayback: Received visemes and subtitles', {
          visemes: visemes.length,
          subtitles: subtitles.length
        });
        if (mountedRef.current) {
          console.log('🎯 useTTSPlayback: Setting visemes in state:', visemes.length);
          setState(prev => ({
            ...prev,
            visemes: [...visemes], // Create new array to ensure state update
            subtitles: [...subtitles] // Create new array to ensure state update
          }));
        }
      },
      onStreamingChunk: (chunkText: string, visemes: VisemeData[]) => {
        console.log('⚡ useTTSPlayback: Received streaming chunk', {
          text: chunkText,
          visemes: visemes.length
        });
        if (mountedRef.current) {
          // For streaming, append to existing visemes
          setState(prev => ({ ...prev, visemes: [...prev.visemes, ...visemes] }));
        }
      }
    };

    controllerRef.current.setCallbacks(callbacks);

    // Check if TTS is supported
    setState(prev => ({
      ...prev,
      isSupported: controllerRef.current?.isSupported || false,
      isConnected: controllerRef.current?.isVisemeServiceConnected || false
    }));

    // Auto-connect if requested
    if (options.autoConnect !== false) {
      // Check connection status periodically
      const checkConnection = () => {
        if (controllerRef.current && mountedRef.current) {
          const connected = controllerRef.current.isVisemeServiceConnected;
          setState(prev => ({ ...prev, isConnected: connected }));
        }
      };

      const connectionInterval = setInterval(checkConnection, 1000);
      checkConnection(); // Initial check

      return () => {
        clearInterval(connectionInterval);
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.disconnect();
      }
    };
  }, []);

  // Actions
  const speak = useCallback(async (request: TTSRequest): Promise<void> => {
    if (!controllerRef.current) {
      throw new Error('TTS controller not initialized');
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      await controllerRef.current.speak(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error';
      setState(prev => ({ ...prev, error: errorMessage, isPlaying: false }));
      throw error;
    }
  }, []);

  const stop = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop();
    }
  }, []);

  const pause = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.resume();
    }
  }, []);

  const updateRiveInputs = useCallback((riveInputs: RiveInputs) => {
    if (controllerRef.current) {
      controllerRef.current.updateRiveInputs(riveInputs, options);
    }
  }, [options]);

  const getVoices = useCallback(async (): Promise<string[]> => {
    return await controllerRef.current?.getVoices() || [];
  }, []);

  const getChildFriendlyVoices = useCallback(async (): Promise<string[]> => {
    return await controllerRef.current?.getChildFriendlyVoices() || [];
  }, []);

  /**
   * Create props for a speaker button that will speak the given text
   * This is the speaker icon functionality mentioned in the requirements
   */
  const createSpeakerButton = useCallback((text: string, ttsOptions: Partial<TTSRequest> = {}) => {
    return {
      onClick: async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          // Stop any current speech first
          stop();

          // Speak the text
          await speak({
            text,
            ...ttsOptions
          });
        } catch (error) {
          console.error('❌ Speaker button error:', error);
        }
      },
      disabled: !state.isSupported || state.isPlaying,
      'aria-label': `Read aloud: ${text}`,
      title: state.isPlaying ? 'Currently speaking...' : `Click to read: "${text}"`,
      type: 'button' as const
    };
  }, [speak, stop, state.isSupported, state.isPlaying]);

  const actions: TTSPlaybackActions = {
    speak,
    stop,
    pause,
    resume,
    updateRiveInputs,
    getVoices,
    getChildFriendlyVoices,
    createSpeakerButton
  };

  return [state, actions];
}

/**
 * Simple hook for just speaking text without full playback control
 * Useful for quick TTS without viseme integration
 */
export function useSimpleTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options: Partial<TTSRequest> = {}) => {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.speed || 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Set voice if specified
        if (options.voiceId) {
          const voices = window.speechSynthesis.getVoices();
          const selectedVoice = voices.find(voice => voice.name === options.voiceId);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onstart = () => {
          setIsPlaying(true);
          setError(null);
        };

        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };

        utterance.onerror = (event) => {
          setIsPlaying(false);
          const errorMessage = `TTS Error: ${event.error}`;
          setError(errorMessage);
          reject(new Error(errorMessage));
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        setIsPlaying(false);
        const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error';
        setError(errorMessage);
        reject(error);
      }
    });
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    error,
    isSupported: 'speechSynthesis' in window
  };
}