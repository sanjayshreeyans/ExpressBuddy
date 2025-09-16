/**
 * Hook for rendering text word by word with configurable timing
 * Used for real-time subtitle display in ExpressBuddy video avatar
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface WordByWordRendererOptions {
  /** Words per minute for automatic rendering speed */
  wordsPerMinute?: number;
  /** Manual delay between words in milliseconds */
  wordDelayMs?: number;
  /** Whether to auto-start rendering when text changes */
  autoStart?: boolean;
  /** Callback when word rendering is complete */
  onComplete?: () => void;
  /** Callback for each word rendered */
  onWordRendered?: (word: string, index: number, total: number) => void;
}

interface WordByWordState {
  /** Current text being displayed word by word */
  displayedText: string;
  /** Array of words from the current text */
  words: string[];
  /** Current word index being displayed */
  currentWordIndex: number;
  /** Whether rendering is currently active */
  isRendering: boolean;
  /** Whether rendering is complete */
  isComplete: boolean;
  /** Progress percentage (0-100) */
  progress: number;
}

interface WordByWordControls {
  /** Start or resume word by word rendering */
  start: () => void;
  /** Pause word by word rendering */
  pause: () => void;
  /** Stop and reset rendering */
  stop: () => void;
  /** Reset to beginning */
  reset: () => void;
  /** Set new text to render */
  setText: (text: string) => void;
  /** Skip to specific word index */
  skipToWord: (index: number) => void;
  /** Render all remaining words instantly */
  showAll: () => void;
}

export function useWordByWordRenderer(
  initialText: string = '',
  options: WordByWordRendererOptions = {}
): [WordByWordState, WordByWordControls] {
  const {
    wordsPerMinute = 180, // Average speaking rate
    wordDelayMs,
    autoStart = true,
    onComplete,
    onWordRendered
  } = options;

  // Calculate delay between words
  const delayMs = wordDelayMs ?? Math.floor(60000 / wordsPerMinute);

  const [text, setText] = useState(initialText);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const shouldAutoStartRef = useRef(autoStart);

  // Update auto-start preference
  useEffect(() => {
    shouldAutoStartRef.current = autoStart;
  }, [autoStart]);

  // Keep internal text in sync with incoming initialText prop
  // This ensures the hook reacts when the caller passes new text.
  useEffect(() => {
    if (initialText !== text) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setText(initialText);
      // If autoStart is enabled, the [text] effect below will start rendering.
    }
    // We intentionally exclude `text` setter from deps; comparing value is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  // Parse text into words when text changes
  useEffect(() => {
    if (!text.trim()) {
      setWords([]);
      setCurrentWordIndex(0);
      setIsComplete(false);
      setIsRendering(false);
      return;
    }

    // Split text into words, preserving spaces and punctuation
    const wordArray = text.trim().split(/(\s+)/).filter(word => word.length > 0);
    setWords(wordArray);
    setCurrentWordIndex(0);
    setIsComplete(false);

    // Auto-start rendering if enabled
    if (shouldAutoStartRef.current && wordArray.length > 0) {
      setIsRendering(true);
    }
  }, [text]);

  // Word by word rendering effect
  useEffect(() => {
    if (!isRendering || words.length === 0) {
      return;
    }

    if (currentWordIndex >= words.length) {
      setIsRendering(false);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const currentWord = words[currentWordIndex];
    onWordRendered?.(currentWord, currentWordIndex, words.length);

    timeoutRef.current = setTimeout(() => {
      setCurrentWordIndex(prev => prev + 1);
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isRendering, currentWordIndex, words, delayMs, onComplete, onWordRendered]);

  // Generate displayed text from current word index
  const displayedText = words.slice(0, currentWordIndex).join('');

  // Calculate progress
  const progress = words.length > 0 ? Math.floor((currentWordIndex / words.length) * 100) : 0;

  // Control functions
  const start = useCallback(() => {
    if (words.length > 0 && currentWordIndex < words.length) {
      setIsRendering(true);
      setIsComplete(false);
    }
  }, [words.length, currentWordIndex]);

  const pause = useCallback(() => {
    setIsRendering(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    setIsRendering(false);
    setCurrentWordIndex(0);
    setIsComplete(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
  }, [stop]);

  const setTextAndReset = useCallback((newText: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setText(newText);
  }, []);

  const skipToWord = useCallback((index: number) => {
    if (index >= 0 && index <= words.length) {
      setCurrentWordIndex(index);
      if (index >= words.length) {
        setIsRendering(false);
        setIsComplete(true);
        onComplete?.();
      }
    }
  }, [words.length, onComplete]);

  const showAll = useCallback(() => {
    setCurrentWordIndex(words.length);
    setIsRendering(false);
    setIsComplete(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onComplete?.();
  }, [words.length, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const state: WordByWordState = {
    displayedText,
    words,
    currentWordIndex,
    isRendering,
    isComplete,
    progress
  };

  const controls: WordByWordControls = {
    start,
    pause,
    stop,
    reset,
    setText: setTextAndReset,
    skipToWord,
    showAll
  };

  return [state, controls];
}
