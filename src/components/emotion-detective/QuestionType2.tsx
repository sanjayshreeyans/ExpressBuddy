import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { useTTSPlayback } from '../../hooks/useTTSPlayback';
import { cn } from '../../lib/utils';

/**
 * QuestionType2 Component (Emotion → Face)
 * Describes an emotion and displays 4 face images for selection
 * No speaker icons needed - visual selection only
 */
export const QuestionType2: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [ttsState, ttsActions] = useTTSPlayback({ autoConnect: true });

  // Speak the emotion description immediately when component loads
  useEffect(() => {
    const speakQuestion = async () => {
      try {
        await ttsActions.speak({
          text: question.questionText
        });
        onTTSRequest(question.questionText);
      } catch (error) {
        console.error('❌ QuestionType2: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, ttsActions, onTTSRequest]);

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
    <div className="w-full max-w-6xl mx-auto">
      {/* Question Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-center">
            {question.questionText}
          </CardTitle>
          {/* Emotion description */}
          <div className="text-center text-muted-foreground mt-2">
            Look for someone who is feeling <strong className="text-foreground capitalize">{question.emotion}</strong>
          </div>
        </CardHeader>
      </Card>

      {/* Face Options Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {question.faceOptions.map((face, index) => (
          <Card
            key={`${face.id}-${index}`}
            className={cn(
              'transition-all duration-200',
              getFaceCardClassName(face.id)
            )}
            onClick={() => handleFaceSelect(face.id)}
          >
            <CardContent className="p-4">
              <AspectRatio ratio={4/5} className="bg-muted rounded-lg overflow-hidden">
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
                    <Badge className="bg-green-600 text-white">
                      ✓ Correct
                    </Badge>
                  )}
                  {face.id === selectedAnswer && face.id !== question.correctAnswer && (
                    <Badge variant="destructive">
                      ✗ Incorrect
                    </Badge>
                  )}
                </div>
              )}

              {/* Image metadata for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  <Badge variant="outline" className="mr-1 text-xs">
                    {face.gender}
                  </Badge>
                  <Badge variant="outline" className="mr-1 text-xs">
                    {face.age}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {face.emotion}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Section */}
      {hasAnswered && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-semibold">
                  🎉 Excellent! You correctly identified the person who is feeling {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-semibold">
                  Not quite right. Look for the facial expression that shows {question.emotion}.
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

export default QuestionType2;