// Type definitions for PandabotLipsync integration in ExpressBuddy
// Adapted from PandabotLipsync system

export interface VisemeData {
  offset: number;
  visemeId: number;
  duration?: number; // Desired duration of the viseme in milliseconds
}

export interface VoiceData {
  id: string;
  name: string;
  previewUrl: string;
  visemesUrl: string;
  previewText: string;
  visemeCount: number;
}

export interface RiveInputs {
  mouth: {
    [key: number]: RiveInput;
  };
  emotions: {
    is_speaking: RiveInput;
    eyes_smile: RiveInput;
  };
  stress?: {
    stress: RiveInput;
  };
}

export interface RiveInput {
  value: number | boolean;
  fire?: () => void;
}

export interface VisemePlaybackOptions {
  riveInputs: RiveInputs;
  transitionDuration?: number;
  setSpeakingState?: boolean;
  manualSpeakingStateControl?: boolean;
  audioElement?: HTMLAudioElement | null;
}

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

// TTS generation response
export interface TTSResponse {
  success: boolean;
  audio_url: string;
  visemes: VisemeData[];
  subtitles: Array<{ start: number; end: number; text: string }>;
  duration: number;
  voice_id: string;
  text: string;
  timingMethod: string;
}

// The backend returns viseme IDs that directly correspond to Rive animation names (100-118)
export const SUPPORTED_VISEME_IDS = [100, 101, 102, 103, 104, 105, 107, 108, 109, 110, 112, 113, 114, 115, 116, 118];

export const STATE_MACHINE_NAME = "InLesson";
