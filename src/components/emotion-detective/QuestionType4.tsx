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
 * Includes TTS for question and scenario options with speaker icons
 */
export const QuestionType4: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const hasSpokenQuestionRef = useRef(false);

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

  const handleScenarioSelect = (scenario: string) => {
    if (hasAnswered) return;

    setSelectedAnswer(scenario);
    setHasAnswered(true);

    const isCorrect = scenario === question.correctAnswer;
    onAnswer(scenario, isCorrect);
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
    <div className="h-screen flex flex-col p-4 max-w-5xl mx-auto">
      {/* Compact Question Header */}
      <Card className="mb-4 flex-shrink-0">
        <CardContent className="p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              {question.questionText}
              <SpeakerIcon
                text={question.questionText}
                className="ml-2"
                aria-label="Repeat question"
              />
            </h2>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Side by side layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Face Image Section */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base">Look at this person's expression:</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
              <img
                src={question.faceImage.path}
                alt={`Person showing an emotion`}
                className="absolute inset-0 w-full h-full object-cover"
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
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base">What situation might cause this emotion?</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-2 flex-1">
              {question.options.map((scenario, index) => (
                <Button
                  key={`${scenario}-${index}`}
                  variant={getButtonVariant(scenario)}
                  className={cn(
                    'w-full justify-between text-left h-auto py-3 px-3',
                    getButtonClassName(scenario)
                  )}
                  onClick={() => handleScenarioSelect(scenario)}
                  disabled={hasAnswered}
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

      {/* Compact Feedback Section */}
      {hasAnswered && (
        <Card className="mt-4 flex-shrink-0">
          <CardContent className="p-3">
            <div className="text-center text-sm">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-medium">
                  🎉 Excellent! That situation would likely make someone feel {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  Not quite right. The correct situation is: "{question.correctAnswer}"
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