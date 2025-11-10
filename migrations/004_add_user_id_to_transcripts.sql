-- Migration: Add user_id column to conversation_transcripts table
-- This allows tracking which user created each transcript

-- Add user_id column (nullable to support existing data)
ALTER TABLE public.conversation_transcripts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id
ON public.conversation_transcripts(user_id);

-- Add RLS policy to allow users to see only their own transcripts
ALTER TABLE public.conversation_transcripts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transcripts" ON public.conversation_transcripts;
DROP POLICY IF EXISTS "Users can insert their own transcripts" ON public.conversation_transcripts;
DROP POLICY IF EXISTS "Users can update their own transcripts" ON public.conversation_transcripts;

-- Users can view their own transcripts
CREATE POLICY "Users can view their own transcripts"
ON public.conversation_transcripts
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own transcripts
CREATE POLICY "Users can insert their own transcripts"
ON public.conversation_transcripts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own transcripts
CREATE POLICY "Users can update their own transcripts"
ON public.conversation_transcripts
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Comment on the new column
COMMENT ON COLUMN public.conversation_transcripts.user_id IS 'References the authenticated user who created this transcript';
