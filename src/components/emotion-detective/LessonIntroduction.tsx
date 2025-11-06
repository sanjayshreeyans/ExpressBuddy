import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { LessonIntroductionProps, EMOTION_LEVELS, EMOTION_METADATA } from '../../types/emotion-detective';

/**
 * Lesson Introduction Component with TTS Integration
 * Features center-to-left avatar transition and lesson narration
 */
const LessonIntroduction: React.FC<LessonIntroductionProps> = ({
  lessonLevel,
  onIntroComplete
}) => {
  // Component state
  const [introPhase, setIntroPhase] = useState<'greeting' | 'explanation' | 'ready'>('greeting');
  const [picoPosition, setPicoPosition] = useState<'center' | 'left'>('center');
  const [isNarrationComplete, setIsNarrationComplete] = useState(false);

  // TTS integration
  const [ttsState, ttsActions] = useTTSPlayback();

  // Refs
  const narrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * Generate introduction text based on lesson level
   */
  const getIntroductionText = useCallback(() => {
    const emotions = EMOTION_LEVELS[lessonLevel] || EMOTION_LEVELS[1];
    const emotionNames = emotions.map((emotion: string) => 
      EMOTION_METADATA[emotion]?.description || emotion
    ).join(', ');

    return {
      greeting: `Hi there! Welcome to Level ${lessonLevel}.`,
      explanation: `Today we'll explore emotions like ${emotionNames}. You'll look at faces, identify emotions, and even practice making the expressions yourself!`,
      ready: `Are you ready to become an emotion detective? Let's start our adventure!`
    };
  }, [lessonLevel]);

  /**
   * Start narration sequence
   */
  const startNarration = useCallback(async () => {
    if (!mountedRef.current) return;

    const introText = getIntroductionText();
    
    try {
      // Phase 1: Greeting
      setIntroPhase('greeting');
      await ttsActions.speak({ 
        text: introText.greeting,
        voiceId: 'en-US-JennyNeural' // Child-friendly voice
      });

      if (!mountedRef.current) return;

      // Wait a moment, then transition Pico to left
      await new Promise(resolve => {
        narrationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setPicoPosition('left');
            resolve(void 0);
          }
        }, 1000);
      });

      if (!mountedRef.current) return;

      // Phase 2: Explanation
      setIntroPhase('explanation');
      await new Promise(resolve => {
        narrationTimeoutRef.current = setTimeout(resolve, 800); // Wait for transition
      });

      if (!mountedRef.current) return;

      await ttsActions.speak({ 
        text: introText.explanation,
        voiceId: 'en-US-JennyNeural'
      });

      if (!mountedRef.current) return;

      // Phase 3: Ready to start
      setIntroPhase('ready');
      await new Promise(resolve => {
        narrationTimeoutRef.current = setTimeout(resolve, 500);
      });

      if (!mountedRef.current) return;

      await ttsActions.speak({ 
        text: introText.ready,
        voiceId: 'en-US-JennyNeural'
      });

      if (mountedRef.current) {
        setIsNarrationComplete(true);
      }

    } catch (error) {
      console.error('❌ LessonIntroduction: Narration error:', error);
      if (mountedRef.current) {
        setIsNarrationComplete(true);
      }
    }
  }, [getIntroductionText, ttsActions]);

  /**
   * Handle continue button click
   */
  const handleContinue = useCallback(() => {
    // Stop any current TTS
    ttsActions.stop();
    
    // Clear timeouts
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
    }

    onIntroComplete();
  }, [ttsActions, onIntroComplete]);

  /**
   * Skip introduction
   */
  const handleSkip = useCallback(() => {
    ttsActions.stop();
    
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
    }

    setPicoPosition('left');
    setIsNarrationComplete(true);
  }, [ttsActions]);

  // Start narration on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        startNarration();
      }
    }, 1000); // Small delay to let everything initialize

    return () => {
      clearTimeout(timer);
    };
  }, [startNarration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (narrationTimeoutRef.current) {
        clearTimeout(narrationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          
          {/* Pico Avatar with smooth transition */}
          <motion.div
            className={`${picoPosition === 'center' ? 'lg:col-span-4' : 'lg:col-span-1'} order-1 lg:order-1`}
            layout
            transition={{ 
              duration: 0.8, 
              ease: "easeInOut",
              layout: { duration: 0.8 }
            }}
          >
            <Card className={`${picoPosition === 'center' ? 'h-96' : 'h-80'} transition-all duration-800`}>
              <CardContent className="p-4 h-full">
                <VideoExpressBuddyAvatar
                  className="w-full h-full"
                  isListening={ttsState.isPlaying}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Introduction Content */}
          <motion.div
            className={`${picoPosition === 'center' ? 'lg:col-span-4' : 'lg:col-span-3'} order-2 lg:order-2`}
            layout
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Card className="min-h-80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    🕵️ Emotion Detective
                    <Badge variant="secondary">Level {lessonLevel}</Badge>
                  </CardTitle>
                  {!isNarrationComplete && ttsState.isPlaying && (
                    <button
                      onClick={handleSkip}
                      className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                    >
                      Skip Intro
                    </button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Current narration phase indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    introPhase === 'greeting' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    introPhase === 'explanation' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    introPhase === 'ready' ? 'bg-primary' : 'bg-muted'
                  }`} />
                </div>

                {/* Subtitle display */}
                <div className="min-h-16 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted">
                  {currentSubtitle ? (
                    <p className="text-lg leading-relaxed text-center">
                      {currentSubtitle}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-center italic">
                      {ttsState.isPlaying ? 'Pico is speaking...' : 'Ready to start!'}
                    </p>
                  )}
                </div>

                {/* Lesson preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">What You'll Learn</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Identify emotions from faces</li>
                      <li>• Match emotions to situations</li>
                      <li>• Practice expressing emotions</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Today's Emotions</h4>
                    <div className="flex flex-wrap gap-1">
                      {(EMOTION_LEVELS[lessonLevel] || EMOTION_LEVELS[1]).map((emotion: string) => (
                        <Badge key={emotion} variant="outline" className="text-xs capitalize">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="flex justify-center pt-4">
                  <motion.button
                    onClick={handleContinue}
                    disabled={!isNarrationComplete && ttsState.isPlaying}
                    className={`px-8 py-3 rounded-lg font-medium text-lg transition-all ${
                      isNarrationComplete || !ttsState.isPlaying
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                    whileHover={isNarrationComplete || !ttsState.isPlaying ? { scale: 1.05 } : {}}
                    whileTap={isNarrationComplete || !ttsState.isPlaying ? { scale: 0.95 } : {}}
                  >
                    {isNarrationComplete || !ttsState.isPlaying ? 'Start Learning!' : 'Please wait...'}
                  </motion.button>
                </div>

                {/* TTS connection status */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-muted-foreground text-center">
                    TTS: {ttsState.isConnected ? '✅ Connected' : '❌ Disconnected'} | 
                    Playing: {ttsState.isPlaying ? '🔴' : '⚪'} |
                    Visemes: {ttsState.visemes.length}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LessonIntroduction;