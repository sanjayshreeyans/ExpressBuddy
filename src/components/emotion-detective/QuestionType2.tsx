import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AspectRatio } from '../ui/aspect-ratio';
import { SpeakerIcon } from './SpeakerIcon';
import { QuestionComponentProps } from '../../types/emotion-detective';
import { Target, Users, Grid3X3, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * QuestionType2 Component (Emotion → Face)
 * Describes an emotion and displays 4 face images for selection
 * Includes proper attempts, sound effects, and improved UI
 */
export const QuestionType2: React.FC<QuestionComponentProps> = ({
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
        const textToSpeak = `${question.questionText} Look for someone who is feeling ${question.emotion}.`;
        console.log('🎵 QuestionType2: Speaking question once:', textToSpeak);
        hasSpokenQuestionRef.current = true; // Mark as spoken
        onTTSRequest(textToSpeak);
      } catch (error) {
        console.error('❌ QuestionType2: Error speaking question:', error);
      }
    };

    speakQuestion();
  }, [question.questionText, question.emotion, onTTSRequest]);

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
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Simplified Compact Header with Target Emotion */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b">
        <div className="py-3 px-6">
          <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
            Find the Right Face
          </h1>
          
          {/* PROMINENT Target Emotion - More Compact */}
          <div className="max-w-md mx-auto bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg p-3 border-2 border-indigo-400">
            <p className="text-xs font-semibold text-gray-600 mb-1">Looking for:</p>
            <div className="text-3xl font-black capitalize text-indigo-600">
              {question.emotion}
            </div>
          </div>

          {attempts > 0 && attempts < MAX_ATTEMPTS && !hasAnswered && (
            <div className="text-center mt-2">
              <Badge className="bg-orange-500 text-white px-3 py-0.5 text-xs">
                Attempt {attempts + 1} of {MAX_ATTEMPTS}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Face Options - Horizontal Layout at Bottom */}
      <div className="flex-1 flex flex-col justify-end overflow-hidden p-6">
        <div className="flex gap-4 justify-center items-end mx-auto w-full">
          {question.faceOptions.map((face, index) => {
            return (
              <Card
                key={`${face.id}-${index}`}
                className={cn(
                  'transition-all duration-300 flex flex-col cursor-pointer border-2 shadow-lg hover:shadow-xl active:scale-95 overflow-hidden flex-1',
                  getFaceCardClassName(face.id)
                )}
                onClick={() => handleFaceSelect(face.id)}
              >
                <CardContent className="p-4">
                  {/* Face image container - Square ratio */}
                  <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg overflow-hidden flex items-center justify-center aspect-square w-full border border-gray-200">
                    <img
                      src={face.path}
                      alt={`Person ${index + 1}`}
                      className="w-full h-full object-contain p-2"
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
                        <Badge className="bg-green-600 text-white text-sm font-bold px-3 py-1 w-full">
                          ✓ Correct!
                        </Badge>
                      )}
                      {face.id === selectedAnswer && face.id !== question.correctAnswer && (
                        <Badge className="bg-red-600 text-white text-sm font-bold px-3 py-1 w-full">
                          ✗ Try Again
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feedback Section - Compact */}
      {hasAnswered && (
        <div className="flex-shrink-0 border-t border-indigo-200 bg-white shadow-sm p-3">
          <div className="max-w-4xl mx-auto">
            {selectedAnswer === question.correctAnswer ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-400 text-center">
                <div className="text-green-700 font-bold text-lg">
                  ✓ Excellent! You found someone feeling <span className="capitalize">{question.emotion}</span>! 🌟
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border border-orange-400 text-center">
                <div className="text-orange-700 font-bold text-lg">
                  The correct person feels <span className="capitalize">{question.emotion}</span>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionType2;