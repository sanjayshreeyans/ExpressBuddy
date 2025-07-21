import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';

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
    <div className="w-full h-[10vh] max-h-[200px] flex flex-col p-1">
      {/* Question Header - Compact */}
      <Card className="mb-2 flex-shrink-0">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-base font-semibold text-center flex items-center justify-center gap-2">
            {question.questionText}
            <SpeakerIcon
              text={question.questionText}
              className="ml-2"
              aria-label="Repeat question"
            />
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Content Layout - Flexible height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0">
        {/* Face Image Section - Compact */}
        <Card className="h-[80vh] max-h-[500px]">
          <CardContent className="p-2 h-full flex flex-col max-h-[300px]">
            <AspectRatio ratio={3 / 4} className="bg-muted rounded-lg overflow-hidden flex-1 max-h-[490px]">
              <img
                src={question.faceImage.path}
                alt={`Person showing an emotion`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('❌ Failed to load face image:', question.faceImage?.path);
                  e.currentTarget.src = '/placeholder-face.jpg'; // Fallback image
                }}
              />
            </AspectRatio>

            {/* Image metadata for debugging - Removed male age and variant */}

          </CardContent>
        </Card>

        {/* Answer Options Section - Scrollable if needed */}
        <Card className="h-full flex flex-col">
          <CardHeader className="py-2 px-3 flex-shrink-0">
            <CardTitle className="text-sm flex items-center justify-between">
              Choose the emotion:
              {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
                <Badge variant="outline" className="text-sm">
                  Attempt {attempts + 1} of {MAX_ATTEMPTS}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto px-3 pb-2">
            <div className="space-y-1.5">
              {question.options.map((option, index) => (
                <Button
                  key={`${option}-${index}`}
                  variant={getButtonVariant(option)}
                  className={cn(
                    'w-full justify-between text-left h-auto py-2 px-3',
                    getButtonClassName(option)
                  )}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={hasAnswered}
                >
                  <span className="flex-1 text-xs font-medium capitalize">
                    {option}
                  </span>

                  {/* Speaker icon for text options */}
                  <SpeakerIcon
                    text={`The emotion is ${option}`}
                    className="ml-2 flex-shrink-0"
                    size="sm"
                    aria-label={`Read aloud: ${option}`}
                  />
                </Button>
              ))}

              {/* Feedback Section - Moved underneath options */}
              {hasAnswered && (
                <div className="mt-2 p-2 rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    {selectedAnswer === question.correctAnswer ? (
                      <div className="text-green-600 font-semibold text-xs">
                        🎉 Correct! This person is showing {question.correctAnswer}.
                      </div>
                    ) : (
                      <div className="text-red-600 font-semibold text-xs">
                        Not quite right. This person is showing {question.correctAnswer}, not {selectedAnswer}.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestionType1;