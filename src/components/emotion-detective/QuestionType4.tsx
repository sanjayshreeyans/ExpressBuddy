import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
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
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });

  // Speak the question immediately when component loads
  useEffect(() => {
    const speakQuestion = async () => {
      try {
        await ttsActions.speak({
          text: question.questionText
        });
        onTTSRequest(question.questionText);
      } catch (error) {
        console.error('❌ QuestionType4: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, ttsActions, onTTSRequest]);

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
    <div className="w-full max-w-6xl mx-auto">
      {/* Question Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
            {question.questionText}
            <SpeakerIcon 
              text={question.questionText}
              className="ml-2"
              aria-label="Repeat question"
            />
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Face Image Section */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardContent className="p-6">
              <AspectRatio ratio={4/5} className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={question.faceImage.path}
                  alt={`Person showing an emotion`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Failed to load face image:', question.faceImage?.path);
                    e.currentTarget.src = '/placeholder-face.jpg'; // Fallback image
                  }}
                />
              </AspectRatio>
              
              {/* Image metadata for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="mr-2">
                    {question.faceImage.gender}
                  </Badge>
                  <Badge variant="outline" className="mr-2">
                    Age: {question.faceImage.age}
                  </Badge>
                  <Badge variant="outline">
                    {question.faceImage.emotion}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scenario Options Section */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What situation might cause this emotion?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((scenario, index) => (
                <Button
                  key={`${scenario}-${index}`}
                  variant={getButtonVariant(scenario)}
                  className={cn(
                    'w-full justify-between text-left h-auto py-4 px-4',
                    getButtonClassName(scenario)
                  )}
                  onClick={() => handleScenarioSelect(scenario)}
                  disabled={hasAnswered}
                >
                  <span className="flex-1 text-sm leading-relaxed pr-2">
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
                  🎉 Excellent! That situation would likely make someone feel {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  Not quite right. The correct situation is: "{question.correctAnswer}"
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

export default QuestionType4;