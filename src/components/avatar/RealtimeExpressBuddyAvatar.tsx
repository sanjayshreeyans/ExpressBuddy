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
  onRiveInputsReady?: (riveInputs: any) => void; // **NEW**: Callback to expose Rive inputs
  visemeService?: any; // For debug info
  silenceDetection?: any; // **NEW**: For displaying silence status
}

export const RealtimeExpressBuddyAvatar: React.FC<RealtimeExpressBuddyAvatarProps> = ({
  className = '',
  visemes = [],
  subtitles = [],
  onAvatarStateChange,
  onPlaybackStateChange,
  onCurrentSubtitleChange,
  onRiveInputsReady, // **NEW**: Callback to expose Rive inputs
  visemeService,
  silenceDetection, // **NEW**
}) => {
  // Debug visemes received by avatar
  useEffect(() => {
    console.log('🎯 RealtimeExpressBuddyAvatar: Props changed - Visemes:', visemes.length, 'Subtitles:', subtitles.length);
    if (visemes.length > 0) {
      console.log('🎯 RealtimeExpressBuddyAvatar: Received visemes:', visemes.slice(0, 3));
    }
  }, [visemes, subtitles]);
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
    src: '/pandabot.riv',
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

      // **NEW**: Expose Rive inputs to parent component
      if (onRiveInputsReady) {
        console.log('🎯 RealtimeExpressBuddyAvatar: Rive inputs ready, calling callback');
        onRiveInputsReady(riveInputs);
      }
    }
  }, [riveInputs, onRiveInputsReady]);

  // Handle real-time visemes - optimized for ultra-fast processing
  useEffect(() => {
    if (!playbackControllerRef.current || !riveInputsInitialized.current) {
      console.log('🚫 RealtimeExpressBuddyAvatar: Viseme processing blocked - Controller:', !!playbackControllerRef.current, 'RiveInputs:', riveInputsInitialized.current);
      return;
    }

    if (visemes.length > 0) {
      // For real-time streaming, immediately start processing new visemes
      console.log('🎯 RealtimeExpressBuddyAvatar: Received real-time visemes:', visemes.length);

      // Only reset if we're not currently playing to avoid interrupting ongoing playback
      if (!playbackControllerRef.current.isPlaying) {
        console.log('🧹 RealtimeExpressBuddyAvatar: Resetting controller (not currently playing)');
        playbackControllerRef.current.reset();

        // Stop any current animation frame to prevent conflicts
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
        }

        visemeStartTime.current = performance.now();
      } else {
        console.log('⏸️ RealtimeExpressBuddyAvatar: Skipping reset - playback in progress');
      }

      // Add new visemes to the queue (this will append if already playing)
      playbackControllerRef.current.add(visemes);

      // Start playback if not already playing
      if (!playbackControllerRef.current.isPlaying) {
        setIsPlaying(true);
        playbackControllerRef.current.play({});

        // Start our timing loop
        const animate = () => {
          const elapsed = (performance.now() - visemeStartTime.current) / 1000;
          setCurrentTime(elapsed);

          // Continue animation if still playing and we have visemes
          if (isPlaying && playbackControllerRef.current?.isPlaying) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else if (elapsed > 5.0) {
            // Auto-stop after 5 seconds of no new visemes
            console.log('🛑 RealtimeExpressBuddyAvatar: Auto-stopping after 5 seconds');
            setIsPlaying(false);
            playbackControllerRef.current?.reset();
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        console.log('▶️ RealtimeExpressBuddyAvatar: Playback already in progress, visemes added to queue');
      }
    } else if (isPlaying) {
      // If no visemes and we're playing, stop after a short delay
      setTimeout(() => {
        if (visemes.length === 0) {
          console.log('🛑 RealtimeExpressBuddyAvatar: Stopping due to no visemes');
          setIsPlaying(false);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
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
        <div className="absolute top-4 right-[-15rem] bg-black bg-opacity-75 text-white p-1 rounded text-xs font-mono">
          <div>Visemes: {visemes.length}</div>
          <div>Subtitles: {subtitles.length}</div>
          <div>Playing: {isPlaying ? '🔴 Yes' : '⚪ No'}</div>
          <div>Time: {currentTime.toFixed(2)}s</div>
          {visemeService && (
            <>
              <div>Latency: {visemeService.processingLatency?.toFixed(1)}ms</div>
              <div>Ultra-fast: {visemeService.isUltraFast ? '⚡' : '🐌'}</div>
            </>
          )}
          {/* **NEW**: Silence detection debug info */}
          {silenceDetection && silenceDetection.config.enabled && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div>Piko Status: {silenceDetection.state.conversationState}</div>
              {silenceDetection.state.nudgeCount > 0 && (
                <div>Tries: {silenceDetection.state.nudgeCount}/{silenceDetection.config.maxNudges}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
