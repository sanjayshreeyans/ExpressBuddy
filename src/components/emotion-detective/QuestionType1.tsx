import React from 'react';
import { QuestionComponentProps } from '../../types/emotion-detective';

/**
 * Question Type 1: Face → Emotion
 * This is a placeholder that will be implemented in subsequent tasks
 */
const QuestionType1: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  return (
    <div className="question-type-1">
      <h3>Question Type 1: What emotion is this?</h3>
      <p>Question ID: {question.id}</p>
      <p>This component will be implemented in subsequent tasks.</p>
    </div>
  );
};

export default QuestionType1;