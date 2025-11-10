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

  return (
    <Badge
      className={`
        font-['Poppins',sans-serif] 
        text-sm 
        px-3 
        py-1 
        rounded-full
        flex 
        items-center 
        gap-2
        bg-[#2563eb]
        text-white
        hover:bg-[#1d4ed8]
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-base">
        schedule
      </span>
      <span className="font-medium">
        Demo: {timeString}
      </span>
    </Badge>
  );
}
