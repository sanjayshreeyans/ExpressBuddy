import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ResponseBuffer } from '../types/avatar';

/**
 * Hook to manage text buffering for streaming responses from Gemini Live
 * Accumulates streaming chunks and detects completion
 */
export function useResponseBuffer(): {
  buffer: ResponseBuffer;
  addChunk: (chunk: string) => void;
  markComplete: () => void;
  reset: () => void;
  accumulatedText: string;
} {
  const [buffer, setBuffer] = useState<ResponseBuffer>({
    chunks: [],
    isComplete: false,
    completeText: '',
    lastChunkTime: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const COMPLETION_TIMEOUT = 2000; // 2 seconds without new chunks = completion

  // Function to add a new text chunk
  const addChunk = useCallback((chunk: string) => {
    if (chunk && chunk.trim()) {
      setBuffer(prev => ({
        ...prev,
        chunks: [...prev.chunks, chunk],
        lastChunkTime: Date.now(),
        isComplete: false
      }));

      // Reset the completion timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to detect completion
      timeoutRef.current = setTimeout(() => {
        setBuffer(prev => {
          const completeText = prev.chunks.join('').trim();
          return {
            ...prev,
            isComplete: true,
            completeText
          };
        });
      }, COMPLETION_TIMEOUT);
    }
  }, []);

  // Function to manually mark completion (when stream end is detected)
  const markComplete = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setBuffer(prev => {
      const completeText = prev.chunks.join('').trim();
      return {
        ...prev,
        isComplete: true,
        completeText
      };
    });
  }, []);

  // Function to reset the buffer
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setBuffer({
      chunks: [],
      isComplete: false,
      completeText: '',
      lastChunkTime: 0
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get accumulated text (real-time)
  const accumulatedText = useMemo(() => buffer.chunks.join('').trim(), [buffer.chunks]);

  return {
    buffer,
    addChunk,
    markComplete,
    reset,
    accumulatedText
  };
}
