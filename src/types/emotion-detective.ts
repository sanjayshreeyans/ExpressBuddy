// Emotion Detective Learning Types and Interfaces

export interface FaceImageData {
  id: string;
  filename: string; // Format: ###_age_gender_emotion_variant.jpg
  age: number;
  gender: 'male' | 'female';
  emotion: string;
  variant: number;
  path: string; // /faces/###_age_gender_emotion_variant.jpg
}

export interface EmotionData {
  id: string;
  name: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  description: string;
  scenarios: string[]; // For scenario-based questions
  faceImages: FaceImageData[]; // Associated face images
}

export interface QuestionData {
  id: string;
  type: 1 | 2 | 3 | 4;
  emotion: string;
  correctAnswer: string;
  options: string[];
  faceImage?: FaceImageData; // For types 1 and 4
  faceOptions?: FaceImageData[]; // For types 2 and 3
  scenario?: string; // For types 3 and 4
  questionText: string; // Text for Pico to speak
}

export interface LessonSession {
  id: string;
  childId: string;
  lessonType: 'emotion-detective';
  level: number;
  questions: QuestionData[];
  startTime: Date;
  endTime?: Date;
  totalXP: number;
  completedQuestions: number;
  status: 'in-progress' | 'completed' | 'abandoned';
}

export interface QuestionAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  questionType: 1 | 2 | 3 | 4;
  identificationCorrect: boolean;
  mirroringScore: number; // 0-100 from face-api.js
  attempts: number;
  timeSpent: number;
  xpEarned: number;
}

export interface FaceApiResult {
  expressions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  detectionConfidence: number;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  speed?: number;
}

// Emotion level configuration
export const EMOTION_LEVELS: Record<number, readonly string[]> = {
  1: ['happy', 'sad', 'angry', 'neutral'], // Basic emotions matching face-api.js
  2: ['disgusted', 'fearful'], // Additional face-api.js emotions (corrected mapping)
  3: ['excited', 'worried', 'confused', 'proud'], // Complex emotions (mapped from basic)
  4: ['frustrated', 'disappointed', 'grateful', 'embarrassed'],
  5: ['anxious', 'content', 'determined', 'sympathetic']
} as const;

// Face-api.js emotion mapping
export const FACE_API_EMOTION_MAPPING = {
  // Direct face-api.js emotions
  'happy': 'happy',
  'sad': 'sad', 
  'angry': 'angry',
  'neutral': 'neutral',
  'surprised': 'surprised',
  'fearful': 'fearful',
  'disgusted': 'disgusted',
  
  // Complex emotions mapped to face-api.js equivalents
  'excited': 'happy',
  'worried': 'fearful',
  'confused': 'neutral',
  'frustrated': 'angry',
  'disappointed': 'sad'
} as const;

// Emotion metadata
export interface EmotionMetadata {
  description: string;
  scenarios: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  faceApiEmotion: string;
}

export const EMOTION_METADATA: Record<string, EmotionMetadata> = {
  happy: {
    description: 'Feeling good and cheerful',
    scenarios: [
      'I got a new toy today!',
      'My friend came to play with me',
      'I finished my puzzle all by myself'
    ],
    difficulty: 'basic',
    faceApiEmotion: 'happy'
  },
  sad: {
    description: 'Feeling down or unhappy',
    scenarios: [
      'My pet is sick',
      'I lost my favorite toy',
      'My friend moved away'
    ],
    difficulty: 'basic',
    faceApiEmotion: 'sad'
  },
  angry: {
    description: 'Feeling mad or upset',
    scenarios: [
      'Someone took my toy without asking',
      'I have to clean my room when I want to play',
      'My little brother broke my drawing'
    ],
    difficulty: 'basic',
    faceApiEmotion: 'angry'
  },
  neutral: {
    description: 'Feeling calm and peaceful',
    scenarios: [
      'I am reading a book quietly',
      'I am waiting for my turn',
      'I am listening to music'
    ],
    difficulty: 'basic',
    faceApiEmotion: 'neutral'
  },
  surprised: {
    description: 'Feeling shocked or amazed',
    scenarios: [
      'I found a present under my bed',
      'Dad came home early from work',
      'There was a rainbow after the rain'
    ],
    difficulty: 'intermediate',
    faceApiEmotion: 'surprised'
  },
  fearful: {
    description: 'Feeling scared or worried',
    scenarios: [
      'I heard a loud noise in the dark',
      'I saw a big spider',
      'I got lost in the store'
    ],
    difficulty: 'intermediate',
    faceApiEmotion: 'fearful'
  },
  disgusted: {
    description: 'Feeling sick or grossed out',
    scenarios: [
      'I smelled something really bad',
      'I saw moldy food',
      'I stepped in something yucky'
    ],
    difficulty: 'intermediate',
    faceApiEmotion: 'disgusted'
  }
};

// Question templates
export const QUESTION_TEMPLATES = {
  type1: "What emotion is this person showing?",
  type2: "Which face shows someone who is feeling {emotion}?",
  type3: "How would someone feel in this situation: {scenario}?",
  type4: "What situation might make someone feel this way?"
} as const;

// XP calculation constants
export const XP_REWARDS = {
  CORRECT_IDENTIFICATION: 10,
  SUCCESSFUL_MIRRORING: 15,
  SPEED_BONUS: 5,
  SESSION_COMPLETION_BONUS: 50
} as const;

// Lesson phase types
export type LessonPhase = 'intro' | 'questions' | 'mirroring' | 'complete';

// Progress tracking interfaces
export interface EmotionDetectiveProgress {
  id: string;
  childId: string;
  level: number;
  totalXP: number;
  completedSessions: number;
  currentStreak: number;
  bestStreak: number;
  unlockedEmotions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonResults {
  sessionId: string;
  totalXP: number;
  correctIdentifications: number;
  successfulMirrors: number;
  completedQuestions: number;
  timeSpent: number;
  level: number;
}

// Component prop interfaces
export interface EmotionDetectiveLearningProps {
  lessonId: string;
  childId: string;
  onComplete: (results: LessonResults) => void;
}

export interface LessonIntroductionProps {
  lessonLevel: number;
  onIntroComplete: () => void;
}

export interface QuestionComponentProps {
  question: QuestionData;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  onTTSRequest: (text: string) => void;
}

export interface EmotionMirroringProps {
  targetEmotion: string;
  referenceImage: FaceImageData;
  onMirroringComplete: (score: number, success: boolean) => void;
  onRetry: () => void;
}

export interface ProgressTrackingProps {
  currentXP: number;
  sessionXP: number;
  level: number;
  completedQuestions: number;
  totalQuestions: number;
}

export interface SessionStats {
  correctIdentifications: number;
  successfulMirrors: number;
  totalQuestions: number;
  averageResponseTime: number;
  perfectStreak: number;
  sessionDuration: number;
}