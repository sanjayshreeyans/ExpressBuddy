# Design Document

## Overview

The Emotion Detective Learning feature is a comprehensive educational module that integrates seamlessly into the existing ExpressBuddy platform. Built on React with TypeScript, the feature leverages the current tech stack including Supabase for data persistence, Framer Motion for animations, shadcn/ui components, face-api.js for emotion detection, and the existing Rive-based Pico avatar system with TTS and lip-sync capabilities. faces are here. C:\Users\Sanjay Shreeyans J\Downloads\ExpressBuddy\live-api-web-console\Faces

The feature uses real human face images for emotion recognition training and provides four distinct question types: emotion identification from faces, face selection from emotion descriptions, scenario-based emotion matching, and reverse scenario matching. Each lesson includes camera-based emotion mirroring with face-api.js verification and immediate feedback through Pico's lip-synced TTS system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Emotion Detective Module                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Lesson Intro  │  │   Question      │  │  Emotion Mirror │ │
│  │   Component     │  │   Components    │  │   Component     │ │
│  │                 │  │   (4 Types)     │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Shared Services Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Face Images    │  │   Progress      │  │   face-api.js   │ │
│  │   Service       │  │   Service       │  │   Service       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Platform Integration                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Supabase DB    │  │   Pico Avatar   │  │   Camera API    │ │
│  │   Integration   │  │   + TTS/Viseme  │  │   Integration   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
EmotionDetectiveLearning
├── LessonIntroduction
│   ├── PicoAvatar (Rive-based with TTS)
│   ├── SubtitleDisplay
│   └── IntroAnimation
├── QuestionComponents
│   ├── QuestionType1 (Face → Emotion)
│   ├── QuestionType2 (Emotion → Face)
│   ├── QuestionType3 (Scenario → Face)
│   └── QuestionType4 (Face → Scenario)
├── EmotionMirroring
│   ├── CameraPreview
│   ├── ReferenceImage
│   ├── CaptureButton
│   └── FaceApiVerification
└── ProgressTracking
    ├── XPDisplay
    ├── SessionProgress
    └── LessonComplete
```

## Components and Interfaces

### Core Interfaces

```typescript
interface FaceImageData {
  id: string;
  filename: string; // Format: ###_age_gender_emotion_variant.jpg
  age: number;
  gender: 'male' | 'female';
  emotion: string;
  variant: number;
  path: string; // /faces/###_age_gender_emotion_variant.jpg
}

interface EmotionData {
  id: string;
  name: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  description: string;
  scenarios: string[]; // For scenario-based questions
  faceImages: FaceImageData[]; // Associated face images
}

interface QuestionData {
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

interface LessonSession {
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

interface QuestionAttempt {
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

interface FaceApiResult {
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
  landmarks?: any; // face-api.js landmarks
}

interface TTSRequest {
  text: string;
  voiceId?: string;
  speed?: number;
}
```

### Component Specifications

#### EmotionDetectiveLearning (Main Container)
- **Purpose**: Orchestrates the entire lesson flow and manages state transitions
- **Props**: `lessonId: string`, `childId: string`, `onComplete: (results: LessonResults) => void`
- **State Management**: Uses React Context for lesson state, Zustand for global progress
- **Responsibilities**: 
  - Initialize lesson data from Supabase
  - Load face images from public/faces directory
  - Manage phase transitions (intro → questions → mirroring → complete)
  - Handle browser TTS with VisemeTranscriptionService WebSocket integration
  - Persist progress in real-time

#### LessonIntroduction
- **Purpose**: Provides engaging lesson introduction with Pico
- **TTS Integration**: 
  1. Uses browser TTS (speechSynthesis API)
  2. Sends audio to VisemeTranscriptionService WebSocket for lip-sync
  3. Uses VisemePlaybackController for synchronized viseme playback
  4. Displays subtitles with lip-synced animation
  5. Smooth transition animation moves Pico to left sidebar
- **Layout**: Pico center-screen initially, then transitions to left edge
- **Accessibility**: Full subtitle support, reduced motion options

#### QuestionType1 (Face → Emotion)
- **Purpose**: Show human face image, ask "What emotion is this?"
- **Layout**: 
  - Pico avatar fixed to left edge (20% width)
  - Face image in center (40% width)
  - Multiple choice options (40% width) using shadcn/ui Cards
- **TTS Integration**: 
  - Immediate question narration when loaded
  - Speaker icons next to text options for re-reading
- **Components**: Uses shadcn/ui Button, Card, Badge components

#### QuestionType2 (Emotion → Face)
- **Purpose**: Describe emotion, show 4 face options for selection
- **Layout**: 
  - Pico avatar fixed to left edge (20% width)
  - 2x2 grid of face images (80% width)
- **TTS Integration**: 
  - Reads emotion description immediately
  - No speaker icons (visual selection only)
- **Components**: Uses shadcn/ui Card, AspectRatio for face images

#### QuestionType3 (Scenario → Face)
- **Purpose**: Describe scenario, show 4 face options for selection
- **Layout**: 
  - Pico avatar fixed to left edge (20% width)
  - Scenario text display (30% width)
  - 2x2 grid of face images (50% width)
- **TTS Integration**: 
  - Reads scenario immediately
  - Speaker icon next to scenario text
- **Components**: Uses shadcn/ui Card, Typography, AspectRatio

#### QuestionType4 (Face → Scenario)
- **Purpose**: Show face, provide 4 scenario options
- **Layout**: 
  - Pico avatar fixed to left edge (20% width)
  - Face image in center (30% width)
  - Scenario options list (50% width)
- **TTS Integration**: 
  - Asks "What situation might cause this emotion?"
  - Speaker icons next to each scenario option
- **Components**: Uses shadcn/ui Card, Button, Typography

#### EmotionMirroring
- **Purpose**: Camera-based emotion expression practice with face-api.js
- **Camera Integration**: 
  - Uses WebRTC getUserMedia API
  - Real-time preview with face detection overlay
  - Capture functionality for emotion analysis
- **face-api.js Integration**: 
  - Load models: faceDetection, faceExpressionNet
  - Real-time expression detection
  - Confidence scoring for emotion matching
  - Local processing only (no external API calls)
- **Layout**:
  - Reference face image on right (30% width)
  - Camera preview in center (50% width)
  - Pico feedback on left (20% width)
- **Components**: Uses shadcn/ui Card, Button, Progress for confidence display

#### ProgressTracking
- **Purpose**: XP system and session completion
- **XP Calculation**:
  - Correct identification: 10 XP
  - Successful mirroring: 15 XP
  - Bonus for speed: 5 XP
  - Session completion (10 questions): 50 XP bonus
- **Visual Rewards**: Uses shadcn/ui Badge, Progress, Card for XP display
- **Components**: Animated counters with Framer Motion

## Data Models

### Database Schema Extensions

```sql
-- Extend existing child progress tracking
CREATE TABLE emotion_detective_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  unlocked_emotions TEXT[] DEFAULT ARRAY['happy', 'sad', 'mad', 'surprised'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session tracking
CREATE TABLE emotion_detective_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  level INTEGER NOT NULL,
  emotions_presented TEXT[] NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_identifications INTEGER DEFAULT 0,
  successful_mirrors INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual emotion attempts
CREATE TABLE emotion_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emotion_detective_sessions(id),
  emotion_name TEXT NOT NULL,
  identification_attempts INTEGER DEFAULT 0,
  identification_correct BOOLEAN DEFAULT FALSE,
  mirroring_attempts INTEGER DEFAULT 0,
  mirroring_score INTEGER, -- 0-100 from AI
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Face Images and Emotion Configuration

```typescript
// Face image naming convention: ###_age_gender_emotion_variant.jpg
// Example: 001_25_male_happy_1.jpg, 002_30_female_sad_2.jpg

const EMOTION_LEVELS = {
  1: ['happy', 'sad', 'angry', 'neutral'], // Basic emotions matching face-api.js
  2: ['surprised', 'fearful', 'disgusted'], // Additional face-api.js emotions
  3: ['excited', 'worried', 'confused', 'proud'], // Complex emotions (mapped from basic)
  4: ['frustrated', 'disappointed', 'grateful', 'embarrassed'],
  5: ['anxious', 'content', 'determined', 'sympathetic']
};

const FACE_API_EMOTION_MAPPING = {
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
};

const EMOTION_METADATA = {
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
  surprised: {
    description: 'Feeling shocked or amazed',
    scenarios: [
      'I found a present under my bed',
      'Dad came home early from work',
      'There was a rainbow after the rain'
    ],
    difficulty: 'intermediate',
    faceApiEmotion: 'surprised'
  }
  // ... additional emotions
};

const QUESTION_TEMPLATES = {
  type1: "What emotion is this person showing?",
  type2: "Which face shows someone who is feeling {emotion}?",
  type3: "How would someone feel in this situation: {scenario}?",
  type4: "What situation might make someone feel this way?"
};
```

## Error Handling

### Camera Access Errors
- **Graceful Degradation**: If camera access fails, skip mirroring phase and continue with identification only
- **User Guidance**: Clear instructions for enabling camera permissions using shadcn/ui Alert components
- **Fallback Mode**: Allow lesson completion without mirroring component, award partial XP

### face-api.js Errors
- **Model Loading**: Retry model loading with exponential backoff, show loading progress
- **Detection Failures**: If no face detected, provide guidance overlay and retry mechanism
- **Low Confidence**: If emotion detection confidence < 60%, allow multiple attempts
- **Browser Compatibility**: Fallback to manual verification for unsupported browsers

### TTS Service Errors
- **Browser TTS Failures**: Handle speechSynthesis API unavailability with text-only fallback
- **WebSocket Connection**: Retry VisemeTranscriptionService connection with exponential backoff
- **Viseme Sync**: Continue lesson if viseme generation fails, show text-only subtitles
- **Audio Recording**: Handle microphone access issues for TTS audio capture

### Network Connectivity
- **Offline Support**: Cache face images and lesson data locally
- **Progress Persistence**: Use IndexedDB for offline progress storage
- **Sync Indicators**: Clear visual feedback about connection status using shadcn/ui Badge

## Testing Strategy

### Unit Testing
- **Component Testing**: React Testing Library for all UI components
- **Service Testing**: Jest for emotion data service, progress tracking
- **Utility Testing**: Emotion matching algorithms, XP calculations

### Integration Testing
- **Camera Integration**: Mock camera API for consistent testing
- **AI Service Integration**: Mock responses for emotion detection
- **Database Integration**: Test data persistence and retrieval

### End-to-End Testing
- **Complete Lesson Flow**: Automated testing of full lesson progression
- **Cross-browser Testing**: Ensure camera functionality across browsers
- **Accessibility Testing**: Screen reader compatibility, keyboard navigation

### Performance Testing
- **Camera Performance**: Frame rate testing, memory usage monitoring
- **Animation Performance**: Smooth transitions, no jank detection
- **Load Testing**: Multiple concurrent sessions, database performance

## Accessibility Considerations

### Visual Accessibility
- **High Contrast Mode**: Alternative color schemes for visual impairments
- **Font Scaling**: Responsive text sizing for readability
- **Motion Reduction**: Respect prefers-reduced-motion settings

### Motor Accessibility
- **Alternative Inputs**: Voice commands, switch navigation
- **Large Touch Targets**: Minimum 44px touch areas
- **Timeout Extensions**: Adjustable time limits for responses

### Cognitive Accessibility
- **Clear Instructions**: Simple, consistent language
- **Progress Indicators**: Clear visual feedback on lesson progress
- **Error Recovery**: Easy ways to retry or get help

## Security and Privacy

### Data Protection
- **Image Handling**: Temporary storage only, automatic deletion after processing
- **Encryption**: All data transmission encrypted with TLS
- **COPPA Compliance**: Minimal data collection, parental consent integration

### AI Processing
- **Local Processing**: Emotion detection on-device where possible
- **Data Minimization**: Only necessary image data sent to AI services
- **Audit Logging**: Track all AI processing requests for compliance

## Performance Optimization

### Camera Optimization
- **Stream Management**: Efficient camera stream handling, proper cleanup
- **Image Compression**: Optimize image size before AI processing
- **Frame Rate Control**: Adaptive frame rates based on device capability

### Animation Performance
- **GPU Acceleration**: Use transform and opacity for smooth animations
- **Animation Queuing**: Prevent animation conflicts and stuttering
- **Memory Management**: Proper cleanup of animation resources

### Data Loading
- **Lazy Loading**: Load emotion data as needed
- **Caching Strategy**: Cache frequently used emotions and assets
- **Progressive Enhancement**: Core functionality first, enhancements layered