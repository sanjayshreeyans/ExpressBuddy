import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { cn } from '../../lib/utils';

/**
 * QuestionType2 Component (Emotion → Face)
 * Describes an emotion and displays 4 face images for selection
 * Includes proper attempts, sound effects, and improved UI
 */
export const QuestionType2: React.FC<QuestionComponentProps> = ({
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
        const textToSpeak = `${question.questionText} Look for someone who is feeling ${question.emotion}.`;
        console.log('🎵 QuestionType2: Speaking question once:', textToSpeak);
        hasSpokenQuestionRef.current = true; // Mark as spoken
        onTTSRequest(textToSpeak);
      } catch (error) {
        console.error('❌ QuestionType2: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, question.emotion, onTTSRequest]);

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

  const handleFaceSelect = (faceId: string) => {
    if (hasAnswered && attempts >= MAX_ATTEMPTS) return;

    const isCorrect = faceId === question.correctAnswer;
    const newAttempts = attempts + 1;

    setSelectedAnswer(faceId);
    setAttempts(newAttempts);

    if (isCorrect) {
      playCorrectSound();
      setHasAnswered(true);
      // Wait a moment to show feedback, then proceed
      setTimeout(() => {
        onAnswer(faceId, true);
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

  const getFaceCardClassName = (faceId: string) => {
    if (!hasAnswered) {
      return 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all';
    }

    if (faceId === question.correctAnswer) {
      return 'ring-2 ring-green-500 bg-green-50';
    }

    if (faceId === selectedAnswer && faceId !== question.correctAnswer) {
      return 'ring-2 ring-red-500 bg-red-50';
    }

    return 'opacity-60';
  };

  if (!question.faceOptions || question.faceOptions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error: No face options provided for this question
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-[90vh] max-h-[800px] flex flex-col p-2">
      {/* Question Header - Compact */}
      <Card className="mb-2 flex-shrink-0">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-base font-semibold text-center flex items-center justify-center gap-2">
            {question.questionText}
            <SpeakerIcon
              text={`${question.questionText} Look for someone who is feeling ${question.emotion}.`}
              className="ml-2"
              aria-label="Repeat question"
            />
          </CardTitle>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Look for someone who is feeling <strong className="text-foreground capitalize">{question.emotion}</strong>
            </p>
            {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
              <Badge variant="outline" className="text-xs mt-1">
                Attempt {attempts + 1} of {MAX_ATTEMPTS}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Face Options Grid - Optimized for single screen */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        {question.faceOptions.map((face, index) => (
          <Card
            key={`${face.id}-${index}`}
            className={cn(
              'transition-all duration-200 flex flex-col cursor-pointer',
              getFaceCardClassName(face.id)
            )}
            onClick={() => handleFaceSelect(face.id)}
          >
            <CardContent className="p-2 flex-1 flex flex-col">
              {/* Fixed aspect ratio container */}
              <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={face.path}
                  alt={`Person ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Failed to load face image:', face.path);
                    e.currentTarget.src = '/placeholder-face.jpg';
                  }}
                />
              </div>

              {/* Selection indicator */}
              {(selectedAnswer === face.id || (hasAnswered && face.id === question.correctAnswer)) && (
                <div className="mt-2 text-center">
                  {face.id === question.correctAnswer && (
                    <Badge className="bg-green-600 text-white text-xs">
                      ✓ Correct
                    </Badge>
                  )}
                  {face.id === selectedAnswer && face.id !== question.correctAnswer && (
                    <Badge variant="destructive" className="text-xs">
                      ✗ Try Again
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Section - Compact */}
      {hasAnswered && (
        <Card className="mt-2 flex-shrink-0">
          <CardContent className="p-2">
            <div className="text-center text-sm">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-semibold">
                  🎉 Excellent! You correctly identified the person who is feeling {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  The correct answer shows someone feeling {question.emotion}. Great effort!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionType2;