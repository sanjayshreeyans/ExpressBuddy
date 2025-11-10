# Supabase Authentication Migration Guide

This guide provides step-by-step instructions for completing the migration from Kinde to Supabase authentication in the ExpressBuddy application.

## Overview

The ExpressBuddy application has been migrated from Kinde authentication to Supabase authentication. This migration provides:

- **Better Integration**: Native integration with Supabase database
- **Cost Efficiency**: Consolidated authentication and database in one service
- **Enhanced Features**: Built-in email templates, user management, and Row Level Security (RLS)
- **Simplified Architecture**: Fewer external dependencies

## What Changed

### Code Changes ✅ (Completed)

1. **New Authentication Context**
   - Created `src/contexts/SupabaseAuthContext.tsx` for authentication management
   - Provides `signIn`, `signUp`, `signOut`, and `resetPassword` methods
   - Maintains session state and user information

2. **Updated Components**
   - `App.tsx`: Replaced `KindeProvider` with `SupabaseAuthProvider`
   - `AuthPage.tsx`: Now uses Supabase Auth UI component
   - `ProtectedRoute.tsx`: Uses Supabase authentication state
   - All landing/home pages: Updated to use `useSupabaseAuth()` hook

3. **Database Service Updates**
   - `supabaseService.ts`: Added `getChildByUserId()` method
   - Child interface updated: `kinde_user_id` → `user_id`
   - Legacy method `getChildByKindeUserId()` maintained for backwards compatibility

4. **Dependencies**
   - Removed: `@kinde-oss/kinde-auth-react`
   - Added: `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`

### Database Changes 🔴 (Required Before Deployment)

**CRITICAL**: These database changes must be completed before deploying the new code.

#### Step 1: Backup Your Database

```sql
-- Create a backup of the children table
CREATE TABLE children_backup AS TABLE children;
```

#### Step 2: Rename the Column

```sql
-- Rename the column from kinde_user_id to user_id
ALTER TABLE children 
RENAME COLUMN kinde_user_id TO user_id;
```

#### Step 3: Update Row Level Security (RLS) Policies

If you have RLS policies on the `children` table, update them to use the new column name:

```sql
-- Example: Drop old policy
DROP POLICY IF EXISTS "Users can view their own children" ON children;

-- Create new policy with updated column
CREATE POLICY "Users can view their own children" 
ON children 
FOR SELECT 
USING (user_id = auth.uid());

-- Update other policies as needed
-- INSERT policy
CREATE POLICY "Users can create their own children" 
ON children 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- UPDATE policy
CREATE POLICY "Users can update their own children" 
ON children 
FOR UPDATE 
USING (user_id = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete their own children" 
ON children 
FOR DELETE 
USING (user_id = auth.uid());
```

#### Step 4: Verify Other Tables

Check if any other tables reference `kinde_user_id` and update them:

```sql
-- Find all tables with kinde_user_id column
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%kinde_user_id%';
```

Update any found tables similarly.

### Supabase Configuration 🔧 (Required)

#### Step 1: Enable Email Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure email settings:
   - Enable email confirmations (recommended for production)
   - Set up SMTP if using custom email provider

#### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

#### Step 3: Set Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: 
     - `http://localhost:3000/**` (for local development)
     - `https://your-domain.com/**` (for production)

#### Step 4: Configure Session Settings (Optional)

1. Go to **Authentication** → **Settings**
2. Adjust session settings as needed:
   - Session timeout
   - Refresh token rotation
   - JWT expiry

### Environment Variables 🌍

Update your `.env` file with Supabase credentials:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini API Key (unchanged)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **URL** and **anon/public** key

## Migration Steps for Production

### Pre-Deployment Checklist

- [ ] Backup database (especially `children` table)
- [ ] Test database column rename in staging environment
- [ ] Update RLS policies to use `user_id`
- [ ] Configure Supabase Email authentication
- [ ] Set up email templates
- [ ] Configure redirect URLs
- [ ] Update environment variables in hosting platform
- [ ] Test authentication flow in staging

### Deployment Steps

1. **Deploy Database Changes First**
   ```sql
   -- In Supabase SQL Editor
   ALTER TABLE children RENAME COLUMN kinde_user_id TO user_id;
   -- Update RLS policies
   ```

2. **Update Environment Variables**
   - Update in Netlify/Vercel/your hosting platform
   - Ensure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set

3. **Deploy Application Code**
   - Merge this PR
   - Deploy to production

4. **Verify Authentication Works**
   - Test sign up
   - Test sign in
   - Test password reset
   - Test protected routes

### Post-Deployment

1. **Monitor for Issues**
   - Check application logs
   - Monitor Supabase dashboard for auth errors
   - Watch for user reports

2. **Update Documentation**
   - Update README with new authentication setup
   - Update developer onboarding docs

## Testing Locally

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` File**
   ```bash
   cp .env.example .env
   ```

3. **Add Supabase Credentials**
   - Get credentials from Supabase dashboard
   - Update `.env` file

4. **Update Local Database**
   ```sql
   -- If using local Supabase
   ALTER TABLE children RENAME COLUMN kinde_user_id TO user_id;
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```

### Test Cases

- [ ] **Sign Up Flow**
  - Navigate to `/login`
  - Create new account
  - Verify email confirmation (if enabled)
  - Check that user is redirected to onboarding

- [ ] **Sign In Flow**
  - Sign in with existing credentials
  - Verify redirect to dashboard
  - Check that user data loads correctly

- [ ] **Protected Routes**
  - Try accessing `/dashboard` without auth (should redirect to login)
  - Sign in and verify access granted

- [ ] **Sign Out**
  - Click logout button
  - Verify user is signed out
  - Verify redirect to home page

- [ ] **Password Reset**
  - Click "Forgot Password"
  - Enter email
  - Check email for reset link
  - Complete password reset flow

## Troubleshooting

### Common Issues

**Issue**: "Invalid API Key" error
- **Solution**: Verify `REACT_APP_SUPABASE_ANON_KEY` is set correctly in `.env`

**Issue**: Users can't sign in
- **Solution**: Check that Email provider is enabled in Supabase dashboard

**Issue**: Database errors about `kinde_user_id`
- **Solution**: Ensure column has been renamed to `user_id` in database

**Issue**: Email confirmations not working
- **Solution**: Configure SMTP settings in Supabase or disable email confirmation for development

**Issue**: Redirect loops after authentication
- **Solution**: Check redirect URLs are configured correctly in Supabase

### Debug Tips

1. **Check Browser Console**
   - Look for authentication errors
   - Check network requests to Supabase

2. **Check Supabase Logs**
   - Go to **Logs** in Supabase dashboard
   - Filter by authentication events

3. **Verify Environment Variables**
   ```javascript
   console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL)
   console.log('Has Anon Key:', !!process.env.REACT_APP_SUPABASE_ANON_KEY)
   ```

## Rollback Plan

If issues arise during production deployment:

1. **Keep Kinde Active** (temporarily)
   - Don't delete Kinde account immediately
   - Keep credentials available

2. **Rollback Code**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Restore Database Column**
   ```sql
   ALTER TABLE children RENAME COLUMN user_id TO kinde_user_id;
   ```

4. **Revert Environment Variables**
   - Restore Kinde environment variables
   - Remove Supabase variables

## Benefits of This Migration

1. **Unified Platform**: Authentication and database in one service
2. **Better Integration**: Native RLS policies with auth.uid()
3. **Cost Savings**: Potentially reduced costs from consolidating services
4. **Enhanced Security**: Built-in security features and policies
5. **Better Developer Experience**: Consistent API and tooling
6. **Improved Email Handling**: Customizable email templates

## Support

If you encounter issues during migration:

1. Check this guide first
2. Review Supabase documentation: https://supabase.com/docs/guides/auth
3. Check GitHub issues in this repository
4. Contact the development team

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth UI React](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
