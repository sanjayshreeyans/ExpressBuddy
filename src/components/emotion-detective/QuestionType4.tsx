import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { HelpCircle, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Compact Header */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b">
        <div className="py-3 px-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            What Situation Causes This?
          </h1>
          <SpeakerIcon
            text={question.questionText}
            className="mx-auto"
            aria-label="Repeat question"
          />
          {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
            <div className="mt-2">
              <Badge className="bg-orange-500 text-white px-3 py-0.5 text-xs">
                Attempt {attempts + 1} of {MAX_ATTEMPTS}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Compact Side by Side */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Face Image Section */}
        <div className="flex flex-col min-h-0">
          <Card className="h-full flex flex-col shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-rose-50 py-2 flex-shrink-0">
              <CardTitle className="text-base font-semibold text-gray-700 text-center">
                Study This Expression
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex items-center justify-center bg-white overflow-auto min-h-0">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={question.faceImage.path}
                  alt={`Person showing an emotion`}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-md"
                  onError={(e) => {
                    console.error('❌ Failed to load face image:', question.faceImage?.path);
                    e.currentTarget.src = '/placeholder-face.jpg';
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Options Section */}
        <div className="flex flex-col">
          <Card className="h-full flex flex-col shadow-lg">
            <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-amber-50 py-2">
              <CardTitle className="text-base font-semibold text-gray-700 text-center">
                Choose the Right Situation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {question.options.map((scenario, index) => (
                  <Button
                    key={`${scenario}-${index}`}
                    variant={getButtonVariant(scenario)}
                    className={cn(
                      'w-full justify-between text-left h-auto py-2.5 px-4 font-semibold transition-all duration-200 border-2 text-sm',
                      getButtonClassName(scenario)
                    )}
                    onClick={() => handleScenarioSelect(scenario)}
                    disabled={hasAnswered && attempts >= MAX_ATTEMPTS}
                  >
                    <span className="flex-1 leading-snug pr-2">
                      "{scenario}"
                    </span>

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
      </div>

      {/* Feedback Section - Compact */}
      {hasAnswered && (
        <div className="flex-shrink-0 border-t border-rose-200 bg-white shadow-sm p-3">
          <div className="max-w-4xl mx-auto">
            {selectedAnswer === question.correctAnswer ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-400 text-center">
                <div className="text-green-700 font-bold text-lg">
                  ✓ Perfect! That causes <span className="capitalize">{question.emotion}</span>! 🌟
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border border-orange-400 text-center">
                <div className="text-orange-700 font-bold text-lg">
                  That situation would cause <span className="capitalize">{question.emotion}</span>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionType4;