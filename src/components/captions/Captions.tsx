/**
 * Captions Component for ExpressBuddy
 * Displays AI responses as text overlay for accessibility and visual feedback
 */

import React, { useEffect, useState, useRef } from 'react';
import { useLoggerStore } from '../../lib/store-logger';
import './captions.scss';

interface CaptionsProps {
  visible?: boolean;
  maxDisplayTime?: number; // How long to show each caption (ms)
  fadeOutTime?: number; // Fade out duration (ms)
}

interface Caption {
  id: string;
  text: string;
  timestamp: number;
  isVisible: boolean;
}

export default function Captions({ 
  visible = true, 
  maxDisplayTime = 5000,
  fadeOutTime = 1000 
}: CaptionsProps) {
  const { logs } = useLoggerStore();
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const captionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract text from model turn parts
  const extractTextFromModelTurn = (parts: any[]): string => {
    return parts
      .filter(part => part.text && part.text.trim() !== '' && part.text !== '\n')
      .map(part => part.text)
      .join(' ')
      .trim();
  };

  // Monitor logs for AI responses
  useEffect(() => {
    if (!logs.length) return;

    const latestLog = logs[logs.length - 1];
    
    // Check for model turn content (AI response)
    if (latestLog.type === 'server.content' && 
        typeof latestLog.message === 'object' && 
        'serverContent' in latestLog.message) {
      
      const serverContent = latestLog.message.serverContent;
      
      if (serverContent && 'modelTurn' in serverContent && serverContent.modelTurn?.parts) {
        const textContent = extractTextFromModelTurn(serverContent.modelTurn.parts);
        
        if (textContent) {
          const newCaption: Caption = {
            id: `caption-${Date.now()}`,
            text: textContent,
            timestamp: Date.now(),
            isVisible: true
          };

          // Add to captions list
          setCaptions(prev => [...prev.slice(-4), newCaption]); // Keep only last 5 captions
          
          // Set as current caption
          setCurrentCaption(newCaption);

          // Clear existing timeout
          if (captionTimeoutRef.current) {
            clearTimeout(captionTimeoutRef.current);
          }

          // Set timeout to fade out caption
          captionTimeoutRef.current = setTimeout(() => {
            setCurrentCaption(prev => 
              prev && prev.id === newCaption.id 
                ? { ...prev, isVisible: false } 
                : prev
            );

            // Remove caption after fade out
            setTimeout(() => {
              setCurrentCaption(prev => 
                prev && prev.id === newCaption.id ? null : prev
              );
            }, fadeOutTime);
          }, maxDisplayTime);
        }
      }
    }
  }, [logs, maxDisplayTime, fadeOutTime]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (captionTimeoutRef.current) {
        clearTimeout(captionTimeoutRef.current);
      }
    };
  }, []);

  if (!visible || !currentCaption) {
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
      
      {/* Caption history - optional, can be toggled */}
      <div className="caption-history">
        {captions.slice(-3, -1).map((caption) => (
          <div 
            key={caption.id} 
            className="caption-history-item"
          >
            {caption.text}
          </div>
        ))}
      </div>
    </div>
  );
}
