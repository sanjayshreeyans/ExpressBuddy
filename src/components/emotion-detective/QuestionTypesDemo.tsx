import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import QuestionType1 from './QuestionType1';
import QuestionType2 from './QuestionType2';
import QuestionType3 from './QuestionType3';
import QuestionType4 from './QuestionType4';
import { QuestionData, EMOTION_METADATA } from '../../types/emotion-detective';
import FaceImagesService from '../../services/emotion-detective/FaceImagesService';

/**
 * Demo component to test all question types
 * This component creates sample questions for each type and allows testing
 */
export const QuestionTypesDemo: React.FC = () => {
  const [currentQuestionType, setCurrentQuestionType] = useState<1 | 2 | 3 | 4>(1);
  const [sampleQuestions, setSampleQuestions] = useState<Record<number, QuestionData | null>>({
    1: null,
    2: null,
    3: null,
    4: null
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { answer: string; correct: boolean } | null>>({
    1: null,
    2: null,
    3: null,
    4: null
  });

  // Initialize face images service and create sample questions
  useEffect(() => {
    const initializeDemo = async () => {
      try {
        await FaceImagesService.initialize();
        
        // Create sample questions for each type
        const questions: Record<number, QuestionData> = {
          1: createQuestionType1(),
          2: createQuestionType2(),
          3: createQuestionType3(),
          4: createQuestionType4()
        };

        setSampleQuestions(questions);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize demo:', error);
      }
    };

    initializeDemo();
  }, []);

  // Create QuestionType1 sample (Face → Emotion)
  const createQuestionType1 = (): QuestionData => {
    const emotion = 'happy';
    const faceImage = FaceImagesService.getRandomFacesForEmotion(emotion, 1)[0];
    const wrongEmotions = ['sad', 'angry', 'neutral'];
    const options = [emotion, ...wrongEmotions].sort(() => Math.random() - 0.5);

    return {
      id: 'demo-q1',
      type: 1,
      emotion,
      correctAnswer: emotion,
      options,
      faceImage,
      questionText: 'What emotion is this person showing?'
    };
  };

  // Create QuestionType2 sample (Emotion → Face)
  const createQuestionType2 = (): QuestionData => {
    const emotion = 'sad';
    const correctFace = FaceImagesService.getRandomFacesForEmotion(emotion, 1)[0];
    const wrongFaces = [
      ...FaceImagesService.getRandomFacesForEmotion('happy', 1),
      ...FaceImagesService.getRandomFacesForEmotion('angry', 1),
      ...FaceImagesService.getRandomFacesForEmotion('neutral', 1)
    ];
    const faceOptions = [correctFace, ...wrongFaces];

    return {
      id: 'demo-q2',
      type: 2,
      emotion,
      correctAnswer: correctFace.id,
      options: faceOptions.map(f => f.id),
      faceOptions,
      questionText: `Which face shows someone who is feeling ${emotion}?`
    };
  };

  // Create QuestionType3 sample (Scenario → Face)
  const createQuestionType3 = (): QuestionData => {
    const emotion = 'angry';
    const scenario = EMOTION_METADATA[emotion].scenarios[0];
    const correctFace = FaceImagesService.getRandomFacesForEmotion(emotion, 1)[0];
    const wrongFaces = [
      ...FaceImagesService.getRandomFacesForEmotion('happy', 1),
      ...FaceImagesService.getRandomFacesForEmotion('sad', 1),
      ...FaceImagesService.getRandomFacesForEmotion('neutral', 1)
    ];
    const faceOptions = [correctFace, ...wrongFaces];

    return {
      id: 'demo-q3',
      type: 3,
      emotion,
      correctAnswer: correctFace.id,
      options: faceOptions.map(f => f.id),
      faceOptions,
      scenario,
      questionText: 'How would someone feel in this situation?'
    };
  };

  // Create QuestionType4 sample (Face → Scenario)
  const createQuestionType4 = (): QuestionData => {
    const emotion = 'happy';
    const faceImage = FaceImagesService.getRandomFacesForEmotion(emotion, 1)[0];
    const correctScenario = EMOTION_METADATA[emotion].scenarios[0];
    const wrongScenarios = [
      EMOTION_METADATA['sad'].scenarios[0],
      EMOTION_METADATA['angry'].scenarios[0],
      EMOTION_METADATA['neutral'].scenarios[0]
    ];
    const options = [correctScenario, ...wrongScenarios].sort(() => Math.random() - 0.5);

    return {
      id: 'demo-q4',
      type: 4,
      emotion,
      correctAnswer: correctScenario,
      options,
      faceImage,
      questionText: 'What situation might make someone feel this way?'
    };
  };

  const handleAnswer = (questionType: number) => (answer: string, isCorrect: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionType]: { answer, correct: isCorrect }
    }));
  };

  const handleTTSRequest = (text: string) => {
    console.log('🎤 TTS Request:', text);
  };

  const resetDemo = () => {
    setAnswers({
      1: null,
      2: null,
      3: null,
      4: null
    });
    
    // Recreate questions
    const questions: Record<number, QuestionData> = {
      1: createQuestionType1(),
      2: createQuestionType2(),
      3: createQuestionType3(),
      4: createQuestionType4()
    };
    setSampleQuestions(questions);
  };

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Initializing Question Types Demo...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = sampleQuestions[currentQuestionType];
  const currentAnswer = answers[currentQuestionType];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Question Types Demo</h1>
        <p className="text-muted-foreground mt-2">
          Test all four emotion detective question types
        </p>
      </div>

      {/* Question Type Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Question Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((type) => (
              <Button
                key={type}
                variant={currentQuestionType === type ? 'default' : 'outline'}
                onClick={() => setCurrentQuestionType(type as 1 | 2 | 3 | 4)}
                className="h-auto py-4 flex flex-col gap-2"
              >
                <span className="font-semibold">Type {type}</span>
                <span className="text-xs text-muted-foreground">
                  {type === 1 && 'Face → Emotion'}
                  {type === 2 && 'Emotion → Face'}
                  {type === 3 && 'Scenario → Face'}
                  {type === 4 && 'Face → Scenario'}
                </span>
                {answers[type] && (
                  <Badge 
                    variant={answers[type]!.correct ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {answers[type]!.correct ? '✓ Correct' : '✗ Wrong'}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Question Type {currentQuestionType}: {' '}
              {currentQuestionType === 1 && 'Face → Emotion'}
              {currentQuestionType === 2 && 'Emotion → Face'}
              {currentQuestionType === 3 && 'Scenario → Face'}
              {currentQuestionType === 4 && 'Face → Scenario'}
            </h2>
            <Button onClick={resetDemo} variant="outline">
              Reset Demo
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Render the appropriate question component */}
          {currentQuestionType === 1 && (
            <QuestionType1
              question={currentQuestion}
              onAnswer={handleAnswer(1)}
              onTTSRequest={handleTTSRequest}
            />
          )}
          {currentQuestionType === 2 && (
            <QuestionType2
              question={currentQuestion}
              onAnswer={handleAnswer(2)}
              onTTSRequest={handleTTSRequest}
            />
          )}
          {currentQuestionType === 3 && (
            <QuestionType3
              question={currentQuestion}
              onAnswer={handleAnswer(3)}
              onTTSRequest={handleTTSRequest}
            />
          )}
          {currentQuestionType === 4 && (
            <QuestionType4
              question={currentQuestion}
              onAnswer={handleAnswer(4)}
              onTTSRequest={handleTTSRequest}
            />
          )}
        </div>
      )}

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((type) => (
              <div key={type} className="text-center">
                <div className="font-semibold mb-2">Type {type}</div>
                {answers[type] ? (
                  <Badge 
                    variant={answers[type]!.correct ? 'default' : 'destructive'}
                    className="w-full justify-center"
                  >
                    {answers[type]!.correct ? '✓ Correct' : '✗ Incorrect'}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center">
                    Not Answered
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Complete all question types to see full results
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionTypesDemo;