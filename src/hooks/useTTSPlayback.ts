import { useEffect, useRef, useState, useCallback } from 'react';
import { TTSPlaybackController, TTSPlaybackCallbacks } from '../services/emotion-detective/TTSPlaybackController';
import { TTSRequest } from '../types/emotion-detective';

export interface TTSPlaybackState {
  isPlaying: boolean;
  error: string | null;
  isSupported: boolean;
}

export interface TTSPlaybackActions {
  speak: (request: TTSRequest) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getVoices: () => Promise<string[]>;
  getChildFriendlyVoices: () => Promise<string[]>;
  createSpeakerButton: (text: string, options?: Partial<TTSRequest>) => React.ComponentProps<'button'>;
}

/**
 * React hook for TTS playback
 * Provides easy-to-use interface for speech synthesis
 */
export function useTTSPlayback(): [TTSPlaybackState, TTSPlaybackActions] {
  const [state, setState] = useState<TTSPlaybackState>({
    isPlaying: false,
    error: null,
    isSupported: true
  });

  const controllerRef = useRef<TTSPlaybackController | null>(null);
  const mountedRef = useRef(true);

  // Initialize controller
  useEffect(() => {
    controllerRef.current = new TTSPlaybackController();

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
      onError: (error: string) => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, error, isPlaying: false }));
        }
      }
    };

    controllerRef.current.setCallbacks(callbacks);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
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
    getVoices,
    getChildFriendlyVoices,
    createSpeakerButton
  };

  return [state, actions];
}

/**
 * Simple hook for just speaking text without full playback control
 * Useful for quick TTS without complex integration
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

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = (event) => {
          setIsPlaying(false);
          setError(event.error);
          reject(new Error(event.error));
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        setIsPlaying(false);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        reject(err);
      }
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    error,
    isSupported: 'speechSynthesis' in window
  };
}
