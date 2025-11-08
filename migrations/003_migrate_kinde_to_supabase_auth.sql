-- Migration: Kinde to Supabase Authentication
-- Description: Renames kinde_user_id to user_id and updates RLS policies
-- Date: 2024-11-08
-- IMPORTANT: Run this migration BEFORE deploying the code changes

-- ============================================================================
-- STEP 1: Create backup of children table
-- ============================================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS children_backup_20241108 AS 
SELECT * FROM children;

-- Verify backup
-- SELECT COUNT(*) FROM children_backup_20241108;

-- ============================================================================
-- STEP 2: Rename column in children table
-- ============================================================================

-- Rename kinde_user_id to user_id
ALTER TABLE children 
RENAME COLUMN kinde_user_id TO user_id;

-- ============================================================================
-- STEP 3: Update Row Level Security (RLS) Policies
-- ============================================================================

-- Drop existing policies that reference kinde_user_id
DROP POLICY IF EXISTS "Users can view their own children" ON children;
DROP POLICY IF EXISTS "Users can create their own children" ON children;
DROP POLICY IF EXISTS "Users can update their own children" ON children;
DROP POLICY IF EXISTS "Users can delete their own children" ON children;

-- Create new policies with user_id
CREATE POLICY "Users can view their own children" 
ON children 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own children" 
ON children 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own children" 
ON children 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own children" 
ON children 
FOR DELETE 
USING (user_id = auth.uid());

-- ============================================================================
-- STEP 4: Update indexes if any exist
-- ============================================================================

-- Drop old index if exists
DROP INDEX IF EXISTS idx_children_kinde_user_id;

-- Create new index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_children_user_id 
ON children(user_id);

-- ============================================================================
-- STEP 5: Update other tables that might reference kinde_user_id
-- ============================================================================

-- Check if emotion_detective_progress table needs updating
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'emotion_detective_progress' 
    AND column_name = 'kinde_user_id'
  ) THEN
    ALTER TABLE emotion_detective_progress 
    RENAME COLUMN kinde_user_id TO user_id;
  END IF;
END $$;

-- Check if conversation_transcripts table needs updating
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversation_transcripts' 
    AND column_name = 'kinde_user_id'
  ) THEN
    ALTER TABLE conversation_transcripts 
    RENAME COLUMN kinde_user_id TO user_id;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Verify changes
-- ============================================================================

-- List all columns in children table to verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'children'
ORDER BY ordinal_position;

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'children';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (in case of issues)
-- ============================================================================

/*
-- To rollback this migration:

-- 1. Restore column name
ALTER TABLE children 
RENAME COLUMN user_id TO kinde_user_id;

-- 2. Restore old policies
DROP POLICY IF EXISTS "Users can view their own children" ON children;
DROP POLICY IF EXISTS "Users can create their own children" ON children;
DROP POLICY IF EXISTS "Users can update their own children" ON children;
DROP POLICY IF EXISTS "Users can delete their own children" ON children;

CREATE POLICY "Users can view their own children" 
ON children 
FOR SELECT 
USING (kinde_user_id = auth.uid());

CREATE POLICY "Users can create their own children" 
ON children 
FOR INSERT 
WITH CHECK (kinde_user_id = auth.uid());

CREATE POLICY "Users can update their own children" 
ON children 
FOR UPDATE 
USING (kinde_user_id = auth.uid());

CREATE POLICY "Users can delete their own children" 
ON children 
FOR DELETE 
USING (kinde_user_id = auth.uid());

-- 3. Restore index
DROP INDEX IF EXISTS idx_children_user_id;
CREATE INDEX IF NOT EXISTS idx_children_kinde_user_id 
ON children(kinde_user_id);

-- 4. Restore data from backup if needed
-- TRUNCATE children;
-- INSERT INTO children SELECT * FROM children_backup_20241108;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
IMPORTANT: After running this migration:

1. Test the following in a staging environment first:
   - User registration
   - User login
   - Child profile creation
   - Child profile retrieval

2. Verify that auth.uid() in RLS policies returns the correct Supabase user ID

3. Ensure all application code has been updated to use user_id instead of kinde_user_id

4. Monitor logs for any errors related to authentication or database access

5. Keep the backup table (children_backup_20241108) for at least 30 days after 
   successful migration, then drop it:
   DROP TABLE children_backup_20241108;

6. Update your application's environment variables to use Supabase credentials
*/
