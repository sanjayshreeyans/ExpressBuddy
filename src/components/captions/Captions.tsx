/**
 * Captions Component for ExpressBuddy
 * Displays AI responses as text overlay for accessibility and visual feedback
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLoggerStore } from '../../lib/store-logger';
import './captions.scss';

interface CaptionsProps {
  visible?: boolean;
  subtitleText?: string; // New prop for direct subtitle text
}

interface Caption {
  id: string;
  text: string;
  timestamp: number;
  isVisible: boolean;
}

export default function Captions({
  visible = true,
  subtitleText = ''
}: CaptionsProps) {
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const captionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (subtitleText) {
      const newCaption: Caption = {
        id: `caption-${Date.now()}`,
        text: subtitleText,
        timestamp: Date.now(),
        isVisible: true
      };
      setCurrentCaption(newCaption);

      // Clear existing timeout
      if (captionTimeoutRef.current) {
        clearTimeout(captionTimeoutRef.current);
      }

      // Set timeout to fade out caption after a short delay (e.g., 200ms after text disappears)
      // The actual fade out is controlled by ExpressBuddyAvatar via subtitleText prop becoming empty
      captionTimeoutRef.current = setTimeout(() => {
        setCurrentCaption(null);
      }, 500); // Keep it visible for a short period after the text is gone
    } else {
      // If subtitleText is empty, trigger fade out
      if (currentCaption) {
        setCurrentCaption(prev => prev ? { ...prev, isVisible: false } : null);
      }
    }
  }, [subtitleText]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (captionTimeoutRef.current) {
        clearTimeout(captionTimeoutRef.current);
      }
    };
  }, []);

  if (!visible || !currentCaption || !currentCaption.text) {
    return null;
  }

  return (
    <div className="captions-overlay">
      <div 
        className={`caption ${currentCaption.isVisible ? 'visible' : 'fading'}`}
        key={currentCaption.id}
      >
        <div className="caption-text">
          {currentCaption.text}
        </div>
      </div>
      
    </div>
  );
}
