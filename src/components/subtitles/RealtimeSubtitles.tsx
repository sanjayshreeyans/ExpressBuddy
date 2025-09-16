/**
 * Real-time Subtitles Component for ExpressBuddy Video Avatar
 * Displays AI transcriptions word by word with smooth animations
 */

import React, { useEffect, useState, useRef } from 'react';
import { useWordByWordRenderer } from '../../hooks/useWordByWordRenderer';

interface RealtimeSubtitlesProps {
  /** Current AI transcript text to display */
  text: string;
  /** Whether the AI is currently speaking (controls visibility) */
  isVisible?: boolean;
  /** Maximum number of lines to display */
  maxLines?: number;
  /** Words per minute for rendering speed */
  wordsPerMinute?: number;
  /** Additional CSS class names */
  className?: string;
  /** Style preset for different display modes */
  preset?: 'default' | 'large' | 'compact' | 'cinematic';
  /** Whether to show a typing indicator when text is being rendered */
  showTypingIndicator?: boolean;
  /** Callback when subtitle rendering is complete */
  onComplete?: () => void;
  /** Enable debug mode to show rendering controls */
  debugMode?: boolean;
}

export const RealtimeSubtitles: React.FC<RealtimeSubtitlesProps> = ({
  text,
  isVisible = true,
  maxLines = 3,
  wordsPerMinute = 200, // Slightly faster than normal speech for responsiveness
  className = '',
  preset = 'default',
  showTypingIndicator = true,
  onComplete,
  debugMode = false
}) => {
  const [currentText, setCurrentText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef('');

  // Word by word renderer hook
  const [renderState, renderControls] = useWordByWordRenderer(currentText, {
    wordsPerMinute,
    autoStart: true,
    onComplete: () => {
      setIsAnimating(false);
      onComplete?.();
    },
    onWordRendered: (word, index, total) => {
      // Optional: Could trigger per-word animations here
      console.log(`📝 Subtitle word rendered: "${word}" (${index + 1}/${total})`);
    }
  });

  // Update text when new transcript arrives
  useEffect(() => {
    if (text && text !== previousTextRef.current) {
      console.log('📝 New subtitle text received:', text);
      setCurrentText(text);
      setIsAnimating(true);
      previousTextRef.current = text;
    }
  }, [text]);

  // Clear subtitles when not visible
  useEffect(() => {
    if (!isVisible) {
      setCurrentText('');
      setIsAnimating(false);
      renderControls.stop();
    }
  }, [isVisible, renderControls]);

  // Style presets
  const getPresetStyles = () => {
    const baseStyles = {
      transition: 'all 0.3s ease-in-out',
      textAlign: 'center' as const,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      hyphens: 'auto' as const
    };

    switch (preset) {
      case 'large':
        return {
          ...baseStyles,
          fontSize: '1.25rem',
          fontWeight: '600',
          lineHeight: '1.6',
          padding: '16px 24px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          borderRadius: '12px',
          maxWidth: '600px'
        };

      case 'compact':
        return {
          ...baseStyles,
          fontSize: '0.875rem',
          fontWeight: '500',
          lineHeight: '1.4',
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#374151',
          borderRadius: '8px',
          maxWidth: '400px',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        };

      case 'cinematic':
        return {
          ...baseStyles,
          fontSize: '1.125rem',
          fontWeight: '500',
          lineHeight: '1.5',
          padding: '12px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: '#f9fafb',
          borderRadius: '6px',
          maxWidth: '500px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.025em'
        };

      default:
        return {
          ...baseStyles,
          fontSize: '1rem',
          fontWeight: '500',
          lineHeight: '1.5',
          padding: '12px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#1f2937',
          borderRadius: '10px',
          maxWidth: '500px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        };
    }
  };

  // Animation styles for smooth entrance/exit
  const getAnimationStyles = () => {
    if (!isVisible || !currentText) {
      return {
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)',
        pointerEvents: 'none' as const
      };
    }

    return {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
      pointerEvents: 'auto' as const
    };
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <span
      className="typing-indicator"
      style={{
        display: 'inline-block',
        width: '8px',
        height: '16px',
        backgroundColor: 'currentColor',
        marginLeft: '4px',
        animation: 'pulse 1s infinite',
        opacity: renderState.isRendering ? 1 : 0,
        transition: 'opacity 0.2s ease'
      }}
    />
  );

  // Debug controls (only shown in debug mode)
  const DebugControls = () => {
    if (!debugMode) return null;

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '8px',
          borderRadius: '6px',
          fontSize: '12px'
        }}
      >
        <button onClick={renderControls.start} disabled={renderState.isRendering}>
          ▶️ Start
        </button>
        <button onClick={renderControls.pause} disabled={!renderState.isRendering}>
          ⏸️ Pause
        </button>
        <button onClick={renderControls.stop}>
          ⏹️ Stop
        </button>
        <button onClick={renderControls.showAll}>
          ⏭️ Show All
        </button>
        <span style={{ color: 'white', padding: '0 8px' }}>
          {renderState.progress}%
        </span>
      </div>
    );
  };

  if (!isVisible && !currentText) {
    return null;
  }

  return (
    <>
      {/* CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          
          .subtitle-container {
            max-height: ${maxLines * 1.5}em;
            overflow: hidden;
            position: relative;
          }
          
          .subtitle-text {
            display: -webkit-box;
            -webkit-line-clamp: ${maxLines};
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}
      </style>

      <div
        ref={containerRef}
        className={`realtime-subtitles subtitle-container ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '8px auto',
          zIndex: 10,
          ...getAnimationStyles()
        }}
      >
        <div
          className="subtitle-text"
          style={{
            ...getPresetStyles(),
            position: 'relative'
          }}
        >
          {renderState.displayedText}
          {showTypingIndicator && <TypingIndicator />}
        </div>

        <DebugControls />
      </div>
    </>
  );
};

export default RealtimeSubtitles;
