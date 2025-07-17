import React from 'react';
import { QuestionComponentProps } from '../../types/emotion-detective';

/**
 * Question Type 2: Emotion → Face
 * This is a placeholder that will be implemented in subsequent tasks
 */
const QuestionType2: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  return (
    <div className="question-type-2">
      <h3>Question Type 2: Which face shows this emotion?</h3>
      <p>Question ID: {question.id}</p>
      <p>This component will be implemented in subsequent tasks.</p>
    </div>
  );
};

export default QuestionType2;