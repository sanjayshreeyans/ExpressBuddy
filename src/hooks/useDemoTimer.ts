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

  const start = useCallback(() => {
    if (timeRemaining > 0 && !isExpired) {
      setIsRunning(true);
    }
  }, [timeRemaining, isExpired]);

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
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsExpired(true);
            if (!hasExpiredRef.current) {
              hasExpiredRef.current = true;
              onExpire?.();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onExpire]);

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
