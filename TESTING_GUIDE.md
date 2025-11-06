# 🧪 Testing the Silence Detection System

## Quick Test Steps

1. **Start the Application**
   ```bash
   npm start
   ```

2. **Enable Silence Detection**
   - Click the "Silence Detection" button in the header (it should be gray/disabled initially)
   - This opens the settings panel
   - Toggle "Enable silence detection and nudges" to ON
   - The button should turn blue

3. **Choose a Preset**
   - Click "Responsive" preset for quick testing (7-second threshold)
   - Or manually set threshold to 5 seconds for faster testing

4. **Test Manual Nudge**
   - Click "Send Test Nudge" button
   - You should see:
     - Red notification appear in top-right corner
     - Console log: "🔔 Triggering nudge..."
     - Nudge count badge appear on settings button

5. **Test Real Silence Detection**
   - Connect to Gemini
   - Start a conversation with Pico
   - Wait for Pico to finish speaking
   - Status should show "🔇 Listening... X.Xs"
   - Wait for the threshold time (5-7 seconds)
   - Nudge should automatically trigger

## System Status Indicators

### Button States
- **Gray Button**: Silence detection disabled
- **Blue Button**: Silence detection enabled
- **Badge Number**: Shows total nudges sent this session

### Status Messages
- **🤖 AI Speaking**: Gemini is talking
- **🔇 Listening... X.Xs**: Waiting for user, counting silence
- **👤 User Speaking**: Microphone detected speech
- **⚙️ Processing**: System is processing audio
- **💤 Idle**: Not connected or inactive

### Console Messages
Look for these in the browser console:
- `🎯 Conversation state changed:` - State transitions
- `🎤 Speech detection changed:` - Volume threshold crossings
- `🔔 Triggering nudge:` - When nudges are sent
- `✅ Nudge sent successfully` - Confirmation
- `⚠️ Too soon since last nudge` - Rate limiting

## Troubleshooting

### No Infinite Loops
- System is now stable and won't cause freezing
- Silence detection is **disabled by default**
- Only runs when explicitly enabled

### If Nudges Don't Work
1. Check if system is enabled (blue button)
2. Verify Gemini connection is active
3. Ensure you're in "listening" state
4. Check console for error messages
5. Try manual nudge first

### If Too Many Nudges
1. Increase silence threshold (10+ seconds)
2. Increase minimum time between nudges (60+ seconds)
3. Adjust speech volume threshold if background noise

### If Speech Not Detected
1. Check microphone permissions
2. Lower speech volume threshold (2-3%)
3. Verify AudioPulse visualizer is working
4. Speak louder or closer to microphone

## Analytics & Insights

The Analytics tab shows:
- **Total Nudges**: How many sent this session
- **Success Rate**: Percentage that got user responses
- **Average Silence**: Typical quiet periods
- **Recommendations**: Smart suggestions for tuning

## Current Limitations

1. **Manual State Management**: You need to manually enable the system and choose conversation states for now
2. **No Auto-State Detection**: The system doesn't automatically detect when AI is speaking (to prevent infinite loops)
3. **Voice Mode Only**: Nudges work best in voice conversation mode
4. **English Only**: Nudge messages are currently in English

## Safe Mode Operation

The system now operates in "safe mode" to prevent performance issues:
- ✅ No infinite re-rendering loops
- ✅ Disabled by default
- ✅ Only runs when explicitly enabled
- ✅ Minimal performance impact
- ✅ Easy to disable if needed

You can safely use the app normally, and only enable silence detection when you want to test it!
