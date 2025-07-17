import React from 'react';
import { QuestionComponentProps } from '../../types/emotion-detective';

/**
 * Question Type 4: Face → Scenario
 * This is a placeholder that will be implemented in subsequent tasks
 */
const QuestionType4: React.FC<QuestionComponentProps> = ({
  question,
  onAnswer,
  onTTSRequest
}) => {
  return (
    <div className="question-type-4">
      <h3>Question Type 4: What situation might cause this emotion?</h3>
      <p>Question ID: {question.id}</p>
      <p>This component will be implemented in subsequent tasks.</p>
    </div>
  );
};

export default QuestionType4;