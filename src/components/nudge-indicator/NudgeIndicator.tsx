/**
 * Nudge Indicator Component for ExpressBuddy
 * 
 * Shows a visual indicator when a nudge has been sent to Gemini
 * to regain the child's attention.
 */

import React from 'react';
import cn from 'classnames';
import './nudge-indicator.scss';

interface NudgeIndicatorProps {
  visible: boolean;
  message?: string;
  className?: string;
}

export const NudgeIndicator: React.FC<NudgeIndicatorProps> = ({
  visible,
  message = "Pico is trying to say hi!",
  className = "",
}) => {
  if (!visible) return null;

  return (
    <div className={cn("nudge-indicator", className)}>
      <div className="nudge-content">
        <div className="nudge-icon">
          <span className="material-symbols-outlined">notifications_active</span>
        </div>
        <div className="nudge-text">
          <div className="nudge-title">A little nudge</div>
          <div className="nudge-message">{message}</div>
        </div>
      </div>
      <div className="nudge-animation">
        <div className="pulse-ring"></div>
        <div className="pulse-ring"></div>
        <div className="pulse-ring"></div>
      </div>
    </div>
  );
};

export default NudgeIndicator;
