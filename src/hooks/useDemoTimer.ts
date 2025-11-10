import { useState, useEffect, useRef, useCallback } from 'react';

export interface DemoTimerState {
  timeRemaining: number; // in seconds
  isExpired: boolean;
  isRunning: boolean;
}

export interface UseDemoTimerOptions {
  durationSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

/**
 * Hook to manage a demo timer that counts down from a specified duration
 * Used for unauthenticated demo sessions
 */
export function useDemoTimer({
  durationSeconds,
  onExpire,
  autoStart = false
}: UseDemoTimerOptions): DemoTimerState & {
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
} {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire); // Use ref to avoid re-creating interval on every render

  // Update ref when onExpire changes
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const start = useCallback(() => {
    console.log('🎬 Demo timer start() called');
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(durationSeconds);
    setIsExpired(false);
    setIsRunning(false);
    hasExpiredRef.current = false;
  }, [durationSeconds]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    console.log('⏱️ useEffect triggered: isRunning=', isRunning, 'intervalRef=', !!intervalRef.current);
    
    if (isRunning && !intervalRef.current) {
      console.log('⏱️ Setting up interval timer from:', timeRemaining);
      intervalRef.current = setInterval(() => {
        console.log('⏰ Interval tick!');
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          console.log('⏱️ Timer tick: ', prev, '→', newTime);
          if (newTime <= 0) {
            console.log('⏰ Timer expired!');
            setIsRunning(false);
            setIsExpired(true);
            if (!hasExpiredRef.current) {
              hasExpiredRef.current = true;
              onExpireRef.current?.();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
      console.log('✅ Interval created:', intervalRef.current);
    } else if (!isRunning && intervalRef.current) {
      console.log('🛑 Clearing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        console.log('🧹 Cleanup: clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  return {
    timeRemaining,
    isExpired,
    isRunning,
    start,
    pause,
    reset,
    formatTime,
  };
}
