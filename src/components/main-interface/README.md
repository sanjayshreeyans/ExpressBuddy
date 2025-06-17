# MainInterface Component

This is the main interface component that combines all the key features of the live API web console into a single, cohesive layout. 

## Features

### Layout
- **Video Section (Left)**: Displays the user's video feed from webcam or screen capture
- **AI Responses Section (Right)**: Shows real-time conversation with the AI model
- **Control Tray (Bottom)**: Provides audio/video controls and connection management

### Components Used
- `ControlTray`: Handles audio/video input controls, connection management, and settings
- `Logger`: Displays AI conversation history with proper formatting
- Video element with placeholder when no feed is active

### Usage

```tsx
import MainInterface from "./components/main-interface/MainInterface";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";

function App() {
  const apiOptions = {
    apiKey: "your-api-key"
  };

  return (
    <LiveAPIProvider options={apiOptions}>
      <MainInterface />
    </LiveAPIProvider>
  );
}
```

### Responsive Design
- Desktop: Side-by-side layout with video on left, chat on right
- Tablet/Mobile: Stacked layout with video on top, chat below

### Styling
The component uses the existing design system with:
- CSS custom properties for consistent theming
- Material Design icons
- Responsive breakpoints for mobile optimization