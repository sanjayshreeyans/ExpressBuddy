# Supabase Auth Migration - QA & Verification Guide

**Purpose**: Step-by-step guide to verify the Supabase authentication migration is working correctly  
**Target Audience**: QA Team, DevOps, Release Manager  
**Estimated Time**: 1-2 hours for full verification

---

## Pre-QA Checklist

- [ ] PR #11 merged successfully
- [ ] All code review comments resolved
- [ ] Build passes without errors: `npm run build`
- [ ] Type checking passes: `npm run type-check`
- [ ] Environment variables configured (see below)
- [ ] Supabase project accessible

### Environment Setup

```bash
# Create .env.local for testing
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_GEMINI_API_KEY=your-gemini-key
```

**Verify Supabase Configuration:**

1. Login to Supabase Dashboard
2. Go to Authentication → Settings
3. Confirm:
   - [ ] Email provider is enabled
   - [ ] Confirm email is DISABLED (for dev/staging)
   - [ ] Redirect URLs include `http://localhost:3000/dashboard`

---

## QA Test Cases

### Section 1: Authentication Flows (Critical)

#### Test 1.1: New User Registration

**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Look for Auth UI form
3. Enter new test email: `testuser+qa1@example.com`
4. Enter password: `TestPassword123!`
5. Click "Sign Up"

**Expected Results:**
- ✅ User account created in Supabase Auth
- ✅ Redirect to onboarding page (`/onboarding`)
- ✅ No error messages in console
- ✅ Session token stored in browser (check DevTools → Application → Local Storage)

**Verify in Supabase Dashboard:**
```sql
-- Run this query to verify user was created
SELECT id, email, created_at FROM auth.users 
WHERE email = 'testuser+qa1@example.com';
```

---

#### Test 1.2: New User Onboarding

**Prerequisites:** Complete Test 1.1 first

**Steps:**
1. You should be on `/onboarding` page
2. Enter name: "TestChild"
3. Select age: 8
4. Click "Continue"

**Expected Results:**
- ✅ Child profile created in database
- ✅ Redirect to dashboard (`/dashboard`)
- ✅ User name "TestChild" displayed
- ✅ No RLS errors in console

**Verify in Supabase:**
```sql
-- Check child profile was created with correct user_id
SELECT id, user_id, name, age, created_at FROM public.children 
WHERE name = 'TestChild';

-- Verify user_id is a valid UUID matching the auth.users entry
SELECT id FROM auth.users WHERE email = 'testuser+qa1@example.com';
```

---

#### Test 1.3: Existing User Login

**Prerequisites:** Create a second test user account beforehand

**Steps:**
1. Logout current user (click profile menu → Logout)
2. You should be on `/` (home)
3. Navigate to `/login`
4. Enter email from Test 1.1: `testuser+qa1@example.com`
5. Enter password: `TestPassword123!`
6. Click "Sign In"

**Expected Results:**
- ✅ User logged in successfully
- ✅ Redirect to dashboard (`/dashboard`)
- ✅ Child profile "TestChild" displayed
- ✅ Session restored (can refresh page, still logged in)

---

#### Test 1.4: Session Persistence

**Prerequisites:** Logged in state from Test 1.3

**Steps:**
1. Open DevTools → Application → Local Storage
2. Note the `sb-` prefixed session keys
3. Refresh page (Ctrl+R or Cmd+R)
4. Wait for page to reload

**Expected Results:**
- ✅ Still logged in after refresh
- ✅ Dashboard visible immediately (no redirect to login)
- ✅ Child profile data loaded
- ✅ Session state preserved in localStorage

---

#### Test 1.5: Logout

**Prerequisites:** Logged in state

**Steps:**
1. Click profile/menu in top right
2. Click "Logout" button
3. Confirm logout action if prompted

**Expected Results:**
- ✅ User logged out
- ✅ Redirect to home page (`/`)
- ✅ Session cleared from localStorage
- ✅ Login page accessible

**Verify:**
```bash
# Check browser console - should see auth state change event
# In DevTools → Console, check for: Auth state changed
```

---

### Section 2: Protected Routes (Critical)

#### Test 2.1: Unauthenticated Access to Protected Routes

**Steps:**
1. Make sure you are logged out
2. Try to navigate directly to `/dashboard`

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Cannot access protected routes
- ✅ No data leakage

**Repeat for these routes:**
- `/chat` → should redirect to `/login`
- `/emotion-mirroring` → should redirect to `/login`
- `/Pico-challenges` → should redirect to `/login`

---

#### Test 2.2: First-Time User Redirect

**Steps:**
1. Create a new user (don't complete onboarding)
2. Try to navigate directly to `/dashboard`

**Expected Results:**
- ✅ Redirected to `/onboarding`
- ✅ Cannot access dashboard without profile
- ✅ Onboarding form displayed

---

#### Test 2.3: Public Routes Remain Public

**Steps:**
1. Logout
2. Navigate to `/video-avatar-demo`
3. Navigate to `/emotion-detective`

**Expected Results:**
- ✅ Can access without login
- ✅ Features work normally
- ✅ No auth redirects

---

### Section 3: User Data Isolation (Critical - RLS Testing)

#### Test 3.1: RLS - Can't Access Other Users' Data

**Prerequisites:** Two separate user accounts with child profiles

**Setup:**
1. Create User A with child "ChildA"
2. Create User B with child "ChildB"

**Steps:**
1. Login as User A
2. Open DevTools → Network tab
3. Navigate to dashboard
4. Inspect GraphQL/API calls to verify only User A's child is returned

**Verify with Query:**
```sql
-- Run as authenticated user (User A)
SELECT * FROM public.children;
-- Should return ONLY ChildA, not ChildB

-- Run as authenticated user (User B)
SELECT * FROM public.children;
-- Should return ONLY ChildB, not ChildA
```

**Expected Results:**
- ✅ Each user sees only their own child data
- ✅ RLS policies working correctly
- ✅ No data leakage between users
- ✅ API returns 403 Forbidden if trying to access other user's data

---

#### Test 3.2: RLS - Child Profile Ownership

**Prerequisites:** Test 3.1 complete

**Steps:**
1. Logout
2. In Supabase Studio, navigate to SQL Editor
3. Run this query while NOT authenticated:
   ```sql
   SELECT * FROM public.children;
   ```

**Expected Results:**
- ✅ Returns error or empty result (RLS denies anonymous access)
- ✅ Must be authenticated to query children table

---

### Section 4: Error Handling

#### Test 4.1: Invalid Credentials

**Steps:**
1. Go to login page
2. Enter email: `testuser+qa1@example.com`
3. Enter wrong password: `WrongPassword123!`
4. Click Sign In

**Expected Results:**
- ✅ Error message displays: "Invalid login credentials"
- ✅ Not redirected
- ✅ Can retry login
- ✅ No console errors

---

#### Test 4.2: Invalid Email Format

**Steps:**
1. Go to login page
2. Enter email: `not-an-email`
3. Try to submit

**Expected Results:**
- ✅ Form validation error
- ✅ Cannot submit invalid email
- ✅ Clear error message

---

#### Test 4.3: Weak Password

**Steps:**
1. Go to login page
2. Click "Sign Up"
3. Enter email: `testuser+weak@example.com`
4. Enter password: `123` (too weak)
5. Try to submit

**Expected Results:**
- ✅ Password validation error
- ✅ Cannot submit weak password
- ✅ Requirements shown

---

#### Test 4.4: Network Error Handling

**Steps:**
1. Open DevTools → Network tab
2. Set Network throttling to "Offline"
3. Try to login
4. Restore network

**Expected Results:**
- ✅ Error message shown
- ✅ Graceful error handling
- ✅ Can retry after network restored

---

### Section 5: Database Migration Verification

#### Test 5.1: Schema Verification

**Steps:**
1. Open Supabase Studio → SQL Editor
2. Run this query:

```sql
-- Check children table schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'children'
ORDER BY ordinal_position;
```

**Expected Results:**
- ✅ Columns include: `id` (uuid), `user_id` (uuid), `name` (text), `age` (integer)
- ✅ `kinde_user_id` (text) still present for reference
- ✅ All expected columns present

---

#### Test 5.2: Index Verification

**Steps:**
```sql
-- Check indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'children';
```

**Expected Results:**
- ✅ Index `idx_children_user_id` exists
- ✅ Index is on correct column: `user_id`

---

#### Test 5.3: RLS Policies Verification

**Steps:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'children';

-- Check policies exist
SELECT policyname, cmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'children'
ORDER BY policyname;
```

**Expected Results:**
- ✅ `rowsecurity` is TRUE
- ✅ 4 policies exist:
  - Users can view their own children (SELECT)
  - Users can create their own children (INSERT)
  - Users can update their own children (UPDATE)
  - Users can delete their own children (DELETE)
- ✅ All policies use authenticated role

---

#### Test 5.4: Backup Table Verification

**Steps:**
```sql
-- Check backup exists
SELECT tablename FROM pg_tables 
WHERE tablename = 'children_backup_20241108';

-- Verify it has data
SELECT COUNT(*) FROM children_backup_20241108;
```

**Expected Results:**
- ✅ Backup table exists: `children_backup_20241108`
- ✅ Contains at least one row (or empty if no data)

---

### Section 6: Component Functionality

#### Test 6.1: Dashboard Display

**Prerequisites:** Logged in with child profile

**Steps:**
1. Navigate to `/dashboard`
2. Check all elements visible

**Expected Results:**
- ✅ Welcome message shows child's name
- ✅ Learning path displays correctly
- ✅ Logout button visible and functional
- ✅ All lesson cards load without errors

---

#### Test 6.2: Emotion Detective Game

**Prerequisites:** Logged in with child profile

**Steps:**
1. Click on "Emotion Detective" or navigate to `/emotion-detective`
2. Play through first question
3. Complete the session

**Expected Results:**
- ✅ Game loads and renders
- ✅ Questions display correctly
- ✅ Progress is tracked
- ✅ No auth-related errors
- ✅ XP/progress saved to database

---

#### Test 6.3: Video Avatar Chat

**Prerequisites:** Logged in (optional, demo is public)

**Steps:**
1. Navigate to `/video-avatar-demo`
2. Try to start a conversation

**Expected Results:**
- ✅ Avatar renders
- ✅ Chat interface functions
- ✅ Conversation works end-to-end
- ✅ No auth errors in console

---

### Section 7: Browser Compatibility

Test on these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**For each browser, run Tests 1.1 - 1.5**

**Expected Results:**
- ✅ Auth flows work on all browsers
- ✅ Session persistence works
- ✅ RLS enforcement works
- ✅ No console errors

---

### Section 8: Performance Testing

#### Test 8.1: Login Response Time

**Steps:**
1. Open DevTools → Network tab
2. Clear cookies/storage
3. Go to login
4. Login with valid credentials
5. Check response time

**Expected Results:**
- ✅ Sign-in completes within 2-3 seconds
- ✅ No timeout errors
- ✅ Consistent performance across attempts

---

#### Test 8.2: Dashboard Load Time

**Steps:**
1. Clear cache
2. Navigate to dashboard (logged in)
3. Measure time to interactive

**Expected Results:**
- ✅ Dashboard loads within 2-3 seconds
- ✅ Child data displayed within 1 second of page load
- ✅ No layout shift after render

---

## Console Checks

### Errors to Monitor

After completing QA tests, check browser console for these error patterns:

**❌ SHOULD NOT SEE:**
```
- "operator does not exist: text = uuid" → Type mismatch in RLS
- "permission denied for schema public" → RLS policy issue
- "Cannot read property 'id' of null" → Auth state not initialized
- "CORS error" → Configuration issue
- "TypeError: user is null" → Missing auth context
```

**✅ OK TO SEE:**
```
- Auth state changed: (normal state transitions)
- Session restored from storage (expected)
- Loading... (normal loading states)
```

---

## Database Query Checks

Run these SQL queries to verify migration integrity:

### Query 1: Verify Data Integrity

```sql
-- Check all children records have been assessed
SELECT 
  COUNT(*) as total_children,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
  COUNT(CASE WHEN kinde_user_id IS NOT NULL THEN 1 END) as with_kinde_id
FROM public.children;
```

**Expected:** All records should have `kinde_user_id` for reference, some/all have `user_id` post-migration

### Query 2: Check RLS Effectiveness

```sql
-- Verify RLS is preventing unauthorized access
-- This should work as authenticated user
SELECT COUNT(*) FROM public.children;

-- This should fail as anonymous (non-authenticated)
-- SELECT COUNT(*) FROM public.children; -- (as anonymous)
```

### Query 3: Emotion Detective Progress

```sql
-- Verify related tables still work with child foreign keys
SELECT COUNT(DISTINCT child_id) as children_with_progress
FROM public.emotion_detective_progress;
```

---

## Sign-Off Checklist

After completing all tests, verify:

- [ ] All Test 1.x (Auth Flows) passed
- [ ] All Test 2.x (Protected Routes) passed
- [ ] All Test 3.x (RLS/Data Isolation) passed
- [ ] All Test 4.x (Error Handling) passed
- [ ] All Test 5.x (Database) passed
- [ ] All Test 6.x (Components) passed
- [ ] All Test 7.x (Browser Compatibility) passed
- [ ] All Test 8.x (Performance) passed
- [ ] No console errors matching "SHOULD NOT SEE" list
- [ ] Database queries executed successfully

---

## Issues Found

**Template for documenting issues:**

```
### Issue #[N]: [Brief Description]

**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**: 
1. ...
2. ...

**Expected**: 
- 

**Actual**: 
- 

**Root Cause**: 
- 

**Resolution**: 
- 

**Re-test Status**: [ ] Verified Fixed
```

---

## Sign-Off

**QA Team**: ________________  **Date**: ________________

**Release Manager**: ________________  **Date**: ________________

---

## Post-QA Steps

1. [ ] Document all issues found
2. [ ] Create GitHub issues for bugs
3. [ ] Fix critical issues before release
4. [ ] Re-run QA on fixed code
5. [ ] Get final approval
6. [ ] Deploy to production
7. [ ] Monitor logs for 24 hours post-deployment
8. [ ] Send release notification

---

## Support & Escalation

**If issues occur:**

1. **Check**: Supabase dashboard logs
   - Authentication → Audit Logs
   - Database → Query Performance

2. **Verify**: Environment variables are correct

3. **Test**: RLS policies with test queries

4. **Rollback**: Available via backup table and SQL scripts

5. **Contact**: Development team for support

---

**Document Version**: 1.0  
**Last Updated**: November 8, 2025  
**Status**: Ready for QA
