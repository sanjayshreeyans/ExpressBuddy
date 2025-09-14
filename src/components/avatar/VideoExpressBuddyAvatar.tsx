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
}

export const VideoExpressBuddyAvatar: React.FC<VideoExpressBuddyAvatarProps> = ({
  className = '',
  isListening = false,
  onAvatarStateChange,
  onPlaybackStateChange,
  onCurrentSubtitleChange,
  hideDebugInfo = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentState, setCurrentState] = useState<'idle' | 'talking'>('idle');

  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkingVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>(0);

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

        // Start with idle animation
        setCurrentState('idle');
        
        // Initialize video opacity states
        if (idleVideoRef.current) {
          idleVideoRef.current.style.opacity = '1';
          idleVideoRef.current.style.pointerEvents = 'auto';
        }
        if (talkingVideoRef.current) {
          talkingVideoRef.current.style.opacity = '0';
          talkingVideoRef.current.style.pointerEvents = 'none';
        }
        
        await playIdleAnimation();
        
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
    };
  }, []);

  // Helper function to play idle animation
  const playIdleAnimation = async () => {
    if (!idleVideoRef.current) return;
    
    try {
      // Pause talking video, show idle video
      if (talkingVideoRef.current) {
        talkingVideoRef.current.pause();
        talkingVideoRef.current.style.opacity = '0';
        talkingVideoRef.current.style.pointerEvents = 'none';
      }
      
      idleVideoRef.current.style.opacity = '1';
      idleVideoRef.current.style.pointerEvents = 'auto';
      idleVideoRef.current.currentTime = 0;
      await idleVideoRef.current.play();
      console.log('📹 Playing idle animation');
    } catch (err) {
      console.error('📹 Error playing idle animation:', err);
    }
  };

  // Helper function to play talking animation
  const playTalkingAnimation = async () => {
    if (!talkingVideoRef.current) return;
    
    try {
      // Pause idle video, show talking video
      if (idleVideoRef.current) {
        idleVideoRef.current.pause();
        idleVideoRef.current.style.opacity = '0';
        idleVideoRef.current.style.pointerEvents = 'none';
      }
      
      talkingVideoRef.current.style.opacity = '1';
      talkingVideoRef.current.style.pointerEvents = 'auto';
      talkingVideoRef.current.currentTime = 0;
      await talkingVideoRef.current.play();
      console.log('📹 Playing talking animation');
    } catch (err) {
      console.error('📹 Error playing talking animation:', err);
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

      {/* Idle Video */}
      <video
        ref={idleVideoRef}
        src={idleVideoSrc}
        className={`absolute inset-0 w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          opacity: currentState === 'idle' ? 1 : 0,
          pointerEvents: currentState === 'idle' ? 'auto' : 'none',
          cursor: 'pointer'
        }}
        loop
        muted
        playsInline
        preload="auto"
        onClick={handleCharacterClick}
      />

      {/* Talking Video */}
      <video
        ref={talkingVideoRef}
        src={talkingVideoSrc}
        className={`absolute inset-0 w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          opacity: currentState === 'talking' ? 1 : 0,
          pointerEvents: currentState === 'talking' ? 'auto' : 'none',
          cursor: 'pointer'
        }}
        loop
        muted
        playsInline
        preload="auto"
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
