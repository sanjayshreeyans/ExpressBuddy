import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { supabaseService } from '../../services/supabaseService';
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

/**
 * Main Emotion Detective Learning Container Component
 * Orchestrates the entire lesson flow with phase transitions and state management
 */
const EmotionDetectiveLearning: React.FC<EmotionDetectiveLearningProps> = ({
  lessonId,
  childId,
  onComplete
}) => {
  // Phase and session state
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>('intro');
  const [session, setSession] = useState<LessonSession | null>(null);
  const [progress, setProgress] = useState<EmotionDetectiveProgress | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TTS integration
  const [ttsState, ttsActions] = useTTSPlayback({
    autoConnect: true,
    setSpeakingState: true,
    transitionDuration: 21
  });

  // Refs for cleanup
  const mountedRef = useRef(true);
  const sessionStartTime = useRef<Date>(new Date());

  const { child } = useSupabase();

  /**
   * Initialize lesson data and create session
   */
  const initializeLesson = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!child) {
        // For development/testing, create a mock child
        const mockChild = {
          id: 'test-child-123',
          kinde_user_id: 'test-user-123',
          name: 'Test Child',
          age: 8,
          created_at: new Date().toISOString()
        };
        
        console.log('⚠️ No child found, using mock child for development:', mockChild);
        
        // Use mock child for development
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
        
        // Generate questions for this lesson
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
        return;
      }

      // Get or create progress
      let childProgress = await supabaseService.getEmotionDetectiveProgress(child.id);
      if (!childProgress) {
        childProgress = await supabaseService.createEmotionDetectiveProgress(child.id);
      }

      if (!childProgress) {
        throw new Error('Failed to initialize progress');
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

      // Determine lesson level (for now, use level 1)
      const lessonLevel = 1;
      const availableEmotions = EMOTION_LEVELS[lessonLevel] || EMOTION_LEVELS[1];
      
      // Filter emotions based on unlocked emotions
      const unlockedEmotions = childProgress.unlocked_emotions || ['happy', 'sad', 'angry', 'neutral'];
      const lessonEmotions = availableEmotions.filter(emotion => 
        unlockedEmotions.includes(emotion)
      ).slice(0, 4); // Limit to 4 emotions per lesson

      // Generate questions for this lesson
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

      // Save session to database
      const savedSession = await supabaseService.createEmotionDetectiveSession(
        child.id,
        lessonLevel,
        lessonEmotions
      );

      if (savedSession) {
        newSession.id = savedSession.id;
      }

      setSession(newSession);
      sessionStartTime.current = new Date();

    } catch (err) {
      console.error('Error initializing lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize lesson');
    } finally {
      setIsLoading(false);
    }
  }, [child]);

  /**
   * Generate questions for the lesson
   */
  const generateLessonQuestions = (emotions: string[], level: number): QuestionData[] => {
    const questions: QuestionData[] = [];
    
    // For now, generate simple Type 1 questions (Face → Emotion)
    emotions.forEach((emotion, index) => {
      const emotionMeta = EMOTION_METADATA[emotion];
      if (emotionMeta) {
        questions.push({
          id: `q_${index + 1}`,
          type: 1,
          emotion,
          correctAnswer: emotion,
          options: generateEmotionOptions(emotion, emotions),
          questionText: QUESTION_TEMPLATES.type1,
          faceImage: {
            id: `face_${emotion}`,
            filename: `sample_${emotion}.jpg`,
            age: 25,
            gender: 'male',
            emotion,
            variant: 1,
            path: `/faces/sample_${emotion}.jpg`
          }
        });
      }
    });

    return questions;
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
   * Handle lesson introduction completion
   */
  const handleIntroComplete = useCallback(() => {
    setCurrentPhase('questions');
  }, []);

  /**
   * Handle question answer
   */
  const handleQuestionAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    if (!session || !session.questions[currentQuestionIndex]) return;

    const question = session.questions[currentQuestionIndex];
    let earnedXP = 0;

    // Calculate XP for correct identification
    if (isCorrect) {
      earnedXP += XP_REWARDS.CORRECT_IDENTIFICATION;
    }

    // Update session XP
    setSessionXP(prev => prev + earnedXP);
    setCompletedQuestions(prev => prev + 1);

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

    // Move to next question or mirroring phase
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions completed, move to mirroring phase
      setCurrentPhase('mirroring');
    }
  }, [session, currentQuestionIndex]);

  /**
   * Handle mirroring completion
   */
  const handleMirroringComplete = useCallback(async (score: number, success: boolean) => {
    if (!session) return;

    let earnedXP = 0;
    if (success) {
      earnedXP += XP_REWARDS.SUCCESSFUL_MIRRORING;
    }

    // Session completion bonus
    earnedXP += XP_REWARDS.SESSION_COMPLETION_BONUS;

    setSessionXP(prev => prev + earnedXP);
    setCurrentPhase('complete');

    // Update progress in database
    try {
      if (progress) {
        await supabaseService.updateProgressWithXP(
          progress.childId,
          sessionXP + earnedXP,
          true
        );
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [session, sessionXP, progress]);

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
   * Handle TTS requests from child components
   */
  const handleTTSRequest = useCallback(async (text: string) => {
    try {
      await ttsActions.speak({ text });
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, [ttsActions]);

  // Initialize lesson on mount
  useEffect(() => {
    initializeLesson();
    
    return () => {
      mountedRef.current = false;
    };
  }, [initializeLesson]);

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
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={initializeLesson}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || !progress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                Level {session.level}
              </Badge>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Progress:</span>
                <Progress 
                  value={(completedQuestions / session.questions.length) * 100} 
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  {completedQuestions}/{session.questions.length}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="default" className="text-sm">
                +{sessionXP} XP
              </Badge>
              <Badge variant="outline" className="text-sm">
                Total: {progress.totalXP + sessionXP} XP
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Pico Avatar Area (Left 20%) */}
              <div className="lg:col-span-1">
                <Card className="h-96 sticky top-24">
                  <CardContent className="p-4 h-full">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Pico Avatar</p>
                      <p className="text-xs mt-2">
                        {ttsState.isPlaying ? 'Speaking...' : 'Ready to help!'}
                      </p>
                      {ttsState.currentSubtitle && (
                        <div className="mt-4 p-2 bg-muted rounded text-xs">
                          {ttsState.currentSubtitle}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Content Area (Right 80%) */}
              <div className="lg:col-span-3">
                <Card className="min-h-96">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Question {currentQuestionIndex + 1} of {session.questions.length}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {session.questions[currentQuestionIndex] && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-4">
                            {session.questions[currentQuestionIndex].questionText}
                          </h3>
                          
                          {/* Placeholder for face image */}
                          <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center mb-6">
                            <span className="text-muted-foreground">
                              Face Image: {session.questions[currentQuestionIndex].emotion}
                            </span>
                          </div>
                        </div>

                        {/* Multiple choice options */}
                        <div className="grid grid-cols-2 gap-4">
                          {session.questions[currentQuestionIndex].options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuestionAnswer(
                                option, 
                                option === session.questions[currentQuestionIndex].correctAnswer
                              )}
                              className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium capitalize">{option}</span>
                                <button
                                  {...ttsActions.createSpeakerButton(option)}
                                  className="ml-2 p-1 rounded hover:bg-muted-foreground/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTTSRequest(option);
                                  }}
                                >
                                  🔊
                                </button>
                              </div>
                              {EMOTION_METADATA[option] && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {EMOTION_METADATA[option].description}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl text-center">
                    Emotion Mirroring Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6">
                    Now it's time to practice! Try to mirror the emotions you just learned.
                  </p>
                  <button
                    onClick={() => handleMirroringComplete(85, true)}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Start Mirroring (Placeholder)
                  </button>
                </CardContent>
              </Card>
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

                  <button
                    onClick={handleLessonComplete}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
                  >
                    Continue Learning
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmotionDetectiveLearning;