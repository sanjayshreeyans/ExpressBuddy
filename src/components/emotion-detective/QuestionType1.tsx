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
        console.error('❌ QuestionType1: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, ttsActions, onTTSRequest]);

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    const isCorrect = answer === question.correctAnswer;
    onAnswer(answer, isCorrect);
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
    if (!hasAnswered) return '';
    
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Face Image Section */}
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
                  Variant: {question.faceImage.variant}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Options Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose the emotion:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <Button
                key={`${option}-${index}`}
                variant={getButtonVariant(option)}
                className={cn(
                  'w-full justify-between text-left h-auto py-4 px-4',
                  getButtonClassName(option)
                )}
                onClick={() => handleAnswerSelect(option)}
                disabled={hasAnswered}
              >
                <span className="flex-1 text-base font-medium capitalize">
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
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      {hasAnswered && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="text-center">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-semibold">
                  🎉 Correct! This person is showing {question.correctAnswer}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  Not quite right. This person is showing {question.correctAnswer}, not {selectedAnswer}.
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

export default QuestionType1;