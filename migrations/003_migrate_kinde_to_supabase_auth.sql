-- Migration: Kinde to Supabase Authentication
-- Description: Migrates from Kinde's text-based user_id to Supabase's UUID user_id with proper RLS
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
-- STEP 2: Add new UUID user_id column to children table
-- ============================================================================

-- Add new user_id column as UUID (nullable initially)
ALTER TABLE children 
ADD COLUMN user_id UUID;

-- Add comment for clarity
COMMENT ON COLUMN children.user_id IS 'Supabase Auth user ID - references auth.users(id)';

-- ============================================================================
-- STEP 3: Create index on user_id for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_children_user_id 
ON children(user_id);

-- ============================================================================
-- STEP 4: Enable RLS on children table
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS Policies with proper UUID comparison
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own children" ON children;
DROP POLICY IF EXISTS "Users can create their own children" ON children;
DROP POLICY IF EXISTS "Users can update their own children" ON children;
DROP POLICY IF EXISTS "Users can delete their own children" ON children;

-- Policy: Users can view their own child profiles
CREATE POLICY "Users can view their own children" 
ON children 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create child profiles
CREATE POLICY "Users can create their own children" 
ON children 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own child profiles
CREATE POLICY "Users can update their own children" 
ON children 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own child profiles
CREATE POLICY "Users can delete their own children" 
ON children 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- STEP 6: Verify RLS is active and policies are created
-- ============================================================================

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'children';

-- ============================================================================
-- STEP 7: Verify all policies were created correctly
-- ============================================================================

-- List all RLS policies for children table
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'children'
ORDER BY policyname;

-- Verify column exists and is UUID type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'children'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 8: Important Next Steps (Manual)
-- ============================================================================

/*
MANUAL STEPS REQUIRED AFTER MIGRATION:

1. DATA MIGRATION (Run in your application or through Supabase):
   - For each existing child record with kinde_user_id:
   - Look up the corresponding Supabase user ID
   - UPDATE children SET user_id = <supabase_user_id> WHERE kinde_user_id = <kinde_id>

2. CODE UPDATES REQUIRED:
   - Update src/contexts/UserContext.tsx to use user_id instead of kinde_user_id
   - Update src/services/supabaseService.ts to reference user_id
   - Update all components to import from SupabaseAuthContext instead of Kinde
   - Remove @kinde-oss/kinde-auth-react dependency

3. TESTING:
   - Test user registration with Supabase Auth
   - Verify child profile is created with correct user_id
   - Test RLS policies allow users to see only their own data
   - Verify session persistence across page refreshes

4. CLEANUP (After successful testing and migration):
   - Run: ALTER TABLE children DROP COLUMN kinde_user_id;
   - Drop backup table: DROP TABLE children_backup_20241108;

5. PRODUCTION DEPLOYMENT:
   - Run this migration in production
   - Deploy updated application code
   - Monitor error logs for any RLS policy violations
   - Keep backup table for 30 days before cleanup
*/

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (If needed)
-- ============================================================================

/*
-- To rollback this migration:

-- 1. Drop all new policies
DROP POLICY IF EXISTS "Users can view their own children" ON children;
DROP POLICY IF EXISTS "Users can create their own children" ON children;
DROP POLICY IF EXISTS "Users can update their own children" ON children;
DROP POLICY IF EXISTS "Users can delete their own children" ON children;

-- 2. Disable RLS
ALTER TABLE children DISABLE ROW LEVEL SECURITY;

-- 3. Drop new column and index
DROP INDEX IF EXISTS idx_children_user_id;
ALTER TABLE children DROP COLUMN IF EXISTS user_id;

-- 4. Restore data from backup if corruption occurred
-- TRUNCATE children;
-- INSERT INTO children SELECT * FROM children_backup_20241108;
*/
