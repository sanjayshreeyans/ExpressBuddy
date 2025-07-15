/**
 * Silence Detection Hook for ExpressBuddy
 * 
 * This hook monitors user silence periods after AI turns complete and triggers
 * nudges when the child appears to be distracted or silent for too long.
 * 
 * Features:
 * - Tracks when AI finishes speaking and user should be listening
 * - Monitors microphone volume to detect actual speech vs background noise
 * - Configurable silence threshold and nudge messages
 * - Visual nudge indicators
 * - Analytics and logging
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface SilenceDetectionConfig {
  /** Silence threshold in seconds before triggering a nudge */
  silenceThresholdSeconds: number;
  
  /** Minimum volume level to consider as "real speech" (0-1 scale) */
  speechVolumeThreshold: number;
  
  /** Nudge message to send to Gemini when silence detected */
  nudgeMessage: string;
  
  /** Whether nudge system is enabled */
  enabled: boolean;
  
  /** Minimum time between nudges in seconds */
  minTimeBetweenNudges: number;
  
  /** Maximum number of nudges before session terminates */
  maxNudges: number;
}

export interface SilenceDetectionState {
  /** Current state of the conversation */
  conversationState: 'ai-speaking' | 'listening-for-user' | 'user-speaking' | 'processing' | 'idle';
  
  /** Whether a nudge was recently sent */
  recentNudgeSent: boolean;
  
  /** Timestamp of last nudge sent */
  lastNudgeTime: number | null;
  
  /** Current silence duration in seconds */
  currentSilenceDuration: number;
  
  /** Whether speech is currently being detected */
  speechDetected: boolean;
  
  /** Number of nudges sent in current session */
  nudgeCount: number;
}

export interface UseSilenceDetectionResults {
  /** Current configuration */
  config: SilenceDetectionConfig;
  
  /** Update configuration */
  updateConfig: (updates: Partial<SilenceDetectionConfig>) => void;
  
  /** Current detection state */
  state: SilenceDetectionState;
  
  /** Manually trigger a nudge (for testing) */
  triggerManualNudge: () => Promise<void>;
  
  /** Reset the silence timer */
  resetSilenceTimer: () => void;
  
  /** Set conversation state */
  setConversationState: (state: SilenceDetectionState['conversationState']) => void;
  
  /** Update volume level for speech detection */
  updateVolume: (volume: number) => void;
  
  /** Get analytics data */
  getAnalytics: () => SilenceAnalytics;
}

export interface SilenceAnalytics {
  totalNudges: number;
  averageSilenceDuration: number;
  longestSilencePeriod: number;
  nudgeSuccessRate: number; // Percentage of nudges that resulted in user response
  sessionStartTime: number;
  totalSilenceTime: number;
}

export interface SilenceDetectionCallbacks {
  /** Called when a nudge should be sent to Gemini */
  onNudgeTriggered: (nudgeMessage: string) => Promise<void>;
  
  /** Called when nudge visual indicator should be shown */
  onShowNudgeIndicator: (show: boolean) => void;
  
  /** Called for analytics logging */
  onAnalyticsEvent: (event: string, data: any) => void;
  
  /** Called when session should be terminated (max nudges reached) */
  onSessionTerminated: () => void;
}

export function useSilenceDetection(callbacks: SilenceDetectionCallbacks): UseSilenceDetectionResults {
  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Default configuration
  const [config, setConfig] = useState<SilenceDetectionConfig>({
    silenceThresholdSeconds: 10,
    speechVolumeThreshold: 0.05, // 5% volume threshold
    nudgeMessage: "🎯 URGENT: The child has been silent for too long and may be distracted or lost. IMMEDIATELY switch to a completely different topic with high energy! Try asking about their favorite cartoon character, a fun game, or tell an exciting story with sound effects. Use phrases like 'WOW!' or 'That's AMAZING!' to re-engage them. Make it interactive and ask them to participate actively!",
    enabled: true, // **ENABLED BY DEFAULT** per user request
    minTimeBetweenNudges: 0, // **NO TIME BETWEEN NUDGES** per user request
    maxNudges: 5, // **MAXIMUM 5 NUDGES** before session terminates
  });

  // Detection state
  const [state, setState] = useState<SilenceDetectionState>({
    conversationState: 'idle',
    recentNudgeSent: false,
    lastNudgeTime: null,
    currentSilenceDuration: 0,
    speechDetected: false,
    nudgeCount: 0,
  });

  // Refs for timer management
  const silenceTimerRef = useRef<number | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const lastVolumeUpdateRef = useRef<number>(0);
  const volumeHistoryRef = useRef<number[]>([]);
  const nudgeIndicatorTimeoutRef = useRef<number | null>(null);
  
  // Analytics tracking
  const analyticsRef = useRef<SilenceAnalytics>({
    totalNudges: 0,
    averageSilenceDuration: 0,
    longestSilencePeriod: 0,
    nudgeSuccessRate: 0,
    sessionStartTime: Date.now(),
    totalSilenceTime: 0,
  });
  
  const silencePeriodsRef = useRef<number[]>([]);
  const nudgeResponsesRef = useRef<{ nudgeTime: number; responseTime: number | null }[]>([]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<SilenceDetectionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    console.log('🔧 Silence detection config updated:', updates);
  }, []);

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (silenceStartTimeRef.current) {
      const silenceDuration = (Date.now() - silenceStartTimeRef.current) / 1000;
      silencePeriodsRef.current.push(silenceDuration);
      analyticsRef.current.totalSilenceTime += silenceDuration;
      analyticsRef.current.longestSilencePeriod = Math.max(
        analyticsRef.current.longestSilencePeriod,
        silenceDuration
      );
    }
    
    silenceStartTimeRef.current = null;
    setState(prev => ({ ...prev, currentSilenceDuration: 0 }));
    
    console.log('🔄 Silence timer reset');
  }, []);

  // Set conversation state
  const setConversationState = useCallback((newState: SilenceDetectionState['conversationState']) => {
    setState(prev => {
      if (prev.conversationState === newState) return prev;
      
      console.log(`🎯 Conversation state changed: ${prev.conversationState} → ${newState}`);
      
      // Reset silence timer when state changes
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      // Start monitoring silence when transitioning to listening state
      if (newState === 'listening-for-user') {
        console.log('👂 Starting silence detection - AI finished speaking, waiting for user');
        const now = Date.now();
        silenceStartTimeRef.current = now;
        console.log('🕐 Silence timer started at:', new Date(now).toLocaleTimeString());
      } else {
        // Stop monitoring when not in listening state
        if (silenceStartTimeRef.current) {
          const now = Date.now();
          const startTime = silenceStartTimeRef.current;
          
          // Validate before calculating duration
          if (now >= startTime && (now - startTime) < 24 * 60 * 60 * 1000) {
            const silenceDuration = (now - startTime) / 1000;
            silencePeriodsRef.current.push(silenceDuration);
            analyticsRef.current.totalSilenceTime += silenceDuration;
            console.log('📊 Silence period recorded:', silenceDuration.toFixed(2) + 's');
          } else {
            console.warn('⚠️ Invalid silence duration detected, not recording');
          }
        }
        silenceStartTimeRef.current = null;
      }
      
      return { ...prev, conversationState: newState, currentSilenceDuration: 0 };
    });
    
    // Log analytics event (moved outside setState to avoid dependency issues)
    setTimeout(() => {
      callbacksRef.current.onAnalyticsEvent('conversation_state_change', {
        newState,
        timestamp: Date.now(),
      });
    }, 0);
  }, []);

  // Update volume for speech detection
  const updateVolume = useCallback((volume: number) => {
    lastVolumeUpdateRef.current = Date.now();
    
    // Maintain rolling window of volume levels for better speech detection
    volumeHistoryRef.current.push(volume);
    if (volumeHistoryRef.current.length > 10) {
      volumeHistoryRef.current.shift();
    }
    
    // Calculate average volume to smooth out noise
    const avgVolume = volumeHistoryRef.current.reduce((sum, v) => sum + v, 0) / volumeHistoryRef.current.length;
    const speechDetected = avgVolume > config.speechVolumeThreshold;
    
    setState(prev => {
      if (prev.speechDetected !== speechDetected) {
        console.log(`🎤 Speech detection changed: ${speechDetected} (volume: ${avgVolume.toFixed(3)}, threshold: ${config.speechVolumeThreshold})`);
        
        if (speechDetected && prev.conversationState === 'listening-for-user') {
          // User started speaking - transition state and record response if after nudge
          const responseTime = Date.now();
          const lastNudge = nudgeResponsesRef.current[nudgeResponsesRef.current.length - 1];
          if (lastNudge && !lastNudge.responseTime && responseTime - lastNudge.nudgeTime < 60000) {
            lastNudge.responseTime = responseTime;
            console.log('✅ User responded to nudge within 60 seconds');
          }
        }
      }
      
      return { ...prev, speechDetected };
    });
    
    // Reset silence timer if speech detected while listening
    if (speechDetected) {
      setState(current => {
        if (current.conversationState === 'listening-for-user') {
          resetSilenceTimer();
        }
        return current;
      });
    }
  }, [config.speechVolumeThreshold, resetSilenceTimer]);

  // Trigger nudge
  const triggerNudge = useCallback(async () => {
    if (!config.enabled) {
      console.log('⚠️ Nudge system disabled, skipping nudge');
      return;
    }

    const now = Date.now();
    
    // Get current state values without dependency on state object
    setState(currentState => {
      // Check if maximum nudges reached
      if (currentState.nudgeCount >= config.maxNudges) {
        console.log('🚫 Maximum nudges reached, terminating session');
        setTimeout(() => {
          callbacksRef.current.onSessionTerminated();
        }, 0);
        return currentState; // No change
      }
      
      // Check minimum time between nudges
      if (currentState.lastNudgeTime && (now - currentState.lastNudgeTime) < (config.minTimeBetweenNudges * 1000)) {
        console.log('⚠️ Too soon since last nudge, skipping');
        return currentState; // No change
      }
      
      console.log('🔔 Triggering nudge - child appears distracted');
      
      // Trigger async operations outside setState
      (async () => {
        try {
          // Send nudge to Gemini
          await callbacksRef.current.onNudgeTriggered(config.nudgeMessage);
          
          // Update analytics
          analyticsRef.current.totalNudges++;
          nudgeResponsesRef.current.push({
            nudgeTime: now,
            responseTime: null,
          });
          
          // Show visual indicator
          callbacksRef.current.onShowNudgeIndicator(true);
          
          // Hide indicator after 3 seconds
          if (nudgeIndicatorTimeoutRef.current) {
            clearTimeout(nudgeIndicatorTimeoutRef.current);
          }
          nudgeIndicatorTimeoutRef.current = window.setTimeout(() => {
            callbacksRef.current.onShowNudgeIndicator(false);
          }, 3000);
          
          // Reset recent nudge flag after 5 seconds
          setTimeout(() => {
            setState(prev => ({ ...prev, recentNudgeSent: false }));
          }, 5000);
          
          // Log analytics
          callbacksRef.current.onAnalyticsEvent('nudge_triggered', {
            silenceDuration: currentState.currentSilenceDuration,
            nudgeCount: currentState.nudgeCount + 1,
            message: config.nudgeMessage,
            timestamp: now,
          });
          
          // Check if this will be the last nudge
          if (currentState.nudgeCount + 1 >= config.maxNudges) {
            console.log('⚠️ This was the final nudge - session will terminate soon');
            setTimeout(() => {
              callbacksRef.current.onSessionTerminated();
            }, 5000); // Give 5 seconds for final nudge to be processed
          }
          
          console.log('✅ Nudge sent successfully');
          
        } catch (error) {
          console.error('❌ Failed to send nudge:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          callbacksRef.current.onAnalyticsEvent('nudge_error', { error: errorMessage, timestamp: now });
        }
      })();
      
      // Return updated state
      return {
        ...currentState,
        recentNudgeSent: true,
        lastNudgeTime: now,
        nudgeCount: currentState.nudgeCount + 1,
      };
    });
  }, [config.enabled, config.minTimeBetweenNudges, config.nudgeMessage, config.maxNudges]);

  // Manual nudge trigger (for testing)
  const triggerManualNudge = useCallback(async () => {
    console.log('🔧 Manual nudge triggered');
    await triggerNudge();
  }, [triggerNudge]);

  // Silence monitoring timer
  useEffect(() => {
    if (state.conversationState !== 'listening-for-user' || !config.enabled || state.speechDetected) {
      return;
    }
    
    // Start silence timer
    silenceTimerRef.current = window.setTimeout(() => {
      console.log(`⏰ Silence threshold reached (${config.silenceThresholdSeconds}s) - triggering nudge`);
      triggerNudge();
    }, config.silenceThresholdSeconds * 1000);
    
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [state.conversationState, state.speechDetected, config.enabled, config.silenceThresholdSeconds, triggerNudge]);

  // Update current silence duration for UI display
  useEffect(() => {
    if (state.conversationState !== 'listening-for-user' || !silenceStartTimeRef.current) {
      return;
    }
    
    const interval = setInterval(() => {
      if (!silenceStartTimeRef.current) return;
      
      const now = Date.now();
      const startTime = silenceStartTimeRef.current;
      
      // Validate timestamps to prevent huge numbers
      if (now < startTime || (now - startTime) > 24 * 60 * 60 * 1000) { // More than 24 hours
        console.warn('⚠️ Invalid silence timer detected, resetting...', { now, startTime, diff: now - startTime });
        silenceStartTimeRef.current = now; // Reset to current time
        setState(prev => ({ ...prev, currentSilenceDuration: 0 }));
        return;
      }
      
      const duration = (now - startTime) / 1000;
      setState(prev => ({ ...prev, currentSilenceDuration: duration }));
    }, 100);
    
    return () => clearInterval(interval);
  }, [state.conversationState]);

  // Get analytics data
  const getAnalytics = useCallback((): SilenceAnalytics => {
    const totalPeriods = silencePeriodsRef.current.length;
    const avgSilenceDuration = totalPeriods > 0 
      ? silencePeriodsRef.current.reduce((sum, duration) => sum + duration, 0) / totalPeriods 
      : 0;
    
    const responsiveNudges = nudgeResponsesRef.current.filter(nudge => nudge.responseTime !== null).length;
    const successRate = analyticsRef.current.totalNudges > 0 
      ? (responsiveNudges / analyticsRef.current.totalNudges) * 100 
      : 0;
    
    return {
      ...analyticsRef.current,
      averageSilenceDuration: avgSilenceDuration,
      nudgeSuccessRate: successRate,
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (nudgeIndicatorTimeoutRef.current) {
        clearTimeout(nudgeIndicatorTimeoutRef.current);
      }
    };
  }, []);

  return {
    config,
    updateConfig,
    state,
    triggerManualNudge,
    resetSilenceTimer,
    setConversationState,
    updateVolume,
    getAnalytics,
  };
}
