-- Migration: Create emotion detective tables
-- Created: 2025-01-16
-- Description: Creates tables for emotion detective learning feature

-- Create emotion_detective_progress table for child progress tracking
CREATE TABLE emotion_detective_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  unlocked_emotions TEXT[] DEFAULT ARRAY['happy', 'sad', 'angry', 'neutral'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id)
);

-- Create emotion_detective_sessions table for session management
CREATE TABLE emotion_detective_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
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

-- Create emotion_attempts table for individual question attempts
CREATE TABLE emotion_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES emotion_detective_sessions(id) ON DELETE CASCADE,
  emotion_name TEXT NOT NULL,
  identification_attempts INTEGER DEFAULT 0,
  identification_correct BOOLEAN DEFAULT FALSE,
  mirroring_attempts INTEGER DEFAULT 0,
  mirroring_score INTEGER, -- 0-100 from face-api.js
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_emotion_detective_progress_child_id ON emotion_detective_progress(child_id);
CREATE INDEX idx_emotion_detective_sessions_child_id ON emotion_detective_sessions(child_id);
CREATE INDEX idx_emotion_detective_sessions_created_at ON emotion_detective_sessions(created_at);
CREATE INDEX idx_emotion_attempts_session_id ON emotion_attempts(session_id);
CREATE INDEX idx_emotion_attempts_emotion_name ON emotion_attempts(emotion_name);

-- Add RLS (Row Level Security) policies
ALTER TABLE emotion_detective_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_detective_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for emotion_detective_progress
CREATE POLICY "Users can view their own child's emotion detective progress" ON emotion_detective_progress
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own child's emotion detective progress" ON emotion_detective_progress
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own child's emotion detective progress" ON emotion_detective_progress
  FOR UPDATE USING (
    child_id IN (
      SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS policies for emotion_detective_sessions
CREATE POLICY "Users can view their own child's emotion detective sessions" ON emotion_detective_sessions
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own child's emotion detective sessions" ON emotion_detective_sessions
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own child's emotion detective sessions" ON emotion_detective_sessions
  FOR UPDATE USING (
    child_id IN (
      SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS policies for emotion_attempts
CREATE POLICY "Users can view their own child's emotion attempts" ON emotion_attempts
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM emotion_detective_sessions 
      WHERE child_id IN (
        SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can insert their own child's emotion attempts" ON emotion_attempts
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM emotion_detective_sessions 
      WHERE child_id IN (
        SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can update their own child's emotion attempts" ON emotion_attempts
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM emotion_detective_sessions 
      WHERE child_id IN (
        SELECT id FROM children WHERE kinde_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emotion_detective_progress_updated_at 
  BEFORE UPDATE ON emotion_detective_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();