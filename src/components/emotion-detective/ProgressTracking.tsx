import React from 'react';
import { ProgressTrackingProps } from '../../types/emotion-detective';

/**
 * Progress Tracking Component
 * This is a placeholder that will be implemented in subsequent tasks
 */
const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  currentXP,
  sessionXP,
  level,
  completedQuestions,
  totalQuestions
}) => {
  return (
    <div className="progress-tracking">
      <h3>Progress Tracking</h3>
      <p>Level: {level}</p>
      <p>Current XP: {currentXP}</p>
      <p>Session XP: {sessionXP}</p>
      <p>Questions: {completedQuestions}/{totalQuestions}</p>
      <p>This component will be implemented in subsequent tasks.</p>
    </div>
  );
};

export default ProgressTracking;