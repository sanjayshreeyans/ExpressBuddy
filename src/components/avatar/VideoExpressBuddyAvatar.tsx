/**
 * Video-based ExpressBuddy Avatar that uses MP4 animations for idle and talking states
 * This version removes Rive and l  // Handle stat  // Handle state changes based on isListening prop
  useEffect(() => {
    const targetState = isListening ? 'talking' : 'idle';
    
    console.log(`🎭 VideoAvatar: isListening=${isListening}, currentState=${currentState}, targetState=${targetState}`);
    
    if (targetState !== currentState && isLoaded) {
      console.log(`🎭 State transition: ${currentState} -> ${targetState}`);
      setCurrentState(targetState);
      
      if (targetState === 'talking') {
        playTalkingAnimation();
      } else {
        playIdleAnimation();
      }
    }
  }, [isListening, isLoaded]); // Remove currentState dependency to allow transitions on isListening prop
  useEffect(() => {
    const targetState = isListening ? 'talking' : 'idle';
    
    console.log(`🎭 VideoAvatar: isListening=${isListening}, currentState=${currentState}, targetState=${targetState}`);
    
    if (targetState !== currentState && isLoaded) {
      console.log(`🎭 State transition: ${currentState} -> ${targetState}`);
      setCurrentState(targetState);
      
      if (targetState === 'talking') {
        playTalkingAnimation();
      } else {
        playIdleAnimation();
      }
    }
  }, [isListening, currentState, isLoaded]);ty in favor of simple video playback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AvatarState, PlaybackState } from '../../types/avatar';

interface VideoExpressBuddyAvatarProps {
  className?: string;
  isListening?: boolean; // Simple state for talking vs idle
  onAvatarStateChange?: (state: AvatarState) => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  onCurrentSubtitleChange?: (subtitle: string) => void;
  hideDebugInfo?: boolean; // Hide debug overlay for cleaner display
  backgroundSrc?: string; // Background video source path
  disableClickInteraction?: boolean; // Disable click handling to prevent accidental restarts during AI conversations
}

export const VideoExpressBuddyAvatar: React.FC<VideoExpressBuddyAvatarProps> = ({
  className = '',
  isListening = false,
  onAvatarStateChange,
  onPlaybackStateChange,
  onCurrentSubtitleChange,
  hideDebugInfo = false,
  backgroundSrc = '/Backgrounds/Animated_Fall_Scene_background.mp4',
  disableClickInteraction = true, // Default to disabled to prevent accidental clicks during conversations
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentState, setCurrentState] = useState<'idle' | 'talking'>('idle');

  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkingVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>(0);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef<boolean>(true); // Prevent pausing during initialization

  // Video source paths - using WebM with alpha channel for GPU-accelerated transparency
  const idleVideoSrc = '/VideoAnims/Pandaalter1_2.webm';
  const talkingVideoSrc = '/VideoAnims/PandaTalkingAnim.webm';

  // Initialize videos on mount
  useEffect(() => {
    const initializeVideos = async () => {
      try {
        // Set up video event listeners with memory-efficient error handling
        const setupVideo = (video: HTMLVideoElement, isIdleVideo: boolean) => {
          const onLoadedData = () => {
            console.log(`📹 Video loaded: ${isIdleVideo ? 'idle' : 'talking'}`);
            setIsLoaded(true);
          };

          const onError = (e: Event) => {
            console.error(`📹 Video error: ${isIdleVideo ? 'idle' : 'talking'}`, e);
            setError(`Failed to load ${isIdleVideo ? 'idle' : 'talking'} animation.`);
          };

          const onEnded = () => {
            if (video.loop) {
              video.currentTime = 0;
              video.play().catch(console.error);
            }
          };

          video.addEventListener('loadeddata', onLoadedData);
          video.addEventListener('error', onError);
          video.addEventListener('ended', onEnded);

          // Return cleanup function
          return () => {
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            video.removeEventListener('ended', onEnded);
          };
        };

        const cleanupFunctions: (() => void)[] = [];

        if (idleVideoRef.current) {
          cleanupFunctions.push(setupVideo(idleVideoRef.current, true));
        }
        if (talkingVideoRef.current) {
          cleanupFunctions.push(setupVideo(talkingVideoRef.current, false));
        }

        // Setup background video with cleanup
        if (backgroundVideoRef.current) {
          console.log('🎬 Setting up background video:', backgroundSrc);
          const bgVideo = backgroundVideoRef.current;

          const onBgLoadedData = () => console.log('✅ Background video loaded successfully');
          const onBgError = (e: Event) => {
            console.error('❌ Background video error:', e);
            console.error('Video source:', backgroundSrc);
          };

          bgVideo.addEventListener('loadeddata', onBgLoadedData);
          bgVideo.addEventListener('error', onBgError);

          bgVideo.play()
            .then(() => console.log('▶️ Background video playing'))
            .catch(err => console.error('❌ Background video play error:', err));

          cleanupFunctions.push(() => {
            bgVideo.removeEventListener('loadeddata', onBgLoadedData);
            bgVideo.removeEventListener('error', onBgError);
          });
        }

        // Start with idle animation
        setCurrentState('idle');

        // Start both videos playing immediately for seamless transitions
        if (idleVideoRef.current) {
          idleVideoRef.current.currentTime = 0;
          await idleVideoRef.current.play();
        }

        if (talkingVideoRef.current) {
          talkingVideoRef.current.currentTime = 0;
          await talkingVideoRef.current.play();
        }

        console.log('📹 Both videos initialized and playing continuously');

        // Mark initialization as complete after a short delay
        setTimeout(() => {
          isInitializingRef.current = false;
          console.log('✅ Video initialization complete, IntersectionObserver active');
        }, 500);

        // Store cleanup functions for unmount
        return () => {
          cleanupFunctions.forEach(cleanup => cleanup());
        };

      } catch (err) {
        console.error('📹 Error initializing videos:', err);
        setError('Failed to initialize avatar animations.');
        isInitializingRef.current = false; // Reset flag on error too
      }
    };

    const cleanup = initializeVideos();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Visibility-based resource management for Chromebooks/mobile
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1, // Trigger when at least 10% visible
    };

    intersectionObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Skip intersection changes during initialization to prevent play/pause conflicts
        if (isInitializingRef.current) {
          console.log('📹 Skipping intersection handling during initialization');
          return;
        }

        const videos = [idleVideoRef.current, talkingVideoRef.current, backgroundVideoRef.current].filter(Boolean);

        if (!entry.isIntersecting) {
          // Pause videos when off-screen to save memory/battery
          console.log('📹 Avatar off-screen, pausing videos for performance');
          videos.forEach(video => video?.pause());
        } else {
          // Resume videos when back on-screen
          console.log('📹 Avatar visible, resuming videos');
          videos.forEach(video => {
            if (video && video.paused) {
              video.play().catch(console.error);
            }
          });
        }
      });
    }, options);

    intersectionObserverRef.current.observe(containerRef.current);

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Helper function to play idle animation
  const playIdleAnimation = async () => {
    if (!idleVideoRef.current || !talkingVideoRef.current) return;

    try {
      // Keep both videos playing continuously
      if (idleVideoRef.current.paused) {
        await idleVideoRef.current.play();
      }
      if (talkingVideoRef.current.paused) {
        await talkingVideoRef.current.play();
      }

      console.log('📹 Transitioned to idle animation (seamless)');
    } catch (err) {
      console.error('📹 Error transitioning to idle animation:', err);
    }
  };

  // Helper function to play talking animation
  const playTalkingAnimation = async () => {
    if (!talkingVideoRef.current || !idleVideoRef.current) return;

    try {
      // Keep both videos playing continuously
      if (talkingVideoRef.current.paused) {
        await talkingVideoRef.current.play();
      }
      if (idleVideoRef.current.paused) {
        await idleVideoRef.current.play();
      }

      console.log('📹 Transitioned to talking animation (seamless)');
    } catch (err) {
      console.error('📹 Error transitioning to talking animation:', err);
    }
  };

  // Handle state changes based on isListening prop
  useEffect(() => {
    const targetState = isListening ? 'talking' : 'idle';

    if (targetState !== currentState && isLoaded) {
      console.log(`� State transition: ${currentState} -> ${targetState}`);
      setCurrentState(targetState);

      if (targetState === 'talking') {
        playTalkingAnimation();
      } else {
        playIdleAnimation();
      }
    }
  }, [isListening, currentState, isLoaded]);

  // Update current time for debug purposes (optimized with throttling)
  useEffect(() => {
    if (!isLoaded) return;

    let lastUpdateTime = 0;
    const throttleMs = 100; // Update every 100ms instead of every frame

    const updateTime = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= throttleMs) {
        const activeVideo = currentState === 'talking' ? talkingVideoRef.current : idleVideoRef.current;
        if (activeVideo && !activeVideo.paused) {
          setCurrentTime(activeVideo.currentTime);
        }
        lastUpdateTime = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoaded, currentState]);

  // Update avatar state
  useEffect(() => {
    onAvatarStateChange?.({
      status: currentState === 'talking' ? 'speaking' : 'idle',
      isBuffering: !isLoaded,
      hasGeneratedContent: isLoaded,
    });
  }, [currentState, isLoaded, onAvatarStateChange]);

  // Update playback state
  useEffect(() => {
    const activeVideo = currentState === 'talking' ? talkingVideoRef.current : idleVideoRef.current;
    onPlaybackStateChange?.({
      isPlaying: activeVideo ? !activeVideo.paused : false,
      currentTime,
      duration: activeVideo?.duration || 0
    });
  }, [currentState, currentTime, onPlaybackStateChange]);

  const handleCharacterClick = useCallback(() => {
    // Prevent click interaction if disabled (during active conversations)
    if (disableClickInteraction) {
      console.log('🚫 Click interaction disabled - preventing accidental playback restart');
      return;
    }

    if (error) {
      setError(null);
      return;
    }

    // Toggle between idle and talking for demo purposes
    const newState = currentState === 'idle' ? 'talking' : 'idle';
    setCurrentState(newState);

    if (newState === 'talking') {
      playTalkingAnimation();
    } else {
      playIdleAnimation();
    }
  }, [currentState, error, disableClickInteraction]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {/* Debug info - only show if not hidden and in development */}
      {!hideDebugInfo && process.env.NODE_ENV === 'development' && (
        <div
          className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono"
          style={{ zIndex: 20 }}
        >
          <div>State: {currentState}</div>
          <div>Listening: {isListening ? '🔴 Yes' : '⚪ No'}</div>
          <div>Loaded: {isLoaded ? '✅' : '❌'}</div>
          <div>Time: {currentTime.toFixed(2)}s</div>
          {/* Removed silence detection status - now using manual hint system */}
        </div>
      )}

      {/* Background Video Layer - plays behind EVERYTHING (fixed to viewport) */}
      {backgroundSrc && (
        <video
          ref={backgroundVideoRef}
          src={backgroundSrc}
          className="fixed"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            minWidth: '100vw',
            minHeight: '100vh',
            zIndex: -10, // **FIXED**: Behind everything including header
            pointerEvents: 'none',
            objectFit: 'cover',
            margin: 0,
            padding: 0
          }}
          loop
          muted
          playsInline
          autoPlay
          preload="auto"
          onLoadedData={() => console.log('🎬 Background video loaded and ready')}
          onError={(e) => console.error('❌ Background video element error:', e)}
        />
      )}

      {/* Talking Video - Base layer */}
      <video
        ref={talkingVideoRef}
        src={talkingVideoSrc}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 10,
          opacity: currentState === 'talking' ? 1 : 0,
          pointerEvents: currentState === 'talking' ? 'auto' : 'none',
          cursor: disableClickInteraction ? 'default' : 'pointer',
          objectFit: 'contain',
          width: '100%',
          height: '100%',
        }}
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onClick={handleCharacterClick}
      />

      {/* Idle Video - Top layer */}
      <video
        ref={idleVideoRef}
        src={idleVideoSrc}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 11,
          opacity: currentState === 'idle' ? 1 : 0,
          pointerEvents: currentState === 'idle' ? 'auto' : 'none',
          cursor: disableClickInteraction ? 'default' : 'pointer',
          objectFit: 'contain',
          width: '100%',
          height: '100%',
        }}
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
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
    </div>
  );
};
