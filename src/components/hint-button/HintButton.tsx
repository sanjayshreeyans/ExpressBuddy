import React from 'react';
import { Button } from '../ui/button';
import { Lightbulb } from 'lucide-react';

interface HintButtonProps {
  onHintClick: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  className?: string;
}

export function HintButton({ 
  onHintClick, 
  isProcessing, 
  disabled = false,
  className = "" 
}: HintButtonProps) {
  return (
    <Button
      onClick={onHintClick}
      disabled={disabled || isProcessing}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className}`}
    >
      <Lightbulb className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
      {isProcessing ? 'Getting Hint...' : 'Get Hint'}
    </Button>
  );
}
