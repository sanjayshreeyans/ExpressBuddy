# Silence Detection and Nudge System Documentation

## Overview

The ExpressBuddy Silence Detection and Nudge System is designed to help maintain engagement with children by detecting when they become silent or distracted and sending gentle nudges to Gemini to regain their attention.

## How It Works

### 1. Turn Detection Events

The system leverages Gemini's built-in Voice Activity Detection (VAD) events:

- **`turncomplete`** - AI finished speaking naturally → transition to "listening for user" state
- **`interrupted`** - User started speaking while AI was talking → immediately stop AI playback and reset silence timer

### 2. Conversation States

The system tracks the following conversation states:

- **`idle`** - Not connected or no active conversation
- **`ai-speaking`** - Gemini is currently speaking/playing audio
- **`listening-for-user`** - AI has finished speaking, waiting for user response
- **`user-speaking`** - User is actively speaking (detected via microphone volume)
- **`processing`** - System is processing audio or buffering

### 3. Speech Detection

Real speech is detected using the same volume monitoring as the microphone visualizer:

- Volume threshold is configurable (default: 5% of max volume)
- Rolling average of recent volume samples prevents false positives from background noise
- Speech detection automatically resets the silence timer

### 4. Nudge System

When silence is detected in the "listening for user" state:

- Timer starts counting silence duration
- If silence exceeds threshold (default: 10 seconds), a nudge is triggered
- Nudge message is sent to Gemini via text input
- Visual indicator shows the nudge was sent
- Minimum time between nudges prevents spam (default: 30 seconds)

## Key Features

### ✅ Configurable Settings
- Silence threshold (3-30 seconds)
- Speech volume threshold (1-20%)
- Custom nudge messages
- Minimum time between nudges
- Enable/disable the entire system

### ✅ Preset Configurations
- **Gentle**: 15s threshold, very patient approach
- **Standard**: 10s threshold, balanced for most situations  
- **Responsive**: 7s threshold, quick responses

### ✅ Real-time Status Display
- Shows current conversation state
- Live silence duration counter
- Warning when nudge is approaching
- Nudge count indicator

### ✅ Visual Nudge Indicator
- Animated notification when nudge is sent
- Auto-hides after 3 seconds
- Accessible design with proper contrast

### ✅ Analytics & Insights
- Total nudges sent
- Average silence duration
- Success rate (nudges that resulted in user response)
- Longest silence period
- Session statistics
- Smart recommendations

## Implementation Details

### File Structure
```
src/
├── hooks/
│   └── use-silence-detection.ts       # Core silence detection logic
├── components/
│   ├── nudge-indicator/
│   │   ├── NudgeIndicator.tsx         # Visual nudge notification
│   │   └── nudge-indicator.scss       # Nudge indicator styles
│   ├── silence-settings/
│   │   ├── SilenceDetectionSettings.tsx # Settings panel
│   │   └── silence-settings.scss      # Settings panel styles
│   └── main-interface/
│       └── MainInterfaceWithAvatar.tsx # Main UI integration
```

### Integration Points

1. **`use-live-api.ts`**: Integrates silence detection with Gemini turn events
2. **`MainInterfaceWithAvatar.tsx`**: Displays status and settings UI
3. **`ControlTray.tsx`**: Volume monitoring integration
4. **`LiveAPIContext.tsx`**: Provides silence detection to all components

## Usage

### For Developers

1. **Import the hook**:
```typescript
import { useSilenceDetection } from './hooks/use-silence-detection';
```

2. **Initialize with callbacks**:
```typescript
const silenceDetection = useSilenceDetection({
  onNudgeTriggered: (message) => sendToGemini(message),
  onShowNudgeIndicator: (show) => setIndicatorVisible(show),
  onAnalyticsEvent: (event, data) => logEvent(event, data),
});
```

3. **Update conversation state**:
```typescript
// When AI finishes speaking
silenceDetection.setConversationState('listening-for-user');

// When user starts speaking
silenceDetection.setConversationState('user-speaking');
```

4. **Update volume for speech detection**:
```typescript
silenceDetection.updateVolume(currentVolume);
```

### For Users

1. **Access Settings**: Click the "Silence Detection" button in the header
2. **Choose Preset**: Select Gentle, Standard, or Responsive based on needs
3. **Customize**: Adjust thresholds and nudge messages in Advanced Settings
4. **Monitor**: View real-time status and analytics
5. **Test**: Use the "Send Test Nudge" button to verify functionality

## Configuration Options

### Silence Detection Config
```typescript
interface SilenceDetectionConfig {
  silenceThresholdSeconds: number;     // 3-30 seconds
  speechVolumeThreshold: number;       // 0.01-0.2 (1-20%)
  nudgeMessage: string;                // Custom message to Gemini
  enabled: boolean;                    // Enable/disable system
  minTimeBetweenNudges: number;        // 10-120 seconds
}
```

### Default Nudge Message
```
"The student seems quiet. Please try a new story or ask a different question to regain their attention."
```

## Analytics Tracking

The system tracks:
- **Total nudges sent** in the session
- **Average silence duration** across all silence periods
- **Success rate** (percentage of nudges that resulted in user response within 60 seconds)
- **Longest silence period** recorded
- **Total silence time** accumulated
- **Session duration** for context

## Best Practices

### For Children with Different Needs

1. **Autism/Social Anxiety**: Use "Gentle" preset with longer thresholds
2. **Speech Delays**: Use "Standard" preset, customize nudge messages to be encouraging
3. **ADHD/Attention Issues**: Use "Responsive" preset with shorter thresholds
4. **ESL Students**: Customize nudge messages to be simpler and more supportive

### Nudge Message Guidelines

- Use encouraging, not demanding language
- Offer alternatives or choices
- Be patient and understanding
- Avoid making the child feel rushed
- Examples:
  - "Take your time! I'm here to listen."
  - "Want to try talking about something different?"
  - "It's okay if you need a moment to think."

### Volume Threshold Tuning

- **Too Low (1-2%)**: May trigger on background noise
- **Just Right (3-8%)**: Detects clear speech, ignores noise
- **Too High (10%+)**: May miss quiet or hesitant speech

## Troubleshooting

### Common Issues

1. **Nudges not triggering**:
   - Check if system is enabled
   - Verify silence threshold isn't too high
   - Ensure conversation state is "listening-for-user"

2. **False positive speech detection**:
   - Increase speech volume threshold
   - Check for background noise
   - Verify microphone is working properly

3. **Too many nudges**:
   - Increase minimum time between nudges
   - Increase silence threshold
   - Check if volume threshold is too high

4. **Nudges not working in voice mode**:
   - Verify Gemini connection is active
   - Check console for sendNudgeToGemini errors
   - Ensure text input is supported by Gemini Live API

### Debug Information

The system provides extensive logging:
- All events are logged to browser console
- Volume updates and speech detection
- Conversation state changes
- Nudge triggers and responses
- Analytics calculations

Look for logs prefixed with:
- `🎯` Turn detection events
- `🔔` Nudge triggers
- `🎤` Speech detection
- `📊` Analytics events
- `⏰` Timer events

## Future Enhancements

Potential improvements could include:
- Machine learning-based speech/silence detection
- Integration with emotion recognition from camera
- Adaptive thresholds based on user behavior patterns
- Multi-language nudge message presets
- Integration with educational content difficulty levels
- Parent/teacher dashboard for session analytics
