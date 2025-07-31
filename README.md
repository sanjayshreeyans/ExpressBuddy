# ExpressBuddy - AI-Powered Communication Tool

ExpressBuddy is an innovative AI-powered communication tool designed to help children with autism and speech challenges engage in natural conversations through multimodal interactions. Built with Google's Gemini Live API, ExpressBuddy features real-time voice conversations, emotion detection learning games, interactive avatars with lip-sync capabilities, and intelligent silence detection to maintain engagement. 

## Features Overview

### 🗣️ Real-Time Voice Chat with AI Avatar (The panda avatar or any other assets don't belong to us and are part of mascotbot so we can't use it)
- **Live Conversations**: Natural voice conversations powered by Google Gemini Live API
- **Animated Avatar**: Rive-based avatar with real-time lip-sync using ParakeetTDTV2-ASR backend
- **Memory System**: Persistent child profiles that remember preferences and progress across sessions
- **Silence Detection**: Intelligent monitoring with gentle nudges to maintain conversation flow

### 🎭 Emotion Detective Learning Game
- **4 Question Types**: Comprehensive emotion learning with varied interaction modes
- **Camera-Based Emotion Mirroring**: Real-time facial expression analysis using face-api.js
- **Progress Tracking**: Supabase-powered analytics to monitor learning progress
- **Interactive Learning**: Engaging activities that help children recognize and express emotions

### 🤖 Avatar Integration
- **Lip-Sync Technology**: Real-time viseme generation for natural speech animation
- **ParakeetTDTV2-ASR Backend**: FastAPI-powered audio processing for accurate mouth movements
- **Multiple Avatar Options**: Various character designs to match child preferences
- **Subtitle Support**: Text synchronization for enhanced comprehension

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key
- Supabase account (for progress tracking)
- ParakeetTDTV2-ASR backend (for lip-sync functionality)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/expresbuddy.git
cd expresbuddy
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Google Gemini API
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kinde Authentication
REACT_APP_KINDE_DOMAIN=your_kinde_domain
REACT_APP_KINDE_CLIENT_ID=your_kinde_client_id
REACT_APP_KINDE_REDIRECT_URI=http://localhost:3000
REACT_APP_KINDE_LOGOUT_URI=http://localhost:3000

# ParakeetTDTV2-ASR Backend
REACT_APP_PARAKEET_ASR_URL=ws://localhost:8000/stream-audio
```



1. **Launch ExpressBuddy**

```bash
npm start
```

The application will open at `http://localhost:3000`

## Application Routes

### Main Interface Routes

- **`/`** - Landing page with authentication
- **`/chat`** - Main conversation interface with avatar
- **`/emotion-detective`** - Emotion learning game hub
- **`/profile`** - User profile and progress tracking

### Emotion Detective Game Routes

- **`/emotion-detective/question-type-1`** - Basic emotion identification
- **`/emotion-detective/question-type-2`** - Emotion expression matching
- **`/emotion-detective/question-type-3`** - Scenario-based emotion recognition
- **`/emotion-detective/question-type-4`** - Advanced emotion mirroring with camera
- **`/emotion-detective/emotion-mirroring`** - Real-time facial expression practice

### Development Routes

- **`/demo-tts`** - TTS functionality demonstration
- **`/test-tts`** - TTS integration testing
- **`/test-visemes`** - Viseme generation testing

## Core Features Deep Dive

### Memory System

ExpressBuddy implements a sophisticated memory system that creates persistent child profiles:

```typescript
// Memory system automatically stores:
// - Child's name and preferences
// - Conversation history highlights
// - Emotion learning progress
// - Favorite topics and interests

// Usage in components:
const { memory, updateMemory } = useMemory();
const childProfile = memory.getChildProfile();
```

**Key Features:**
- Persistent storage using localStorage
- Automatic context building for conversations
- Progress tracking across sessions
- Personalized interaction patterns

### Silence Detection System

The silence detection system monitors conversation flow and provides gentle engagement nudges:

```typescript
// Configure silence detection
const silenceConfig = {
  enabled: true,
  silenceThreshold: 3000, // 3 seconds
  nudgeMessages: [
    "I'm here when you're ready to chat!",
    "Take your time, I'm listening.",
    "What's on your mind?"
  ]
};
```

**Features:**
- Configurable silence thresholds
- Multiple nudge message types
- Analytics for engagement patterns
- Visual indicators for conversation state

### Emotion Detective Learning Game

A comprehensive emotion learning system with four distinct question types:

#### Question Type 1: Basic Emotion Identification
- Visual emotion cards with multiple choice
- Audio pronunciation of emotion names
- Progress tracking and scoring

#### Question Type 2: Expression Matching
- Match facial expressions to emotion words
- Interactive drag-and-drop interface
- Immediate feedback and explanations

#### Question Type 3: Scenario-Based Recognition
- Real-world situation analysis
- Context-based emotion understanding
- Story-driven learning experiences

#### Question Type 4: Camera-Based Emotion Mirroring
- Real-time facial expression detection using face-api.js
- Live feedback on emotion expression accuracy
- Practice mode for emotion expression

```typescript
// Emotion detection integration
import { EmotionDetector } from '../utils/emotionDetection';

const detector = new EmotionDetector();
detector.startDetection(videoElement, {
  onEmotionDetected: (emotions) => {
    // Handle detected emotions
    updateEmotionFeedback(emotions);
  }
});
```

### Avatar Integration with Lip-Sync

ExpressBuddy features advanced avatar integration with real-time lip-sync capabilities:

#### ParakeetTDTV2-ASR Backend Integration

The lip-sync system uses a FastAPI backend for audio-to-viseme conversion:

```typescript
// Viseme service integration
class VisemeTranscriptionService {
  private websocket: WebSocket;
  
  async sendAudioChunk(audioData: Uint8Array): Promise<void> {
    // Send audio to ParakeetTDTV2-ASR backend
    this.websocket.send(audioData);
  }
  
  onVisemeReceived(callback: (visemes: VisemeData[]) => void): void {
    // Handle real-time viseme data
    this.websocket.onmessage = (event) => {
      const visemes = JSON.parse(event.data);
      callback(visemes);
    };
  }
}
```

#### Rive Avatar System

The avatar system uses Rive animations with real-time viseme control:

```typescript
// Avatar component with lip-sync
const RealtimeExpressBuddyAvatar = () => {
  const { currentVisemes, currentSubtitles } = useLiveAPIContext();
  
  useEffect(() => {
    // Update avatar mouth movements based on visemes
    if (riveInstance && currentVisemes.length > 0) {
      visemeController.playVisemes(currentVisemes);
    }
  }, [currentVisemes]);
  
  return (
    <RiveCanvas 
      src="/avatars/realistic_female_v1_3.riv"
      onLoad={handleRiveLoad}
    />
  );
};
```

### Google Gemini Live API Integration

ExpressBuddy leverages Google's Gemini Live API for natural conversation:

```typescript
// Live API configuration for ExpressBuddy
const liveAPIConfig = {
  model: "models/gemini-2.0-flash-exp",
  systemInstruction: {
    parts: [{
      text: `You are ExpressBuddy, a helpful AI companion designed to support children with autism and speech challenges. Be patient, encouraging, and adapt your communication style to each child's needs.`
    }]
  },
  generationConfig: {
    responseModalities: ["AUDIO", "TEXT"],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
    }
  }
};
```

## Architecture & Development

ExpressBuddy is built with a modern React/TypeScript stack, integrating multiple AI and multimedia technologies:

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Vite for build tooling

**AI & ML Services:**
- Google Gemini Live API (multimodal conversations)
- face-api.js (emotion detection)
- ParakeetTDTV2-ASR (audio-to-viseme conversion)

**Backend Services:**
- Supabase (database, authentication, real-time subscriptions)
- Kinde (authentication provider)
- FastAPI backend for lip-sync processing

**Animation & Media:**
- Rive (avatar animations)
- WebRTC (camera/microphone access)
- Web Audio API (audio processing)

### Project Structure

```
src/
├── components/
│   ├── avatar/                 # Avatar and lip-sync components
│   ├── emotion-detective/      # Learning game components
│   ├── ui/                     # shadcn/ui components
│   └── layout/                 # Layout and navigation
├── contexts/                   # React contexts (LiveAPI, Memory)
├── hooks/                      # Custom hooks (useLiveAPI, useSilenceDetection)
├── lib/                        # Utility libraries
├── services/                   # API services and data access
├── types/                      # TypeScript type definitions
└── utils/                      # Helper functions
```

### Key Components

#### LiveAPIProvider Context
Central state management for Gemini Live API integration:

```typescript
// Provides real-time conversation state
const LiveAPIProvider = ({ children }) => {
  const liveAPI = useLiveAPI(options);
  return (
    <LiveAPIContext.Provider value={liveAPI}>
      {children}
    </LiveAPIContext.Provider>
  );
};
```

#### Memory System Hooks
Persistent storage and child profile management:

```typescript
const useMemory = () => {
  const [memory, setMemory] = useState(loadFromStorage());
  
  const updateMemory = (updates) => {
    const newMemory = { ...memory, ...updates };
    setMemory(newMemory);
    saveToStorage(newMemory);
  };
  
  return { memory, updateMemory };
};
```

#### Silence Detection Hook
Engagement monitoring and conversation flow management:

```typescript
const useSilenceDetection = (config) => {
  const [state, setState] = useState('listening');
  const [analytics, setAnalytics] = useState({});
  
  // Monitors volume and triggers nudges when appropriate
  return { state, config, updateConfig, triggerNudge, analytics };
};
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

_This is an experiment showcasing the Live API, not an official Google product. We’ll do our best to support and maintain this experiment but your mileage may vary. We encourage open sourcing projects as a way of learning from each other. Please respect our and other creators' rights, including copyright and trademark rights when present, when sharing these works and creating derivative work. If you want more info on Google's policy, you can find that [here](https://developers.google.com/terms/site-policies)._
