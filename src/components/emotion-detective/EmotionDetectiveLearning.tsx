import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { supabaseService } from '../../services/supabaseService';
import {
  EmotionDetectiveError,
  createError,
  logError,
  checkBrowserCompatibility,
  withGracefulDegradation
} from '../../utils/errorHandling';
import {
  ErrorAlert,
  BrowserCompatibilityAlert
} from './ErrorAlerts';
import {
  useAccessibilityPreferences,
  useScreenReader,
  useKeyboardNavigation,
  useFocusManagement,
  useLiveRegion
} from '../../hooks/useAccessibility';
import {
  EmotionDetectiveLearningProps,
  LessonPhase,
  LessonSession,
  QuestionData,
  LessonResults,
  EmotionDetectiveProgress,
  EMOTION_LEVELS,
  EMOTION_METADATA,
  XP_REWARDS,
  QUESTION_TEMPLATES
} from '../../types/emotion-detective';
import LessonIntroduction from './LessonIntroduction';
import ProgressTracking from './ProgressTracking';
import QuestionType1 from './QuestionType1';
import QuestionType2 from './QuestionType2';
import QuestionType3 from './QuestionType3';
import QuestionType4 from './QuestionType4';
import EmotionMirroring from './EmotionMirroring';
import { RealtimeExpressBuddyAvatar } from '../avatar/RealtimeExpressBuddyAvatar';
import LessonCompletionScreen from './LessonCompletionScreen';

/**
 * Main Emotion Detective Learning Container Component
 * Orchestrates the entire lesson flow with phase transitions and state management
 */
const EmotionDetectiveLearning: React.FC<EmotionDetectiveLearningProps> = ({
  lessonId,
  childId,
  onComplete
}) => {
  // Phase and session state - Skip intro, start directly with questions
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>('questions');
  const [session, setSession] = useState<LessonSession | null>(null);
  const [progress, setProgress] = useState<EmotionDetectiveProgress | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<EmotionDetectiveError | null>(null);
  const [browserCompatibility, setBrowserCompatibility] = useState<{
    isSupported: boolean;
    missingFeatures: string[];
    errors: EmotionDetectiveError[];
  } | null>(null);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  // TTS integration with proper viseme support
  const [ttsState, ttsActions] = useTTSPlayback({
    autoConnect: true,
    transitionDuration: 21,
    setSpeakingState: true,
    manualSpeakingStateControl: false
  });
  const [riveInputs, setRiveInputs] = useState<any>(null);

  // Get visemes and subtitles directly from the TTS state
  const visemes = ttsState.visemes || [];
  const subtitles = ttsState.subtitles || [];
  const currentSubtitle = ttsState.currentSubtitle || '';

  // Debug visemes and TTS state
  useEffect(() => {
    console.log('🎯 EmotionDetective TTS State:', {
      isPlaying: ttsState.isPlaying,
      isConnected: ttsState.isConnected,
      visemesCount: visemes.length,
      subtitlesCount: subtitles.length,
      currentSubtitle,
      error: ttsState.error
    });

    if (visemes.length > 0) {
      console.log('🎯 EmotionDetective: Received visemes for avatar:', visemes.length, visemes.slice(0, 3));
      console.log('🎯 EmotionDetective: Passing visemes to RealtimeExpressBuddyAvatar');
    }

    if (ttsState.error) {
      console.error('❌ EmotionDetective TTS Error:', ttsState.error);
    }
  }, [ttsState, visemes, subtitles, currentSubtitle]);

  // Additional debugging for viseme state changes
  useEffect(() => {
    console.log('🔍 EmotionDetective: Visemes state changed:', {
      visemesLength: visemes.length,
      visemesArray: visemes,
      timestamp: Date.now()
    });
  }, [visemes]);

  // Debug the actual viseme data being passed to avatar
  useEffect(() => {
    if (visemes.length > 0) {
      console.log('🎯 EmotionDetective: About to pass visemes to avatar:', {
        count: visemes.length,
        firstViseme: visemes[0],
        lastViseme: visemes[visemes.length - 1]
      });
    }
  }, [visemes]);

  // Refs for cleanup
  const mountedRef = useRef(true);
  const sessionStartTime = useRef<Date>(new Date());

  const { child } = useSupabase();

  // Accessibility hooks
  const { preferences, isReducedMotion, isHighContrast, isKeyboardNavigation } = useAccessibilityPreferences();
  const { announce, announceError, announceSuccess, announceProgress } = useScreenReader();
  const { registerElements } = useKeyboardNavigation({
    enableArrowKeys: true,
    enableTabNavigation: true,
    enableEnterActivation: true,
    enableEscapeClose: false,
    focusTrapping: false
  });
  const { saveFocus, restoreFocus } = useFocusManagement();
  const { announce: liveAnnounce, liveRegionProps } = useLiveRegion('polite');

  /**
   * Check browser compatibility on mount
   */
  useEffect(() => {
    const compatibility = checkBrowserCompatibility();
    setBrowserCompatibility(compatibility);

    if (!compatibility.isSupported) {
      console.warn('Browser compatibility issues detected:', compatibility.missingFeatures);
    }
  }, []);

  /**
   * Map emotion names to face image codes
   */
  const getEmotionCode = (emotion: string): string => {
    const emotionMap: { [key: string]: string } = {
      'happy': 'h',
      'sad': 's',
      'angry': 'a',
      'neutral': 'n',
      'fearful': 'f',
      'disgusted': 'd'
    };
    return emotionMap[emotion] || 'n';
  };

  /**
   * Get a random face image for an emotion
   */
  const getFaceImageForEmotion = (emotion: string, index: number = 0) => {
    const emotionCode = getEmotionCode(emotion);

    // Available face IDs and their properties
    const availableFaces = [
      { id: '004', age: 'o', gender: 'm', ageNum: 40 },
      { id: '066', age: 'y', gender: 'm', ageNum: 25 },
      { id: '079', age: 'o', gender: 'f', ageNum: 45 },
      { id: '116', age: 'm', gender: 'm', ageNum: 35 },
      { id: '140', age: 'y', gender: 'f', ageNum: 22 },
      { id: '168', age: 'm', gender: 'f', ageNum: 30 }
    ];

    // Select face based on index for variety
    const selectedFace = availableFaces[index % availableFaces.length];
    const variant = index % 2 === 0 ? 'a' : 'b';

    const filename = `${selectedFace.id}_${selectedFace.age}_${selectedFace.gender}_${emotionCode}_${variant}.jpg`;

    return {
      id: `face_${emotion}_${selectedFace.id}`,
      filename,
      age: selectedFace.ageNum,
      gender: selectedFace.gender === 'm' ? 'male' : 'female' as 'male' | 'female',
      emotion,
      variant: variant === 'a' ? 1 : 2,
      path: `/Faces/${filename}`
    };
  };

  /**
   * Generate multiple choice options for emotion questions
   */
  const generateEmotionOptions = (correctEmotion: string, availableEmotions: string[]): string[] => {
    const options = [correctEmotion];
    const otherEmotions = availableEmotions.filter(e => e !== correctEmotion);

    // Add 3 random other emotions
    while (options.length < 4 && otherEmotions.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherEmotions.length);
      const emotion = otherEmotions.splice(randomIndex, 1)[0];
      options.push(emotion);
    }

    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  /**
   * Generate questions for the lesson with diverse question types
   */
  const generateLessonQuestions = useCallback((emotions: string[], level: number): QuestionData[] => {
    const questions: QuestionData[] = [];

    // Generate different types of questions for variety
    emotions.forEach((emotion, index) => {
      const emotionMeta = EMOTION_METADATA[emotion];
      if (emotionMeta) {
        // Focus on Type 1 questions (Face → Emotion) for now
        const faceImage = getFaceImageForEmotion(emotion, index);

        const question: QuestionData = {
          id: `q_${index + 1}`,
          type: 1,
          emotion,
          correctAnswer: emotion,
          options: generateEmotionOptions(emotion, emotions),
          questionText: QUESTION_TEMPLATES.type1,
          faceImage
        };

        questions.push(question);
      }
    });

    return questions;
  }, [getFaceImageForEmotion]);

  /**
   * Initialize lesson data with real child data
   */
  const initializeLessonData = useCallback(async () => {
    if (!child) {
      throw createError('PROGRESS_LOAD_FAILED', new Error('No child data available'), {
        component: 'EmotionDetectiveLearning',
        action: 'initializeLessonData'
      });
    }

    // Get or create progress with error handling
    let childProgress;
    try {
      childProgress = await supabaseService.getEmotionDetectiveProgress(child.id);
      if (!childProgress) {
        childProgress = await supabaseService.createEmotionDetectiveProgress(child.id);
      }
    } catch (error) {
      throw createError('PROGRESS_LOAD_FAILED', error as Error, {
        component: 'EmotionDetectiveLearning',
        action: 'getProgress'
      });
    }

    if (!childProgress) {
      throw createError('PROGRESS_LOAD_FAILED', new Error('Failed to create progress'), {
        component: 'EmotionDetectiveLearning',
        action: 'createProgress'
      });
    }

    // Map database fields to interface fields
    const mappedProgress: EmotionDetectiveProgress = {
      id: childProgress.id,
      childId: childProgress.child_id,
      level: childProgress.level,
      totalXP: childProgress.total_xp,
      completedSessions: childProgress.completed_sessions,
      currentStreak: childProgress.current_streak,
      bestStreak: childProgress.best_streak,
      unlockedEmotions: childProgress.unlocked_emotions,
      createdAt: new Date(childProgress.created_at),
      updatedAt: new Date(childProgress.updated_at)
    };
    setProgress(mappedProgress);

    // Generate lesson content
    const lessonLevel = 1;
    const availableEmotions = EMOTION_LEVELS[lessonLevel] || EMOTION_LEVELS[1];
    const unlockedEmotions = childProgress.unlocked_emotions || ['happy', 'sad', 'angry', 'neutral'];
    const lessonEmotions = availableEmotions.filter(emotion =>
      unlockedEmotions.includes(emotion)
    ).slice(0, 4);

    const questions = generateLessonQuestions(lessonEmotions, lessonLevel);

    // Create session
    const newSession: LessonSession = {
      id: `session_${Date.now()}`,
      childId: child.id,
      lessonType: 'emotion-detective',
      level: lessonLevel,
      questions,
      startTime: new Date(),
      totalXP: 0,
      completedQuestions: 0,
      status: 'in-progress'
    };

    // Save session to database with error handling
    try {
      const savedSession = await supabaseService.createEmotionDetectiveSession(
        child.id,
        lessonLevel,
        lessonEmotions
      );

      if (savedSession) {
        newSession.id = savedSession.id;
      }
    } catch (error) {
      // Log but don't fail - we can continue with local session
      console.warn('Failed to save session to database:', error);
    }

    setSession(newSession);
    sessionStartTime.current = new Date();
  }, [child, generateLessonQuestions]);

  /**
   * Initialize with mock data as fallback
   */
  const initializeWithMockData = async () => {
    console.log('⚠️ Initializing with mock data as fallback');

    // Create mock child for development/testing
    const mockChild = {
      id: 'test-child-123',
      kinde_user_id: 'test-user-123',
      name: 'Test Child',
      age: 8,
      created_at: new Date().toISOString()
    };

    // Create mock progress
    const mockProgress: EmotionDetectiveProgress = {
      id: 'mock-progress-123',
      childId: mockChild.id,
      level: 1,
      totalXP: 0,
      completedSessions: 0,
      currentStreak: 0,
      bestStreak: 0,
      unlockedEmotions: ['happy', 'sad', 'angry', 'neutral'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setProgress(mockProgress);

    // Generate lesson content
    const lessonLevel = 1;
    const availableEmotions = EMOTION_LEVELS[lessonLevel] || EMOTION_LEVELS[1];
    const lessonEmotions = availableEmotions.slice(0, 4);
    const questions = generateLessonQuestions(lessonEmotions, lessonLevel);

    // Create mock session
    const newSession: LessonSession = {
      id: `mock_session_${Date.now()}`,
      childId: mockChild.id,
      lessonType: 'emotion-detective',
      level: lessonLevel,
      questions,
      startTime: new Date(),
      totalXP: 0,
      completedQuestions: 0,
      status: 'in-progress'
    };

    setSession(newSession);
    sessionStartTime.current = new Date();

    console.log('✅ Mock data initialization complete');
  };

  /**
   * Initialize lesson data and create session with comprehensive error handling
   */
  const initializeLesson = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use graceful degradation for initialization
      await withGracefulDegradation(
        async () => {
          await initializeLessonData();
        },
        async () => {
          // Fallback: Initialize with mock data
          await initializeWithMockData();
        },
        (error) => {
          console.warn('Primary initialization failed, using fallback:', error.userMessage);
        }
      );

    } catch (err) {
      const initError = err instanceof EmotionDetectiveError
        ? err
        : createError('UNKNOWN_ERROR', err as Error, {
          component: 'EmotionDetectiveLearning',
          action: 'initializeLesson'
        });

      logError(initError);
      setError(initError);
    } finally {
      setIsLoading(false);
    }
  }, [initializeLessonData, initializeWithMockData]);



  /**
   * Handle lesson introduction completion
   */
  const handleIntroComplete = useCallback(() => {
    setCurrentPhase('questions');
  }, []);

  /**
   * Handle question answer - now includes mirroring after each correct answer
   */
  const handleQuestionAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    if (!session || !session.questions[currentQuestionIndex]) return;

    const question = session.questions[currentQuestionIndex];
    let earnedXP = 0;

    // Calculate XP for correct identification
    if (isCorrect) {
      earnedXP += XP_REWARDS.CORRECT_IDENTIFICATION;

      // If correct, move to mirroring phase for this question
      setSessionXP(prev => prev + earnedXP);
      setCurrentPhase('mirroring');
    } else {
      // If incorrect, show feedback and allow retry or move to next question
      // For now, just move to next question
      setCompletedQuestions(prev => prev + 1);

      if (currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // All questions completed
        setCurrentPhase('complete');
      }
    }

    // Save attempt to database
    try {
      if (session.id.startsWith('session_')) {
        // Real session - save to database
        const attempt = await supabaseService.createEmotionAttempt(session.id, question.emotion);
        if (attempt) {
          await supabaseService.updateEmotionAttempt(attempt.id, {
            identification_attempts: 1,
            identification_correct: isCorrect,
            mirroring_attempts: 0,
            mirroring_score: 0,
            time_spent_seconds: 10 // Placeholder
          });
        }
      }
    } catch (error) {
      console.error('Error saving attempt:', error);
    }
  }, [session, currentQuestionIndex]);

  /**
   * Handle mirroring completion - move to next question or complete lesson
   */
  const handleMirroringComplete = useCallback(async (score: number, success: boolean) => {
    if (!session) return;

    let earnedXP = 0;
    if (success) {
      earnedXP += XP_REWARDS.SUCCESSFUL_MIRRORING;
    }

    setSessionXP(prev => prev + earnedXP);
    setCompletedQuestions(prev => prev + 1);

    // Move to next question or complete lesson
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentPhase('questions');
    } else {
      // All questions completed - add session completion bonus
      const sessionBonus = XP_REWARDS.SESSION_COMPLETION_BONUS;
      setSessionXP(prev => prev + sessionBonus);
      setCurrentPhase('complete');

      // Update progress in database
      try {
        if (progress) {
          await supabaseService.updateProgressWithXP(
            progress.childId,
            sessionXP + earnedXP + sessionBonus,
            true
          );
        }
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  }, [session, sessionXP, progress, currentQuestionIndex]);

  /**
   * Handle lesson completion
   */
  const handleLessonComplete = useCallback(() => {
    if (!session) return;

    const results: LessonResults = {
      sessionId: session.id,
      totalXP: sessionXP,
      correctIdentifications: completedQuestions,
      successfulMirrors: 1, // Placeholder
      completedQuestions,
      timeSpent: Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000),
      level: session.level
    };

    onComplete(results);
  }, [session, sessionXP, completedQuestions, onComplete]);

  /**
   * Handle TTS requests from child components - Using proper TTS system
   */
  const handleTTSRequest = useCallback(async (text: string) => {
    try {
      console.log('🎵 TTS Request:', text);

      // Clear previous visemes before speaking new text
      console.log('🧹 Clearing previous visemes before new speech');

      // Use the proper TTS system with viseme integration
      await ttsActions.speak({
        text,
        voiceId: 'en-US-JennyNeural', // Child-friendly voice
        speed: 0.9 // Slightly slower for children
      });

      console.log('✅ TTS Request completed for:', text);
    } catch (error) {
      console.error('❌ TTS Error:', error);
    }
  }, [ttsActions]);

  // Update TTS system with Rive inputs when they become available
  useEffect(() => {
    if (riveInputs) {
      console.log('🎯 EmotionDetectiveLearning: Updating TTS system with Rive inputs');
      ttsActions.updateRiveInputs(riveInputs);
    }
  }, [riveInputs, ttsActions]);

  // Initialize lesson on mount - only run once
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      console.log('🚀 Starting initialization...', { mounted, hasSession: !!session });

      // Only run if we don't have a session yet and component is mounted
      if (!mounted || session) {
        console.log('⏭️ Skipping initialization:', { mounted, hasSession: !!session });
        return;
      }

      try {
        console.log('🔄 Setting loading state...');
        setIsLoading(true);
        setError(null);

        // Always use mock data for now to avoid backend issues
        console.log('🎯 Initializing with mock data for stable experience');

        // Create mock progress
        console.log('📊 Creating mock progress...');
        const mockProgress: EmotionDetectiveProgress = {
          id: 'mock-progress-123',
          childId: 'test-child-123',
          level: 1,
          totalXP: 0,
          completedSessions: 0,
          currentStreak: 0,
          bestStreak: 0,
          unlockedEmotions: ['happy', 'sad', 'angry', 'neutral'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log('✅ Setting progress state...');
        setProgress(mockProgress);

        // Generate lesson content
        console.log('📚 Generating lesson content...');
        const lessonLevel = 1;
        const availableEmotions = EMOTION_LEVELS[lessonLevel] || ['happy', 'sad', 'angry', 'neutral'];
        console.log('😊 Available emotions:', availableEmotions);

        const lessonEmotions = availableEmotions.slice(0, 4);
        console.log('🎯 Lesson emotions:', lessonEmotions);

        console.log('❓ Generating questions...');
        const questions = generateLessonQuestions(lessonEmotions, lessonLevel);
        console.log('✅ Generated questions:', questions.length);

        // Create mock session
        console.log('🎮 Creating mock session...');
        const newSession: LessonSession = {
          id: `mock_session_${Date.now()}`,
          childId: 'test-child-123',
          lessonType: 'emotion-detective',
          level: lessonLevel,
          questions,
          startTime: new Date(),
          totalXP: 0,
          completedQuestions: 0,
          status: 'in-progress'
        };

        if (mounted) {
          console.log('💾 Setting session state...');
          setSession(newSession);
          sessionStartTime.current = new Date();
          console.log('✅ Mock session initialized successfully');
        } else {
          console.log('⚠️ Component unmounted, skipping session set');
        }
      } catch (err) {
        console.error('❌ Initialization failed:', err);
        if (mounted) {
          setError(createError('UNKNOWN_ERROR', err as Error, {
            component: 'EmotionDetectiveLearning',
            action: 'initialize'
          }));
        }
      } finally {
        if (mounted) {
          console.log('🏁 Setting loading to false...');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [generateLessonQuestions, session]); // Empty dependency array - run only once on mount

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg font-medium">Loading Emotion Detective...</p>
            <p className="text-sm text-muted-foreground mt-2">Preparing your lesson</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          {/* Browser compatibility warning */}
          {browserCompatibility && !browserCompatibility.isSupported && (
            <BrowserCompatibilityAlert
              missingFeatures={browserCompatibility.missingFeatures}
              onContinue={() => {
                // Continue with limited functionality
                setError(null);
                initializeLesson();
              }}
              onDismiss={() => {
                // Just dismiss the warning
              }}
            />
          )}

          {/* Main error display */}
          <ErrorAlert
            error={error}
            onRetry={() => {
              setError(null);
              initializeLesson();
            }}
            onDismiss={() => setError(null)}
            showRetry={error.recoverable}
          />
        </div>
      </div>
    );
  }

  if (!session || !progress) {
    return null;
  }

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 ${isReducedMotion ? 'reduce-motion' : ''
        } ${isHighContrast ? 'high-contrast' : ''} ${isKeyboardNavigation ? 'keyboard-navigation' : ''
        }`}
      role="main"
      aria-label="Emotion Detective Learning Activity"
    >
      {/* Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Skip to main content
      </a>

      {/* Live Region for Screen Reader Announcements */}
      <div {...liveRegionProps} id="lesson-announcements">
        {/* Dynamic announcements will appear here */}
      </div>

      {/* Progress Header */}
      <header
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b flex-shrink-0"
        role="banner"
        aria-label="Lesson Progress"
      >
        <div className="container mx-auto px-2 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge
                variant="secondary"
                className="text-sm"
                aria-label={`Current level: ${session.level}`}
              >
                Level {session.level}
              </Badge>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" id="progress-label">Progress:</span>
                <Progress
                  value={(completedQuestions / session.questions.length) * 100}
                  className="w-32"
                  aria-labelledby="progress-label"
                  aria-valuenow={completedQuestions}
                  aria-valuemin={0}
                  aria-valuemax={session.questions.length}
                  aria-valuetext={`${completedQuestions} of ${session.questions.length} questions completed`}
                />
                <span
                  className="text-sm text-muted-foreground"
                  aria-label={`${completedQuestions} of ${session.questions.length} questions completed`}
                >
                  {completedQuestions}/{session.questions.length}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant="default"
                className="text-sm"
                aria-label={`Session XP earned: ${sessionXP} points`}
              >
                +{sessionXP} XP
              </Badge>
              <Badge
                variant="outline"
                className="text-sm"
                aria-label={`Total XP: ${progress.totalXP + sessionXP} points`}
              >
                Total: {progress.totalXP + sessionXP} XP
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="container mx-auto px-2 py-2 h-full flex flex-col"
        role="main"
        aria-label="Lesson Content"
      >
        <AnimatePresence mode="wait">
          {currentPhase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LessonIntroduction
                lessonLevel={session.level}
                onIntroComplete={handleIntroComplete}
              />
            </motion.div>
          )}

          {currentPhase === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-2 flex-1"
            >
              {/* Pico Avatar Area (Left 20%) - Properly centered with better height */}
              <div className="lg:col-span-1">
                <Card className="h-full max-h-[500px] sticky top-24">
                  <CardContent className="p-3 h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-blue-50 to-purple-50">
                      <div className="w-full h-full flex items-center justify-center relative">
                        <div className="w-[350px] h-[350px] flex items-center justify-center">
                          <RealtimeExpressBuddyAvatar
                            className="w-full h-full"
                            visemes={visemes}
                            subtitles={subtitles}
                            onCurrentSubtitleChange={(subtitle) => {
                              console.log('🎯 Current subtitle changed:', subtitle);
                            }}
                            onRiveInputsReady={(inputs) => {
                              console.log('🎯 Rive inputs ready in EmotionDetective:', inputs);
                              setRiveInputs(inputs);
                            }}
                          />
                          {/* Debug info for visemes */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                              <div>Visemes: {visemes.length}</div>
                              <div>TTS Playing: {ttsState.isPlaying ? 'Yes' : 'No'}</div>
                              <div>TTS Connected: {ttsState.isConnected ? 'Yes' : 'No'}</div>
                              {visemes.length > 0 && (
                                <div>First viseme: {JSON.stringify(visemes[0])}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {currentSubtitle && (
                      <div className="mt-1 p-1 bg-blue-100 rounded text-xs text-center text-blue-800 font-medium">
                        {currentSubtitle}
                      </div>
                    )}
                    <div className="text-center text-xs text-muted-foreground mt-1">
                      {ttsState.isPlaying ? '🎵 Speaking...' : '👋 Ready to help!'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Content Area (Right 80%) */}
              <div className="lg:col-span-3">
                {session.questions[currentQuestionIndex] && (
                  <>
                    {session.questions[currentQuestionIndex].type === 1 && (
                      <QuestionType1
                        question={session.questions[currentQuestionIndex]}
                        onAnswer={handleQuestionAnswer}
                        onTTSRequest={handleTTSRequest}
                      />
                    )}
                    {session.questions[currentQuestionIndex].type === 2 && (
                      <QuestionType2
                        question={session.questions[currentQuestionIndex]}
                        onAnswer={handleQuestionAnswer}
                        onTTSRequest={handleTTSRequest}
                      />
                    )}
                    {session.questions[currentQuestionIndex].type === 3 && (
                      <QuestionType3
                        question={session.questions[currentQuestionIndex]}
                        onAnswer={handleQuestionAnswer}
                        onTTSRequest={handleTTSRequest}
                      />
                    )}
                    {session.questions[currentQuestionIndex].type === 4 && (
                      <QuestionType4
                        question={session.questions[currentQuestionIndex]}
                        onAnswer={handleQuestionAnswer}
                        onTTSRequest={handleTTSRequest}
                      />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {currentPhase === 'mirroring' && (
            <motion.div
              key="mirroring"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {session.questions[currentQuestionIndex] && (
                <EmotionMirroring
                  targetEmotion={session.questions[currentQuestionIndex].emotion}
                  referenceImage={session.questions[currentQuestionIndex].faceImage!}
                  onMirroringComplete={handleMirroringComplete}
                  onRetry={() => {
                    // Reset any mirroring state if needed
                    console.log('Retrying mirroring...');
                  }}
                />
              )}
            </motion.div>
          )}

          {currentPhase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">
                    🎉 Lesson Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{sessionXP}</div>
                      <div className="text-sm text-muted-foreground">XP Earned</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{completedQuestions}</div>
                      <div className="text-sm text-muted-foreground">Questions Completed</div>
                    </div>
                  </div>

                  <ProgressTracking
                    currentXP={progress.totalXP + sessionXP}
                    sessionXP={sessionXP}
                    level={progress.level}
                    completedQuestions={completedQuestions}
                    totalQuestions={session.questions.length}
                  />

                  <Button
                    onClick={handleLessonComplete}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
                    size="lg"
                  >
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default EmotionDetectiveLearning;