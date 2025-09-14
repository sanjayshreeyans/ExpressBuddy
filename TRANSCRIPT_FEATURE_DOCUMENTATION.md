# ExpressBuddy Transcript Feature Documentation

## Overview

The ExpressBuddy application now automatically saves conversation transcripts when students interact with the AI. This feature captures both user speech (input) and AI speech (output) and stores them in Supabase for later review.

## Features

- **Automatic Transcription**: Uses Gemini Live API's built-in transcription capabilities
- **Dual Capture**: Records both student input and AI output speech
- **Automatic Saving**: Transcripts are automatically saved when the session ends
- **Metadata Collection**: Includes timestamps, confidence scores, and conversation statistics
- **Supabase Storage**: All transcripts are stored securely in Supabase database

## How It Works

### 1. Session Management
- A new transcript session starts automatically when connecting to Gemini Live API
- Each session gets a unique ID: `session_[timestamp]_[random]`
- Session data is tracked throughout the conversation

### 2. Transcription Capture
- **Input Transcriptions**: Captures student speech via `inputAudioTranscription` from Gemini Live API
- **Output Transcriptions**: Captures AI speech via `outputAudioTranscription` from Gemini Live API
- **Real-time Processing**: Transcriptions are captured as they arrive and stored in memory

### 3. Automatic Saving
- **Stop Button**: When student clicks the stop button in the ControlTray, the transcript is automatically saved
- **Disconnect**: If the connection is lost, the transcript is saved before cleanup
- **Component Unmount**: Failsafe saving when the component unmounts unexpectedly

## Database Schema

The transcripts are stored in the `conversation_transcripts` table:

```sql
CREATE TABLE conversation_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  transcript JSONB NOT NULL DEFAULT '[]',
  total_messages INTEGER DEFAULT 0,
  user_message_count INTEGER DEFAULT 0,
  ai_message_count INTEGER DEFAULT 0,
  conversation_duration_seconds INTEGER DEFAULT 0,
  user_agent TEXT,
  device_info JSONB
);
```

## Transcript Message Format

Each message in the transcript array has this structure:

```typescript
interface TranscriptMessage {
  timestamp: number;           // Unix timestamp when message was captured
  speaker: 'user' | 'ai';      // Who spoke
  text: string;                // The transcribed text
  transcriptionType: 'input' | 'output';  // Source type from Gemini API
  confidence?: number;         // Confidence score (if available)
  metadata?: {                 // Optional metadata
    visemeCount?: number;
    audioLength?: number;
    processingTime?: number;
  };
}
```

## Setup Requirements

### 1. Environment Variables

Set up the following environment variables in your `.env` file:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Database Migration

Run the migration to create the necessary table:

```bash
# Apply the migration in your Supabase dashboard or via CLI
psql -f migrations/002_create_conversation_transcripts_table.sql
```

### 3. Row Level Security (RLS)

The migration automatically sets up RLS policies to allow:
- Anyone can insert new transcripts
- Anyone can read transcripts (modify as needed for your security requirements)

## Code Integration Points

### 1. Live API Hook (`use-live-api.ts`)
- **Connection**: Starts transcript session on successful connection
- **Disconnection**: Saves transcript when user stops the session

### 2. Main Interface (`MainInterfaceWithVideoAvatar.tsx`)
- **Message Handling**: Captures transcription data from Gemini Live API responses
- **Real-time Processing**: Adds transcriptions to current session as they arrive

### 3. Transcript Service (`transcript-service.ts`)
- **Session Management**: Handles conversation lifecycle
- **Data Storage**: Manages Supabase interactions
- **Error Handling**: Graceful fallbacks when Supabase is unavailable

## Usage Flow

1. **Student starts session**: Clicks play button in ControlTray
   - Connection established to Gemini Live API
   - Transcript session automatically starts
   - Unique session ID generated

2. **Conversation happens**: Student talks with AI
   - User speech → captured as `inputTranscription`
   - AI response → captured as `outputTranscription`
   - All messages stored in memory with timestamps

3. **Student ends session**: Clicks stop button in ControlTray
   - Connection disconnected from Gemini Live API
   - Transcript automatically saved to Supabase
   - Session data cleared from memory

## Error Handling

- **Supabase Unavailable**: Service continues to work but logs warnings
- **Save Failures**: Fallback saving mechanisms attempt to preserve data
- **Network Issues**: Transcript data is held in memory until connection restored

## Privacy & Security

- Transcripts are stored with timestamps but no personally identifiable information
- RLS policies can be customized for your security requirements
- All data flows through secure HTTPS connections
- Local storage is cleared after successful saves

## Testing

To test the transcript feature:

1. Ensure Supabase credentials are configured
2. Start a conversation with the AI
3. Have a brief conversation (both speaking and listening)
4. Stop the session using the ControlTray stop button
5. Check your Supabase `conversation_transcripts` table for the saved data

## Future Enhancements

- **Export Options**: Add ability to export transcripts as PDF or text files
- **Analytics Dashboard**: Create interface to view conversation patterns
- **Privacy Controls**: Add options for students to opt-out of transcript saving
- **Search Functionality**: Add ability to search through past transcripts
- **Teacher Dashboard**: Interface for teachers to review student conversations
