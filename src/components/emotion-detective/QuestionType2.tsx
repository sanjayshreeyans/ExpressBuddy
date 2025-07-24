import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { QuestionComponentProps } from '../../types/emotion-detective';
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
  const hasSpokenQuestionRef = useRef(false);

  // Speak the question immediately when component loads - ONLY ONCE
  useEffect(() => {
    if (hasSpokenQuestionRef.current) return; // Prevent multiple calls

    const speakQuestion = async () => {
      try {
        console.log('🎵 QuestionType2: Speaking question once:', question.questionText);
        hasSpokenQuestionRef.current = true; // Mark as spoken
        onTTSRequest(question.questionText);
      } catch (error) {
        console.error('❌ QuestionType2: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, onTTSRequest]);

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
    <div className="h-screen flex flex-col p-4 max-w-4xl mx-auto">
      {/* Compact Question Header */}
      <Card className="mb-4 flex-shrink-0">
        <CardContent className="p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">{question.questionText}</h2>
            <p className="text-sm text-muted-foreground">
              Look for someone who is feeling <strong className="text-foreground capitalize">{question.emotion}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Face Options Grid - Optimized for single screen */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {question.faceOptions.map((face, index) => (
          <Card
            key={`${face.id}-${index}`}
            className={cn(
              'transition-all duration-200 flex flex-col',
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
              {hasAnswered && (
                <div className="mt-3 text-center">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compact Feedback Section */}
      {hasAnswered && (
        <Card className="mt-4 flex-shrink-0">
          <CardContent className="p-3">
            <div className="text-center text-sm">
              {selectedAnswer === question.correctAnswer ? (
                <div className="text-green-600 font-medium">
                  🎉 Excellent! You correctly identified the person who is feeling {question.emotion}.
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  Not quite right. Look for the facial expression that shows {question.emotion}.
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