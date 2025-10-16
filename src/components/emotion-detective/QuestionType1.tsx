import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { HelpCircle, Volume2, Zap, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * QuestionType1 Component (Face → Emotion)
 * Shows a human face image and asks "What emotion is this?"
 * Provides 4 multiple choice emotion options
 */
export const QuestionType1: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const hasSpokenQuestionRef = useRef(false);

  const MAX_ATTEMPTS = 3;

  // Speak the question immediately when component loads - ONLY ONCE
  useEffect(() => {
    if (hasSpokenQuestionRef.current) return; // Prevent multiple calls

    const speakQuestion = async () => {
      try {
        console.log('🎵 QuestionType1: Speaking question once:', question.questionText);
        hasSpokenQuestionRef.current = true; // Mark as spoken
        onTTSRequest(question.questionText);
      } catch (error) {
        console.error('❌ QuestionType1: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, onTTSRequest]);

  // Play sound effects using Web Audio API for better browser support
  const playCorrectSound = () => {
    try {
      // Create a pleasant success sound (major chord)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported, using visual feedback only');
    }
  };

  const playIncorrectSound = () => {
    try {
      // Create a gentle error sound (descending notes)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Start higher
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3); // Go lower

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported, using visual feedback only');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered && attempts >= MAX_ATTEMPTS) return;

    const isCorrect = answer === question.correctAnswer;
    const newAttempts = attempts + 1;

    setSelectedAnswer(answer);
    setAttempts(newAttempts);

    if (isCorrect) {
      playCorrectSound();
      setHasAnswered(true);
      // Wait a moment to show feedback, then proceed
      setTimeout(() => {
        onAnswer(answer, true);
      }, 1500);
    } else {
      playIncorrectSound();

      if (newAttempts >= MAX_ATTEMPTS) {
        // Out of attempts, show correct answer and proceed
        setHasAnswered(true);
        setTimeout(() => {
          onAnswer(question.correctAnswer, false);
        }, 2000);
      } else {
        // Allow another attempt
        setTimeout(() => {
          setSelectedAnswer(null);
        }, 1500);
      }
    }
  };

  const getButtonVariant = (option: string) => {
    if (!hasAnswered) return 'outline';

    if (option === question.correctAnswer) {
      return 'default'; // Correct answer - green styling
    }

    if (option === selectedAnswer && option !== question.correctAnswer) {
      return 'destructive'; // Wrong selected answer - red styling
    }

    return 'secondary'; // Other options - muted
  };

  const getButtonClassName = (option: string) => {
    if (!hasAnswered) {
      return 'hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors';
    }

    if (option === question.correctAnswer) {
      return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    }

    if (option === selectedAnswer && option !== question.correctAnswer) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
    }

    return 'opacity-60';
  };

  if (!question.faceImage) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error: No face image provided for this question
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Kai - AI Detective Character Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
        <div className="py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            {/* Kai Character Avatar */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl flex-shrink-0 border-4 border-white">
              <span className="text-4xl">🕵️</span>
            </div>
            
            {/* Kai's Speech Bubble */}
            <div className="flex-1 bg-white rounded-2xl px-6 py-3 shadow-lg relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-gray-800 flex-1">
                  🔍 What emotion is this person showing?
                </p>
                <SpeakerIcon
                  text={question.questionText}
                  className="flex-shrink-0"
                  aria-label="Repeat question"
                />
              </div>
              {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
                <Badge className="bg-orange-500 text-white text-xs px-2 py-1 mt-2">
                  Attempt {attempts + 1} of {MAX_ATTEMPTS}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Face Image at Top */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Large Face Image */}
          <Card className="shadow-2xl border-4 border-purple-200 overflow-hidden">
            <CardContent className="p-6 bg-gradient-to-br from-white to-purple-50">
              <div className="flex items-center justify-center" style={{ minHeight: '250px' }}>
                <img
                  src={question.faceImage.path}
                  alt={`Person showing an emotion`}
                  className="max-w-full max-h-[300px] w-auto h-auto object-contain rounded-xl shadow-lg"
                  onError={(e) => {
                    console.error('❌ Failed to load face image:', question.faceImage?.path);
                    e.currentTarget.src = '/placeholder-face.jpg';
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Big 2x2 Grid of Emotion Choices */}
          <div className="grid grid-cols-2 gap-6">
            {question.options.map((option, index) => {
              const emotionEmojis: Record<string, string> = {
                happy: '😄',
                sad: '😢',
                angry: '😠',
                surprised: '😲',
                fearful: '😨',
                disgusted: '🤢',
                neutral: '😐'
              };

              return (
                <Button
                  key={`${option}-${index}`}
                  variant={getButtonVariant(option)}
                  className={cn(
                    'h-32 flex flex-col items-center justify-center gap-3 text-center rounded-2xl font-bold text-2xl transition-all duration-300 border-4 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95',
                    getButtonClassName(option)
                  )}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={hasAnswered}
                >
                  <span className="text-6xl">{emotionEmojis[option.toLowerCase()] || '😐'}</span>
                  <span className="capitalize text-xl">
                        <span className="text-2xl">{emotionEmojis[option] || '😊'}</span>
                        <span>{option}</span>
                      </span>

                      <SpeakerIcon
                        text={`The emotion is ${option}`}
                        className="ml-2 flex-shrink-0"
                        size="sm"
                        aria-label={`Read aloud: ${option}`}
                      />
                    </Button>
                  );
                })}

                {/* Feedback Section - Compact */}
                {hasAnswered && (
                  <Card className="mt-2 shadow-sm">
                    <CardContent className="p-3">
                      <div className="text-center">
                        {selectedAnswer === question.correctAnswer ? (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-400">
                            <div className="text-green-700 font-bold text-base">
                              ✓ Correct! They're <span className="capitalize">{question.correctAnswer}</span>! 🌟
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border border-orange-400">
                            <div className="text-orange-700 font-bold text-base">
                              The answer is <span className="capitalize">{question.correctAnswer}</span>.
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuestionType1;