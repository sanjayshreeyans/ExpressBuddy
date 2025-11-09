import React from 'react';
import { Badge } from '../ui/badge';

interface DemoTimerDisplayProps {
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  className?: string;
}

/**
 * Visual display of the demo timer countdown
 */
export function DemoTimerDisplay({ timeRemaining, formatTime, className = '' }: DemoTimerDisplayProps) {
  const timeString = formatTime(timeRemaining);
  const isLowTime = timeRemaining <= 30; // Last 30 seconds
  const isCritical = timeRemaining <= 10; // Last 10 seconds

  return (
    <Badge
      variant={isCritical ? 'destructive' : isLowTime ? 'default' : 'secondary'}
      className={`
        font-['Poppins',sans-serif] 
        text-sm 
        px-3 
        py-1 
        rounded-full
        flex 
        items-center 
        gap-2
        ${isCritical ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-base">
        {isCritical ? 'warning' : 'schedule'}
      </span>
      <span className="font-medium">
        Demo: {timeString}
      </span>
    </Badge>
  );
}
