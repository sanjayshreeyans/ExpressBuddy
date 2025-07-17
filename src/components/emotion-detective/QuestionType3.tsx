import React from 'react';
import { QuestionComponentProps } from '../../types/emotion-detective';

/**
 * Question Type 3: Scenario → Face
 * This is a placeholder that will be implemented in subsequent tasks
 */
const QuestionType3: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  return (
    <div className="question-type-3">
      <h3>Question Type 3: How would someone feel in this situation?</h3>
      <p>Question ID: {question.id}</p>
      <p>This component will be implemented in subsequent tasks.</p>
    </div>
  );
};

export default QuestionType3;