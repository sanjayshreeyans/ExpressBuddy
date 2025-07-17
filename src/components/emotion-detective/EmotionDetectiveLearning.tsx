import React from 'react';
import { EmotionDetectiveLearningProps } from '../../types/emotion-detective';

/**
 * Main Emotion Detective Learning Component
 * This is a placeholder that will be implemented in subsequent tasks
 */
const EmotionDetectiveLearning: React.FC<EmotionDetectiveLearningProps> = ({
  lessonId,
  childId,
  onComplete
}) => {
  return (
    <div className="emotion-detective-learning">
      <h1>Emotion Detective Learning</h1>
      <p>Lesson ID: {lessonId}</p>
      <p>Child ID: {childId}</p>
      <p>This component will be implemented in subsequent tasks.</p>
    </div>
  );
};

export default EmotionDetectiveLearning;