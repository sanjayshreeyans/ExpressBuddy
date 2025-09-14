/**
 * Manual Hint System for ExpressBuddy
 * 
 * This hook provides a simple manual "Get Hint" button functionality 
 * that replaces the previous automatic silence detection system.
 * 
 * Features:
 * - Simple button trigger
 * - Configurable hint messages
 * - Basic analytics tracking
 */

import { useCallback, useRef, useState } from "react";

export interface HintSystemConfig {
  /** Hint message to send to Gemini when manually triggered */
  hintMessage: string;
  
  /** Whether hint system is enabled */
  enabled: boolean;
}

export interface HintSystemState {
  /** Number of hints sent in current session */
  hintCount: number;
  
  /** Timestamp of last hint sent */
  lastHintTime: number | null;
  
  /** Whether a hint was recently sent */
  recentHintSent: boolean;
  
  /** Whether hint is currently being processed */
  isProcessing: boolean;
}

export interface UseHintSystemResults {
  /** Current configuration */
  config: HintSystemConfig;
  
  /** Current state */
  state: HintSystemState;
  
  /** Update configuration */
  updateConfig: (updates: Partial<HintSystemConfig>) => void;
  
  /** Manually trigger a hint */
  triggerHint: () => Promise<void>;
  
  /** Get analytics data */
  getAnalytics: () => HintAnalytics;
}

export interface HintAnalytics {
  /** Total number of hints sent in session */
  totalHints: number;
  
  /** Session start time */
  sessionStartTime: number;
}

export interface HintSystemCallbacks {
  /** Called when a hint should be sent to Gemini */
  onHintTriggered: (hintMessage: string) => Promise<void>;
  
  /** Called when hint visual indicator should be shown */
  onShowHintIndicator: (show: boolean) => void;
  
  /** Called for analytics logging */
  onAnalyticsEvent: (event: string, data: any) => void;
}

export function useHintSystem(callbacks: HintSystemCallbacks): UseHintSystemResults {
  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef(callbacks);
  
  // Update callbacks when they change
  callbacksRef.current = callbacks;
  
  console.log('🔧 useHintSystem initialized with callbacks:', {
    onHintTriggered: typeof callbacks.onHintTriggered,
    onShowHintIndicator: typeof callbacks.onShowHintIndicator,
    onAnalyticsEvent: typeof callbacks.onAnalyticsEvent
  });

  // Default configuration
  const [config, setConfig] = useState<HintSystemConfig>({
    hintMessage: "🎯 HINT: The child might need help or encouragement. Try giving a helpful suggestion or asking a different question to help them continue the conversation. Look at their camera to check their emotion and provide supportive guidance.",
    enabled: true,
  });

  // System state
  const [state, setState] = useState<HintSystemState>({
    hintCount: 0,
    lastHintTime: null,
    recentHintSent: false,
    isProcessing: false,
  });

  // Analytics tracking
  const analyticsRef = useRef<HintAnalytics>({
    totalHints: 0,
    sessionStartTime: Date.now(),
  });

  // Update configuration
  const updateConfig = useCallback((updates: Partial<HintSystemConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    console.log('🔧 Hint system config updated:', updates);
  }, []);

  // Trigger hint manually
  const triggerHint = useCallback(async () => {
    if (!config.enabled) {
      console.log('⚠️ Hint system disabled, skipping hint');
      return;
    }

    if (state.isProcessing) {
      console.log('⚠️ Hint already processing, skipping');
      return;
    }

    const now = Date.now();
    
    console.log('🔔 Manual hint triggered by button');
    
    // Set processing state
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Send hint to Gemini
      console.log('📤 Sending hint to Gemini:', config.hintMessage);
      await callbacksRef.current.onHintTriggered(config.hintMessage);
      
      // Update state
      setState(prev => ({
        ...prev,
        hintCount: prev.hintCount + 1,
        lastHintTime: now,
        recentHintSent: true,
        isProcessing: false,
      }));
      
      // Update analytics
      analyticsRef.current.totalHints++;
      
      // Show visual indicator
      callbacksRef.current.onShowHintIndicator(true);
      
      // Hide indicator after 3 seconds
      setTimeout(() => {
        callbacksRef.current.onShowHintIndicator(false);
      }, 3000);
      
      // Reset recent hint flag after 5 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, recentHintSent: false }));
      }, 5000);
      
      // Log analytics
      callbacksRef.current.onAnalyticsEvent('hint_triggered', {
        hintCount: state.hintCount + 1,
        message: config.hintMessage,
        timestamp: now,
        manual: true,
      });
      
      console.log('✅ Manual hint sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send manual hint:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Reset processing state on error
      setState(prev => ({ ...prev, isProcessing: false }));
      
      callbacksRef.current.onAnalyticsEvent('hint_error', { error: errorMessage, timestamp: now });
    }
  }, [config.enabled, config.hintMessage, state.hintCount, state.isProcessing]);

  // Get analytics data
  const getAnalytics = useCallback((): HintAnalytics => {
    return {
      ...analyticsRef.current,
    };
  }, []);

  return {
    config,
    state,
    updateConfig,
    triggerHint,
    getAnalytics,
  };
}
