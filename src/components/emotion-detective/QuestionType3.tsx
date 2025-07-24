import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { cn } from '../../lib/utils';

/**
 * QuestionType3 Component (Scenario → Face)
 * Displays scenario text with 2x2 face image grid
 * Includes proper attempts, sound effects, and improved UI
 */
export const QuestionType3: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const hasSpokenQuestionRef = useRef(false);

  const MAX_ATTEMPTS = 3;

  // Speak the scenario immediately when component loads - ONLY ONCE
  useEffect(() => {
    if (hasSpokenQuestionRef.current) return; // Prevent multiple calls

    const speakScenario = async () => {
      try {
        const textToSpeak = `${question.questionText} ${question.scenario}`;
        console.log('🎵 QuestionType3: Speaking scenario once:', textToSpeak);
        hasSpokenQuestionRef.current = true; // Mark as spoken
        onTTSRequest(textToSpeak);
      } catch (error) {
        console.error('❌ QuestionType3: Error speaking scenario:', error);
      }
    };

    speakScenario();
  }, [question.questionText, question.scenario, onTTSRequest]);

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

  if (!question.scenario || !question.faceOptions || question.faceOptions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error: No scenario or face options provided for this question
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-[90vh] max-h-[800px] flex flex-col p-2">
      {/* Question Header with Scenario - More prominent */}
      <Card className="mb-3 flex-shrink-0">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-lg font-semibold text-center flex items-center justify-center gap-2 mb-2">
            How would someone feel in this situation?
            <SpeakerIcon
              text={`${question.questionText} ${question.scenario}`}
              className="ml-2"
              aria-label="Read scenario aloud"
            />
          </CardTitle>

          {/* Scenario prominently displayed */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <p className="text-base leading-relaxed text-gray-800 font-medium">
              "{question.scenario}"
            </p>
          </div>



          {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
            <div className="text-center mt-2">
              <Badge variant="outline" className="text-xs">
                Attempt {attempts + 1} of {MAX_ATTEMPTS}
              </Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Face Options Grid - Full width, single focus */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <CardTitle className="text-base text-center">Choose the matching emotion:</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-3">
          <div className="grid grid-cols-2 gap-3 h-full max-h-[400px]">
            {question.faceOptions.map((face, index) => (
              <Card
                key={`${face.id}-${index}`}
                className={cn(
                  'transition-all duration-200 flex flex-col cursor-pointer hover:shadow-lg',
                  getFaceCardClassName(face.id)
                )}
                onClick={() => handleFaceSelect(face.id)}
              >
                <CardContent className="p-3 flex-1 flex flex-col">
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
                        <Badge className="bg-green-600 text-white text-sm">
                          ✓ Correct
                        </Badge>
                      )}
                      {face.id === selectedAnswer && face.id !== question.correctAnswer && (
                        <Badge variant="destructive" className="text-sm">
                          ✗ Try Again
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section - Compact */}
      {hasAnswered && (
        <Card className="mt-2 flex-shrink-0">
          <CardContent className="p-3">
            <div className="text-center">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-semibold text-base">
                  🎉 Great job! In that situation, someone would likely feel {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold text-base">
                  In that situation, someone would likely feel {question.emotion}. Great effort!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionType3;