// Type definitions for ExpressBuddy Avatar System

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// Avatar state for ExpressBuddy integration
export interface AvatarState {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  currentText?: string;
  isBuffering: boolean;
  hasGeneratedContent: boolean;
}

// Text buffering for streaming responses
export interface ResponseBuffer {
  chunks: string[];
  isComplete: boolean;
  completeText: string;
  lastChunkTime: number;
}
