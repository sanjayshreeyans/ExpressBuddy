/**
 * Real-time ExpressBuddy Avatar that uses visemes from the transcription service
 * This version plays visemes in real-time as they come from the WebSocket
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { VisemePlaybackController } from '../../utils/VisemePlaybackController';
import { useRiveInputs } from '../../utils/riveInputs';
import { AvatarState, PlaybackState } from '../../types/avatar';
import { VisemeData, SubtitleData } from '../../lib/viseme-transcription-service';

interface RealtimeExpressBuddyAvatarProps {
  className?: string;
  visemes?: VisemeData[];
  subtitles?: SubtitleData[];
  onAvatarStateChange?: (state: AvatarState) => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  onCurrentSubtitleChange?: (subtitle: string) => void;
  visemeService?: any; // For debug info
}

export const RealtimeExpressBuddyAvatar: React.FC<RealtimeExpressBuddyAvatarProps> = ({
  className = '',
  visemes = [],
  subtitles = [],
  onAvatarStateChange,
  onPlaybackStateChange,
  onCurrentSubtitleChange,
  visemeService,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const playbackControllerRef = useRef<VisemePlaybackController | null>(null);
  const riveInputsInitialized = useRef(false);
  const visemeStartTime = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Rive setup
  const { rive, RiveComponent } = useRive({
    src: '/realistic_female_v1_3.riv',
    stateMachines: 'InLesson',
    artboard: 'Character',
    animations: 'head_idle',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.TopCenter,
    }),
    onLoad: () => setIsLoaded(true),
    onLoadError: (err) => setError('Failed to load avatar animation.'),
  });

  const riveInputs = useRiveInputs(rive);

  // Initialize playback controller
  useEffect(() => {
    if (isLoaded && rive) {
      playbackControllerRef.current = new VisemePlaybackController({
        riveInputs: null as any,
        transitionDuration: 21,
        setSpeakingState: true,
        manualSpeakingStateControl: false,
      });
      riveInputsInitialized.current = false;

      return () => {
        playbackControllerRef.current?.reset();
        playbackControllerRef.current = null;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isLoaded, rive]);

  // Setup rive inputs
  useEffect(() => {
    if (playbackControllerRef.current && riveInputs && riveInputs.mouth && !riveInputsInitialized.current) {
      playbackControllerRef.current.updateRiveInputs(riveInputs);
      riveInputsInitialized.current = true;
    }
  }, [riveInputs]);

  // Handle real-time visemes - optimized for ultra-fast processing
  useEffect(() => {
    if (!playbackControllerRef.current || !riveInputsInitialized.current) {
      return;
    }

    if (visemes.length > 0) {
      // For real-time streaming, immediately start processing new visemes
      console.log('Received real-time visemes:', visemes.length);
      
      // Always reset when new visemes arrive to ensure correct timing for each chunk
      playbackControllerRef.current.reset();
      
      // Add new visemes to the queue
      playbackControllerRef.current.add(visemes);
      
      // Always start fresh playback for new chunk
      visemeStartTime.current = performance.now();
      setIsPlaying(true);
      
      // Start the playback controller
      playbackControllerRef.current.play({});
      
      // Start our timing loop
      const animate = () => {
        const elapsed = (performance.now() - visemeStartTime.current) / 1000;
        setCurrentTime(elapsed);
        
        // Continue animation if still playing and we have visemes
        if (isPlaying && visemes.length > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else if (elapsed > 5.0) {
          // Auto-stop after 5 seconds of no new visemes
          setIsPlaying(false);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (isPlaying) {
      // If no visemes and we're playing, stop after a short delay
      setTimeout(() => {
        if (visemes.length === 0) {
          setIsPlaying(false);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          playbackControllerRef.current?.reset();
        }
      }, 1000); // 1 second grace period
    }
  }, [visemes, isPlaying]);

  // Handle subtitles timing
  useEffect(() => {
    if (subtitles.length > 0 && isPlaying) {
      const currentSubtitle = subtitles.find(
        sub => currentTime >= sub.start && currentTime <= sub.end
      );
      onCurrentSubtitleChange?.(currentSubtitle ? currentSubtitle.text : '');
    } else {
      onCurrentSubtitleChange?.('');
    }
  }, [currentTime, subtitles, isPlaying, onCurrentSubtitleChange]);

  // Update avatar state
  useEffect(() => {
    onAvatarStateChange?.({
      status: isPlaying ? 'speaking' : 'idle',
      isBuffering: false,
      hasGeneratedContent: visemes.length > 0,
    });
  }, [isPlaying, visemes.length, onAvatarStateChange]);

  // Update playback state
  useEffect(() => {
    onPlaybackStateChange?.({ 
      isPlaying, 
      currentTime, 
      duration: visemes.length > 0 ? Math.max(...visemes.map(v => v.offset)) / 1000 : 0
    });
  }, [isPlaying, currentTime, visemes, onPlaybackStateChange]);

  const handleCharacterClick = useCallback(() => {
    if (error) {
      setError(null);
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      playbackControllerRef.current?.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else if (visemes.length > 0) {
      setIsPlaying(true);
      visemeStartTime.current = performance.now();
      playbackControllerRef.current?.play({});
      
      const animate = () => {
        const elapsed = (performance.now() - visemeStartTime.current) / 1000;
        setCurrentTime(elapsed);
        
        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, visemes, error]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <RiveComponent
        className={`panda-container transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleCharacterClick}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="text-center bg-red-100 text-red-700 p-4 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Debug info - Ultra-fast performance monitoring */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
          <div>Visemes: {visemes.length}</div>
          <div>Subtitles: {subtitles.length}</div>
          <div>Playing: {isPlaying ? '🔴 Yes' : '⚪ No'}</div>
          <div>Time: {currentTime.toFixed(2)}s</div>
          {visemeService && (
            <>
              <div>Connected: {visemeService.connected ? '🟢' : '🔴'}</div>
              <div>Latency: {visemeService.processingLatency?.toFixed(1)}ms</div>
              <div>Ultra-fast: {visemeService.isUltraFast ? '⚡' : '🐌'}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
