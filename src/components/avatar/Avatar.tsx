/**
 * ExpressBuddy Avatar Component
 * Integrates Rive avatar animation with Kokoro TTS backend
 * Replaces Logger component for AI response display
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRive } from '@rive-app/react-canvas';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useLoggerStore } from '../../lib/store-logger';
import { useRiveInputs } from '../../hooks/use-rive-inputs';
import { VisemePlaybackController, VisemeData } from '../../lib/viseme-controller';
import './avatar.scss';

interface AvatarState {
  NEUTRAL: string;
  LISTENING: string;
  THINKING: string;
  SPEAKING: string;
  ERROR: string;
}

const AVATAR_STATES: AvatarState = {
  NEUTRAL: 'neutral',
  LISTENING: 'listening', 
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error'
};

interface TtsResponse {
  audio_url: string;
  visemes: VisemeData[];
}

interface AvatarProps {
  kokoroBackendUrl?: string;
  selectedVoice?: string;
}

export default function Avatar({ 
  kokoroBackendUrl = 'http://localhost:8000',
  selectedVoice = 'af'
}: AvatarProps) {
  const { client, connected } = useLiveAPIContext();
  const { logs } = useLoggerStore();
  
  // State management
  const [currentState, setCurrentState] = useState<string>(AVATAR_STATES.NEUTRAL);
  const [responseBuffer, setResponseBuffer] = useState<string>('');
  const [isProcessingResponse, setIsProcessingResponse] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Refs for cleanup and controllers
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visemeControllerRef = useRef<VisemePlaybackController | null>(null);
  
  // Rive animation setup
  const { rive, RiveComponent } = useRive({
    src: '/pandabot.riv',
    stateMachines: 'InLesson',
    artboard: 'Character',
    animations: 'head_idle',
    autoplay: true,
    onLoadError: (error: any) => {
      console.error('Failed to load Rive animation:', error);
      setCurrentState(AVATAR_STATES.ERROR);
    },
    onLoad: () => {
      console.log('Rive animation loaded successfully');
      setCurrentState(AVATAR_STATES.NEUTRAL);
    }
  });

  // Get Rive inputs for controlling the avatar
  const riveInputs = useRiveInputs(rive);

  // Initialize viseme controller when Rive is loaded
  useEffect(() => {
    if (rive && riveInputs) {
      visemeControllerRef.current = new VisemePlaybackController(riveInputs);
      console.log('Viseme controller initialized');
    }
  }, [rive, riveInputs]);

  // Function to send text to Kokoro TTS backend
  const generateTtsAndVisemes = useCallback(async (text: string): Promise<TtsResponse | null> => {
    try {
      const response = await fetch(`${kokoroBackendUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('TTS response received:', data);
      return data;
    } catch (error) {
      console.error('Error generating TTS:', error);
      return null;
    }
  }, [kokoroBackendUrl, selectedVoice]);

  // Function to play audio and animate visemes
  const playTtsWithAnimation = useCallback(async (ttsResponse: TtsResponse) => {
    try {
      setCurrentState(AVATAR_STATES.SPEAKING);
      
      // Create and setup audio with proper CORS and error handling
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audioRef.current = audio;
      setCurrentAudio(audio);

      // Set up audio event listeners
      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });

      audio.addEventListener('canplay', () => {
        console.log('Audio ready to play');
      });

      audio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded');
      });

      audio.addEventListener('ended', () => {
        console.log('Audio playback ended');
        setCurrentState(AVATAR_STATES.NEUTRAL);
        setCurrentAudio(null);
        
        // Stop viseme animation
        if (visemeControllerRef.current) {
          visemeControllerRef.current.stop();
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e, 'Audio URL:', ttsResponse.audio_url);
        setCurrentState(AVATAR_STATES.ERROR);
        setCurrentAudio(null);
        
        // Stop viseme animation on error
        if (visemeControllerRef.current) {
          visemeControllerRef.current.stop();
        }
        
        // Show error briefly then return to neutral
        setTimeout(() => {
          setCurrentState(AVATAR_STATES.NEUTRAL);
        }, 3000);
      });

      // Load visemes into controller before starting audio
      if (visemeControllerRef.current && ttsResponse.visemes) {
        visemeControllerRef.current.loadVisemes(ttsResponse.visemes);
      }

      // Set audio source and load
      audio.src = ttsResponse.audio_url;
      audio.load();

      // Start audio and viseme playback
      try {
        await audio.play();
        console.log('Audio playbook started successfully');
        
        // Start viseme animation
        if (visemeControllerRef.current) {
          visemeControllerRef.current.start();
          console.log('Viseme animation started');
        }
      } catch (playError) {
        console.error('Failed to start audio playback:', playError);
        setCurrentState(AVATAR_STATES.ERROR);
        
        // Show error briefly then return to neutral
        setTimeout(() => {
          setCurrentState(AVATAR_STATES.NEUTRAL);
        }, 3000);
      }

    } catch (error) {
      console.error('Error in TTS playback:', error);
      setCurrentState(AVATAR_STATES.ERROR);
      setTimeout(() => {
        setCurrentState(AVATAR_STATES.NEUTRAL);
      }, 3000);
    }
  }, []);

  // Extract text from model turn parts
  const extractTextFromModelTurn = useCallback((parts: any[]): string => {
    return parts
      .filter(part => part.text && part.text.trim() !== '' && part.text !== '\n')
      .map(part => part.text)
      .join(' ')
      .trim();
  }, []);

  // Monitor logs for complete AI responses with stable dependencies
  useEffect(() => {
    if (!logs.length) return;

    const latestLog = logs[logs.length - 1];
    
    // Check for model turn content (AI response)
    if (latestLog.type === 'server.content' && 
        typeof latestLog.message === 'object' && 
        'serverContent' in latestLog.message) {
      
      const serverContent = latestLog.message.serverContent;
      
      if (serverContent && 'modelTurn' in serverContent && serverContent.modelTurn?.parts) {
        const textContent = extractTextFromModelTurn(serverContent.modelTurn.parts);
        
        if (textContent) {
          // Accumulate text chunks
          setResponseBuffer(prev => {
            const newBuffer = prev + ' ' + textContent;
            console.log('Buffer updated:', newBuffer.length, 'chars');
            return newBuffer;
          });
        }
      }
      
      // Check for turn completion
      if (serverContent && 'turnComplete' in serverContent && serverContent.turnComplete) {
        handleCompleteResponse();
      }
    }
    
    // Handle turn complete signal
    if (latestLog.type === 'server.content' && latestLog.message === 'turnComplete') {
      handleCompleteResponse();
    }
    
  }, [logs.length, extractTextFromModelTurn]); // Stable dependencies

  // Handle complete response - send to TTS and animate avatar
  const handleCompleteResponse = useCallback(async () => {
    if (!responseBuffer.trim() || isProcessingResponse) {
      return;
    }

    console.log('Processing complete response:', responseBuffer.substring(0, 100) + '...');
    setIsProcessingResponse(true);
    setCurrentState(AVATAR_STATES.THINKING);

    try {
      const ttsResponse = await generateTtsAndVisemes(responseBuffer);
      
      if (ttsResponse) {
        await playTtsWithAnimation(ttsResponse);
      } else {
        console.error('Failed to generate TTS response');
        setCurrentState(AVATAR_STATES.ERROR);
        setTimeout(() => setCurrentState(AVATAR_STATES.NEUTRAL), 3000);
      }
    } catch (error) {
      console.error('Error processing complete response:', error);
      setCurrentState(AVATAR_STATES.ERROR);
      setTimeout(() => setCurrentState(AVATAR_STATES.NEUTRAL), 3000);
    } finally {
      // Clear buffer and reset processing state
      setResponseBuffer('');
      setIsProcessingResponse(false);
    }
  }, [responseBuffer, isProcessingResponse, generateTtsAndVisemes, playTtsWithAnimation]);

  // Monitor connection state
  useEffect(() => {
    if (connected) {
      setCurrentState(AVATAR_STATES.LISTENING);
    } else {
      setCurrentState(AVATAR_STATES.NEUTRAL);
    }
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      if (visemeControllerRef.current) {
        visemeControllerRef.current.reset();
      }
    };
  }, [currentAudio]);

  // Handle user interaction states
  useEffect(() => {
    if (!client) return;

    const handleInterrupted = () => {
      // Stop current audio and reset to listening state
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      if (visemeControllerRef.current) {
        visemeControllerRef.current.stop();
      }
      setResponseBuffer('');
      setIsProcessingResponse(false);
      setCurrentState(AVATAR_STATES.LISTENING);
    };

    const handleTurnComplete = () => {
      // Return to neutral state when user's turn is complete
      if (currentState === AVATAR_STATES.LISTENING) {
        setCurrentState(AVATAR_STATES.NEUTRAL);
      }
    };

    client.on('interrupted', handleInterrupted);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('interrupted', handleInterrupted);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client, currentAudio, currentState]);

  return (
    <div className={`avatar-container ${connected ? 'connected' : 'disconnected'} ${currentState}`}>
      <div className="avatar-display">
        <RiveComponent className="rive-avatar" />
        <div className="avatar-status">
          <span className={`status-indicator ${currentState}`}>
            {currentState === AVATAR_STATES.NEUTRAL && '✨'}
            {currentState === AVATAR_STATES.LISTENING && '👂'}
            {currentState === AVATAR_STATES.THINKING && '�'}
            {currentState === AVATAR_STATES.SPEAKING && '�'}
            {currentState === AVATAR_STATES.ERROR && '⚠️'}
          </span>
          <span className="status-text">
            {currentState === AVATAR_STATES.NEUTRAL && 'Ready to Chat'}
            {currentState === AVATAR_STATES.LISTENING && 'Listening...'}
            {currentState === AVATAR_STATES.THINKING && 'Processing...'}
            {currentState === AVATAR_STATES.SPEAKING && 'Speaking...'}
            {currentState === AVATAR_STATES.ERROR && 'Connection Error'}
          </span>
        </div>
      </div>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="avatar-debug">
          <div>State: {currentState}</div>
          <div>Connected: {connected ? 'Yes' : 'No'}</div>
          <div>Buffer Length: {responseBuffer.length}</div>
          <div>Processing: {isProcessingResponse ? 'Yes' : 'No'}</div>
          <div>Rive Loaded: {rive ? 'Yes' : 'No'}</div>
          <div>Inputs Available: {riveInputs ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}
