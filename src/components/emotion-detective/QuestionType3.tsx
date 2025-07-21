import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
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
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });

  // Speak the scenario immediately when component loads
  useEffect(() => {
    const speakScenario = async () => {
      try {
        const textToSpeak = `${question.questionText} ${question.scenario}`;
        await ttsActions.speak({
          text: textToSpeak
        });
        onTTSRequest(textToSpeak);
      } catch (error) {
        console.error('❌ QuestionType3: Error speaking scenario:', error);
      }
    };

    speakScenario();
  }, [question.questionText, question.scenario, ttsActions, onTTSRequest]);

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
    <div className="w-full max-w-6xl mx-auto">
      {/* Question Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-center">
            {question.questionText}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Content Layout - Scaled down to fit screen */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4 max-h-[350px]">
        {/* Scenario Section */}
        <div className="lg:col-span-2">
          <Card className="h-fit max-h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Situation
                <SpeakerIcon
                  text={`${question.questionText} ${question.scenario}`}
                  className="ml-auto"
                  aria-label="Read scenario aloud"
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-sm leading-relaxed p-3 bg-muted rounded-lg">
                "{question.scenario}"
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                How would someone feel in this situation?
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Face Options Grid */}
        <div className="lg:col-span-3">
          <Card className="max-h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Choose the matching emotion:</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {question.faceOptions.map((face, index) => (
                  <Card
                    key={`${face.id}-${index}`}
                    className={cn(
                      'transition-all duration-200',
                      getFaceCardClassName(face.id)
                    )}
                    onClick={() => handleFaceSelect(face.id)}
                  >
                    <CardContent className="p-2">
                      <AspectRatio ratio={4 / 5} className="bg-muted rounded-lg overflow-hidden max-h-[80px]">
                        <img
                          src={face.path}
                          alt={`Person ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Failed to load face image:', face.path);
                            e.currentTarget.src = '/placeholder-face.jpg'; // Fallback image
                          }}
                        />
                      </AspectRatio>

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

                      {/* Image metadata for debugging */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          <Badge variant="outline" className="mr-1 text-xs">
                            {face.emotion}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Section */}
      {hasAnswered && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-semibold">
                  🎉 Great job! In that situation, someone would likely feel {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  Think about it again. In that situation, someone would likely feel {question.emotion}.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TTS Status Indicator */}
      {ttsState.isPlaying && (
        <div className="fixed bottom-4 right-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg shadow-lg">
          🎵 Speaking...
        </div>
      )}
    </div>
  );
};

export default QuestionType3;