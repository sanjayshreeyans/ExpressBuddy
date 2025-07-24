import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { cn } from '../../lib/utils';

/**
 * QuestionType4 Component (Face → Scenario)
 * Shows a face image with multiple scenario text options
 * Includes proper attempts, sound effects, and improved UI
 */
export const QuestionType4: React.FC<QuestionComponentProps> = ({
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
        console.log('🎵 QuestionType4: Speaking question once:', question.questionText);
        hasSpokenQuestionRef.current = true; // Mark as spoken
        onTTSRequest(question.questionText);
      } catch (error) {
        console.error('❌ QuestionType4: Error speaking question:', error);
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

  const handleScenarioSelect = (scenario: string) => {
    if (hasAnswered && attempts >= MAX_ATTEMPTS) return;

    const isCorrect = scenario === question.correctAnswer;
    const newAttempts = attempts + 1;

    setSelectedAnswer(scenario);
    setAttempts(newAttempts);

    if (isCorrect) {
      playCorrectSound();
      setHasAnswered(true);
      // Wait a moment to show feedback, then proceed
      setTimeout(() => {
        onAnswer(scenario, true);
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

  const getButtonVariant = (scenario: string) => {
    if (!hasAnswered) return 'outline';

    if (scenario === question.correctAnswer) {
      return 'default'; // Correct answer - green styling
    }

    if (scenario === selectedAnswer && scenario !== question.correctAnswer) {
      return 'destructive'; // Wrong selected answer - red styling
    }

    return 'secondary'; // Other options - muted
  };

  const getButtonClassName = (scenario: string) => {
    if (!hasAnswered) return '';

    if (scenario === question.correctAnswer) {
      return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    }

    if (scenario === selectedAnswer && scenario !== question.correctAnswer) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
    }

    return 'opacity-60';
  };

  if (!question.faceImage || !question.options || question.options.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error: No face image or scenario options provided for this question
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
              text={question.questionText}
              className="ml-2"
              aria-label="Repeat question"
            />
          </CardTitle>
          {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
            <div className="text-center mt-1">
              <Badge variant="outline" className="text-xs">
                Attempt {attempts + 1} of {MAX_ATTEMPTS}
              </Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content - Side by side layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0">
        {/* Face Image Section */}
        <Card className="flex flex-col">
          <CardHeader className="py-2 px-3 flex-shrink-0">
            <CardTitle className="text-sm">Look at this person's expression:</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-3">
            <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
              <img
                src={question.faceImage.path}
                alt={`Person showing an emotion`}
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  console.error('❌ Failed to load face image:', question.faceImage?.path);
                  e.currentTarget.src = '/placeholder-face.jpg';
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scenario Options Section */}
        <Card className="flex flex-col">
          <CardHeader className="py-2 px-3 flex-shrink-0">
            <CardTitle className="text-sm">What situation might cause this emotion?</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-2">
            <div className="space-y-2 flex-1 overflow-y-auto">
              {question.options.map((scenario, index) => (
                <Button
                  key={`${scenario}-${index}`}
                  variant={getButtonVariant(scenario)}
                  className={cn(
                    'w-full justify-between text-left h-auto py-2 px-3',
                    getButtonClassName(scenario)
                  )}
                  onClick={() => handleScenarioSelect(scenario)}
                  disabled={hasAnswered && attempts >= MAX_ATTEMPTS}
                >
                  <span className="flex-1 text-xs leading-relaxed pr-2">
                    "{scenario}"
                  </span>

                  {/* Speaker icon for scenario options */}
                  <SpeakerIcon
                    text={scenario}
                    className="ml-2 flex-shrink-0"
                    size="sm"
                    aria-label={`Read scenario: ${scenario}`}
                  />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section - Compact */}
      {hasAnswered && (
        <Card className="mt-2 flex-shrink-0">
          <CardContent className="p-2">
            <div className="text-center text-sm">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-semibold">
                  🎉 Excellent! That situation would likely make someone feel {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  The correct situation is: "{question.correctAnswer}". Great effort!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionType4;