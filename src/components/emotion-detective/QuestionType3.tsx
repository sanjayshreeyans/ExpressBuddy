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
 * Includes TTS for scenario reading with speaker icon
 */
export const QuestionType3: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const hasSpokenQuestionRef = useRef(false);

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

  const handleFaceSelect = (faceId: string) => {
    if (hasAnswered) return;

    setSelectedAnswer(faceId);
    setHasAnswered(true);

    const isCorrect = faceId === question.correctAnswer;
    onAnswer(faceId, isCorrect);
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
    <div className="h-screen flex flex-col p-4 max-w-5xl mx-auto">
      {/* Compact Question Header */}
      <Card className="mb-4 flex-shrink-0">
        <CardContent className="p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">{question.questionText}</h2>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Side by side layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Scenario Section */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              Situation
              <SpeakerIcon
                text={`${question.questionText} ${question.scenario}`}
                className="ml-auto"
                aria-label="Read scenario aloud"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 text-sm leading-relaxed p-4 bg-muted rounded-lg">
              "{question.scenario}"
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              How would someone feel in this situation?
            </div>
          </CardContent>
        </Card>

        {/* Face Options Grid */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base">Choose the matching emotion:</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="grid grid-cols-2 gap-3 h-full">
              {question.faceOptions.map((face, index) => (
                <Card
                  key={`${face.id}-${index}`}
                  className={cn(
                    'transition-all duration-200 flex flex-col',
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
                    {hasAnswered && (
                      <div className="mt-2 text-center">
                        {face.id === question.correctAnswer && (
                          <Badge className="bg-green-600 text-white text-xs">
                            ✓ Correct
                          </Badge>
                        )}
                        {face.id === selectedAnswer && face.id !== question.correctAnswer && (
                          <Badge variant="destructive" className="text-xs">
                            ✗ Incorrect
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
      </div>

      {/* Compact Feedback Section */}
      {hasAnswered && (
        <Card className="mt-4 flex-shrink-0">
          <CardContent className="p-3">
            <div className="text-center text-sm">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-medium">
                  🎉 Great job! In that situation, someone would likely feel {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  Think about it again. In that situation, someone would likely feel {question.emotion}.
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