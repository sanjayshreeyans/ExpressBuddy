# Transcript Debug Test Procedure

## Test Steps for Debugging Transcript Saving

### 1. Check Environment Setup

Before testing, verify in your browser console:
```javascript
// Check if Supabase environment variables are loaded
console.log('SUPABASE_URL:', !!process.env.REACT_APP_SUPABASE_URL);
console.log('SUPABASE_KEY:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
```

### 2. Test Conversation Flow

1. **Start Session**: Click the play button in ControlTray
   - Look for: `📝 Started transcript collection for session: session_[timestamp]_[random]`

2. **Have a Conversation**: 
   - Speak to the AI and wait for response
   - Look for these logs:
     - `🔍 DEBUG: Server content received:` - Shows what data is coming from Gemini
     - `🎤 INPUT transcription detected:` - User speech transcription
     - `🔊 OUTPUT transcription detected:` - AI speech transcription
     - `📝 ✅ User transcription added` - Successful capture
     - `📝 🤖 AI transcription added` - Successful capture

3. **End Session**: Click the pause/stop button in ControlTray
   - Look for: `📝 Goodbye! Saving your conversation transcript...`
   - Look for: `📋 Current transcript status:` with message counts
   - Look for: `✅ 👋 Goodbye! Your conversation transcript has been saved successfully!`

### 3. Expected Debug Output

**On Session Start:**
```
📝 Started transcript collection for session: session_1694270580123_abc123def
🔧 Setting Gemini Live API config with transcription enabled: {hasInputTranscription: true, hasOutputTranscription: true, ...}
```

**During Conversation:**
```
🔍 DEBUG: Server content received: {hasInputTranscription: true, hasOutputTranscription: false, ...}
🎤 INPUT transcription detected: {text: "Hello there", finished: true, confidence: 0.95}
📝 ✅ Processing user transcription: {text: "Hello there", finished: true}
📝 ✅ User transcription added (1 total messages): {text: "Hello there", timestamp: "12:43:15", ...}
```

**On Session End:**
```
📝 Goodbye! Saving your conversation transcript...
📋 Current transcript status: {hasSession: true, messageCount: 4, userMessages: 2, aiMessages: 2, ...}
🏁 Starting endConversationAndSave process...
📊 Session info: {sessionId: "session_...", messageCount: 4, ...}
💾 Attempting to save transcript to Supabase...
🔧 Supabase connection check: {hasUrl: true, hasKey: true, ...}
📤 Sending data to Supabase: {sessionId: "...", messageCount: 4, ...}
✅ 🎉 Transcript saved successfully to Supabase!: {recordId: "...", sessionId: "...", ...}
```

### 4. Common Issues to Check

**Issue 1: No Transcription Data**
If you see:
- `🔍 DEBUG: Server content received: {hasInputTranscription: false, hasOutputTranscription: false}`
- The Gemini API might not be sending transcription data
- Check that your Gemini API key has transcription permissions

**Issue 2: Supabase Connection Error**
If you see:
- `🔧 Supabase connection check: {hasUrl: false, hasKey: false}`
- Check your `.env` file has the correct Supabase credentials

**Issue 3: RLS Policy Error**
If you see:
- `❌ Supabase error saving transcript: {code: '42501', message: '...'}`
- `🔒 This looks like a Row Level Security (RLS) policy error!`
- Check your Supabase RLS policies for the `conversation_transcripts` table

**Issue 4: Empty Transcript**
If you see:
- `⚠️ TranscriptService: No transcript messages to save`
- Transcription data is not being captured properly
- Check if the server is actually sending transcription events

### 5. Manual Transcript Check

You can manually check the transcript service status:
```javascript
// In browser console during a conversation
TranscriptService.getSessionStatus()
```

This should return:
```javascript
{
  hasSession: true,
  sessionId: "session_...",
  messageCount: 2,
  userMessages: 1,
  aiMessages: 1,
  messages: [...]
}
```

### 6. Supabase Database Check

After a successful save, check your Supabase database:
```sql
SELECT * FROM conversation_transcripts ORDER BY created_at DESC LIMIT 5;
```

You should see new records with:
- `session_id`: Unique session identifier
- `transcript`: JSONB array with message objects
- `total_messages`, `user_message_count`, `ai_message_count`: Statistics
- `created_at`, `ended_at`: Timestamps

### 7. Emergency Debugging

If nothing is working, you can manually test the transcript service:
```javascript
// In browser console
TranscriptService.startConversation('test_session_123');
TranscriptService.addUserTranscription('Hello world', {});
TranscriptService.addAITranscription('Hi there!', {});
TranscriptService.endConversationAndSave();
```

This should show you exactly where the problem is occurring.
