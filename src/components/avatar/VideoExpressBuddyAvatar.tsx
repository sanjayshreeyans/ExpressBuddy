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
}

export const VideoExpressBuddyAvatar: React.FC<VideoExpressBuddyAvatarProps> = ({
  className = '',
  isListening = false,
  onAvatarStateChange,
  onPlaybackStateChange,
  onCurrentSubtitleChange,
  hideDebugInfo = false,
  backgroundSrc = '/Backgrounds/AnimatedVideoBackgroundLooping1.mp4',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentState, setCurrentState] = useState<'idle' | 'talking'>('idle');

  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkingVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const idleCanvasRef = useRef<HTMLCanvasElement>(null);
  const talkingCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const chromaKeyFrameRef = useRef<number>(0);

  // Video source paths
  const idleVideoSrc = '/VideoAnims/Pandaalter1_2.mp4';
  const talkingVideoSrc = '/VideoAnims/PandaTalkingAnim.mp4';

  // Initialize videos on mount
  useEffect(() => {
    const initializeVideos = async () => {
      try {
        // Set up video event listeners
        const setupVideo = (video: HTMLVideoElement, isIdleVideo: boolean) => {
          video.addEventListener('loadeddata', () => {
            console.log(`📹 Video loaded: ${isIdleVideo ? 'idle' : 'talking'}`);
            setIsLoaded(true);
          });

          video.addEventListener('error', (e) => {
            console.error(`📹 Video error: ${isIdleVideo ? 'idle' : 'talking'}`, e);
            setError(`Failed to load ${isIdleVideo ? 'idle' : 'talking'} animation.`);
          });

          video.addEventListener('ended', () => {
            if (video.loop) {
              video.currentTime = 0;
              video.play().catch(console.error);
            }
          });
        };

        if (idleVideoRef.current) {
          setupVideo(idleVideoRef.current, true);
        }
        if (talkingVideoRef.current) {
          setupVideo(talkingVideoRef.current, false);
        }

        // Setup background video
        if (backgroundVideoRef.current) {
          console.log('🎬 Setting up background video:', backgroundSrc);
          backgroundVideoRef.current.addEventListener('loadeddata', () => {
            console.log('✅ Background video loaded successfully');
          });
          backgroundVideoRef.current.addEventListener('error', (e) => {
            console.error('❌ Background video error:', e);
            console.error('Video source:', backgroundSrc);
          });
          backgroundVideoRef.current.play()
            .then(() => console.log('▶️ Background video playing'))
            .catch(err => console.error('❌ Background video play error:', err));
        }

        // Start with idle animation
        setCurrentState('idle');

        // Initialize canvas opacity states
        if (idleCanvasRef.current) {
          idleCanvasRef.current.style.opacity = '1';
          idleCanvasRef.current.style.pointerEvents = 'auto';
        }
        if (talkingCanvasRef.current) {
          talkingCanvasRef.current.style.opacity = '0';
          talkingCanvasRef.current.style.pointerEvents = 'none';
        }

        // Start both videos playing immediately for seamless transitions
        if (idleVideoRef.current) {
          idleVideoRef.current.currentTime = 0;
          await idleVideoRef.current.play();
          if (idleCanvasRef.current) {
            applyChromaKey(idleVideoRef.current, idleCanvasRef.current);
          }
        }

        if (talkingVideoRef.current) {
          talkingVideoRef.current.currentTime = 0;
          await talkingVideoRef.current.play();
          if (talkingCanvasRef.current) {
            // Start rendering talking video in background (hidden by opacity)
            applyChromaKey(talkingVideoRef.current, talkingCanvasRef.current);
          }
        }

        console.log('📹 Both videos initialized and playing continuously');

      } catch (err) {
        console.error('📹 Error initializing videos:', err);
        setError('Failed to initialize avatar animations.');
      }
    };

    initializeVideos();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (chromaKeyFrameRef.current) {
        cancelAnimationFrame(chromaKeyFrameRef.current);
      }
    };
  }, []);

  // Chroma key effect - removes green background from video
  // Continuously renders to canvas for seamless transitions
  // Optimized for 60fps with cached context and efficient pixel processing
  const applyChromaKey = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    // Cache the context to avoid repeated getContext calls
    let ctx = (canvas as any)._cachedCtx;
    if (!ctx) {
      ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: true, // Enable alpha for transparency
      });
      (canvas as any)._cachedCtx = ctx;
    }

    if (!ctx || video.ended || video.paused) return;

    // Set canvas size to match video (only if needed)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(`📐 Canvas resized to ${canvas.width}x${canvas.height}`);
    }

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Chroma key: remove green-screen pixels using green-dominance test
    // Optimized loop with minimal branching for 60fps performance
    const minGreen = 100; // minimum green channel value to consider (0-255)
    const ratio = 1.4; // green must be > ratio * red and > ratio * blue
    const dataLength = data.length;

    for (let i = 0; i < dataLength; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Green-dominant detection with early exit optimization
      if (g > minGreen) {
        const rThreshold = r * ratio;
        const bThreshold = b * ratio;
        if (g > rThreshold && g > bThreshold) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
    }

    // Put modified image data back
    ctx.putImageData(imageData, 0, 0);

    // Continue rendering continuously for seamless transitions
    // Using requestAnimationFrame ensures smooth 60fps rendering
    requestAnimationFrame(() => applyChromaKey(video, canvas));
  }, []);

  // Helper function to play idle animation
  const playIdleAnimation = async () => {
    if (!idleVideoRef.current || !talkingVideoRef.current) return;

    try {
      // Keep both videos playing continuously - never pause
      // Just ensure both are playing (in case user interaction was needed)
      if (idleVideoRef.current.paused) {
        await idleVideoRef.current.play();
      }
      if (talkingVideoRef.current.paused) {
        await talkingVideoRef.current.play();
      }

      // Smooth opacity transition - hide talking, show idle
      if (talkingCanvasRef.current) {
        talkingCanvasRef.current.style.opacity = '0';
        talkingCanvasRef.current.style.pointerEvents = 'none';
      }
      if (idleCanvasRef.current) {
        idleCanvasRef.current.style.opacity = '1';
        idleCanvasRef.current.style.pointerEvents = 'auto';
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
      // Keep both videos playing continuously - never pause
      // Just ensure both are playing (in case user interaction was needed)
      if (talkingVideoRef.current.paused) {
        await talkingVideoRef.current.play();
      }
      if (idleVideoRef.current.paused) {
        await idleVideoRef.current.play();
      }

      // Smooth opacity transition - hide idle, show talking
      if (idleCanvasRef.current) {
        idleCanvasRef.current.style.opacity = '0';
        idleCanvasRef.current.style.pointerEvents = 'none';
      }
      if (talkingCanvasRef.current) {
        talkingCanvasRef.current.style.opacity = '1';
        talkingCanvasRef.current.style.pointerEvents = 'auto';
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

  // Update current time for debug purposes
  useEffect(() => {
    const updateTime = () => {
      const activeVideo = currentState === 'talking' ? talkingVideoRef.current : idleVideoRef.current;
      if (activeVideo && !activeVideo.paused) {
        setCurrentTime(activeVideo.currentTime);
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    if (isLoaded) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }

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
  }, [currentState, error]);

  return (
    <div className={`relative h-full w-full ${className}`}>
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
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -10, // **FIXED**: Behind everything including header
            pointerEvents: 'none',
            objectFit: 'cover'
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

      {/* Hidden video elements - used as source for canvas rendering */}
      <video
        ref={idleVideoRef}
        src={idleVideoSrc}
        style={{ display: 'none' }}
        loop
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={talkingVideoRef}
        src={talkingVideoSrc}
        style={{ display: 'none' }}
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Canvas for Idle Video - with chroma key applied */}
      <canvas
        ref={idleCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: currentState === 'idle' ? 11 : 10,
          opacity: 1, // Always fully opaque
          pointerEvents: currentState === 'idle' ? 'auto' : 'none',
          cursor: 'pointer',
          objectFit: 'contain',
          width: '100%',
          height: '100%',
          transition: 'z-index 0s linear 0.15s', // Delay z-index change until after crossfade
        }}
        onClick={handleCharacterClick}
      />

      {/* Canvas for Talking Video - with chroma key applied */}
      <canvas
        ref={talkingCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: currentState === 'talking' ? 11 : 10,
          opacity: 1, // Always fully opaque
          pointerEvents: currentState === 'talking' ? 'auto' : 'none',
          cursor: 'pointer',
          objectFit: 'contain',
          width: '100%',
          height: '100%',
          transition: 'z-index 0s linear 0.15s', // Delay z-index change until after crossfade
        }}
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
