# Minimal Migration Guide for MainInterface Realtime Streaming

This guide outlines the essential files needed to migrate the MainInterface component with full realtime streaming functionality to a new repository.

## Required Core Files

### 1. Main Application Structure
```
src/
├── App.tsx                           # Main app component (simplified)
├── index.tsx                         # React entry point
├── index.css                         # Base styles
├── types.ts                          # TypeScript type definitions
└── react-app-env.d.ts               # React type declarations
```

### 2. MainInterface Component
```
src/components/main-interface/
├── MainInterface.tsx                 # Main interface component
├── main-interface.scss               # Styling for the interface
└── README.md                         # Documentation (optional)
```

### 3. Core Dependencies (Control Tray)
```
src/components/control-tray/
├── ControlTray.tsx                   # Audio/video controls
└── control-tray.scss                 # Control tray styles
```

### 4. Audio Visual Components
```
src/components/audio-pulse/
├── AudioPulse.tsx                    # Audio visualization
└── audio-pulse.scss                  # Audio pulse styles
```

### 5. Logging System
```
src/components/logger/
├── Logger.tsx                        # Message display component
├── logger.scss                       # Logger styles
└── mock-logs.ts                      # Optional: for testing
```

### 6. Settings Dialog (Optional but Recommended)
```
src/components/settings-dialog/
├── SettingsDialog.tsx                # Settings configuration
├── settings-dialog.scss              # Settings styles
├── VoiceSelector.tsx                 # Voice selection
└── ResponseModalitySelector.tsx      # Response mode selection
```

### 7. Context and State Management
```
src/contexts/
└── LiveAPIContext.tsx                # Main API context provider

src/lib/
├── store-logger.ts                   # Logging state management
├── genai-live-client.ts              # Core API client
├── audio-recorder.ts                 # Audio recording functionality
├── audio-streamer.ts                 # Audio streaming
└── audioworklet-registry.ts          # Audio worklet management
```

### 8. Custom Hooks
```
src/hooks/
├── use-live-api.ts                   # Main API hook
├── use-webcam.ts                     # Webcam functionality
├── use-screen-capture.ts             # Screen sharing
└── use-media-stream-mux.ts           # Media stream management
```

### 9. Audio Processing (Advanced)
```
src/lib/worklets/
├── audio-processing.ts               # Audio processing worklet
└── vol-meter.ts                      # Volume meter worklet
```

## Configuration Files

### Package Dependencies
Add these to your `package.json`:
```json
{
  "dependencies": {
    "@google/genai": "^0.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "classnames": "^2.3.2",
    "zustand": "^4.4.0",
    "react-syntax-highlighter": "^15.5.0",
    "react-select": "^5.7.0",
    "react-icons": "^4.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^4.9.0",
    "sass": "^1.69.0"
  }
}
```

### Environment Variables
Create `.env` file:
```env
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

## Files You Can Remove

### Non-Essential Components
- `src/components/altair/` - Not used in MainInterface
- `src/components/side-panel/` - Replaced by MainInterface chat
- `src/App.scss` - Can be simplified or removed
- `src/setupTests.ts` - Testing setup
- `src/App.test.tsx` - Tests
- `src/reportWebVitals.ts` - Performance monitoring

### Build/Deploy Files (if not needed)
- `.gcloudignore`
- `app.yaml`
- `CONTRIBUTING.md`
- `LICENSE`
- `readme/` folder

## Simplified App.tsx Example

```tsx
import "./index.css";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import MainInterface from "./components/main-interface/MainInterface";
import { LiveClientOptions } from "./types";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function App() {
  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <MainInterface />
      </LiveAPIProvider>
    </div>
  );
}

export default App;
```

## Migration Steps

1. **Create new React project**:
   ```bash
   npx create-react-app my-streaming-app --template typescript
   cd my-streaming-app
   ```

2. **Install dependencies**:
   ```bash
   npm install @google/genai classnames zustand react-syntax-highlighter react-select react-icons
   npm install -D sass @types/react-syntax-highlighter
   ```

3. **Copy essential files** in the order listed above

4. **Add Material Symbols** to `public/index.html`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
   <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
   ```

5. **Configure environment variables**

6. **Test functionality** step by step

## Key Features Included

✅ **Audio/Video Streaming**: Full webcam and screen capture support  
✅ **Real-time Chat**: Text input and AI responses  
✅ **Audio Controls**: Microphone mute/unmute with audio visualization  
✅ **Connection Management**: Connect/disconnect to Gemini Live API  
✅ **Settings**: Voice selection and response modality  
✅ **Logging**: Conversation history and debugging  
✅ **Responsive Design**: Mobile and desktop support  

## Total File Count
- **Essential**: ~25-30 files
- **Optional**: ~10 additional files
- **Removable**: ~15+ files from original repo

This gives you a lean, focused implementation with all the realtime streaming capabilities while removing unnecessary bloat.