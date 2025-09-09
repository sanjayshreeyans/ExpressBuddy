-- Create conversation transcripts table for ExpressBuddy
-- This table stores full conversation transcripts between students and AI

CREATE TABLE IF NOT EXISTS public.conversation_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation metadata
  session_id TEXT NOT NULL, -- Unique session identifier
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  -- Transcript data (JSONB for flexibility)
  transcript JSONB NOT NULL DEFAULT '[]',
  
  -- Summary statistics
  total_messages INTEGER DEFAULT 0,
  user_message_count INTEGER DEFAULT 0,
  ai_message_count INTEGER DEFAULT 0,
  conversation_duration_seconds INTEGER DEFAULT 0,
  
  -- Optional metadata
  user_agent TEXT,
  device_info JSONB,
  
  -- Indexes for performance
  CONSTRAINT conversation_transcripts_session_id_key UNIQUE(session_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_transcripts_created_at ON public.conversation_transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_transcripts_session_id ON public.conversation_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_transcripts_ended_at ON public.conversation_transcripts(ended_at DESC);

-- Add RLS (Row Level Security) policy
ALTER TABLE public.conversation_transcripts ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (you can modify this later to be more restrictive)
CREATE POLICY "Allow public access to conversation transcripts" ON public.conversation_transcripts
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON public.conversation_transcripts TO anon;
GRANT ALL ON public.conversation_transcripts TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.conversation_transcripts IS 'Stores conversation transcripts between students and ExpressBuddy AI with input/output transcriptions from Gemini Live API';
COMMENT ON COLUMN public.conversation_transcripts.transcript IS 'Array of message objects with timestamp, speaker (user/ai), text content, and transcription metadata';
COMMENT ON COLUMN public.conversation_transcripts.session_id IS 'Unique identifier for the conversation session, matches with Gemini Live API session';
