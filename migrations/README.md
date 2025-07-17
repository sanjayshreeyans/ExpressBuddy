# Database Migrations

This directory contains SQL migration files for the ExpressBuddy application.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL

### Option 2: Using Supabase CLI (if available)
```bash
supabase db push
```

### Option 3: Using psql (if you have direct database access)
```bash
psql -h your-supabase-host -U postgres -d postgres -f migrations/001_create_emotion_detective_tables.sql
```

## Migration Files

- `001_create_emotion_detective_tables.sql` - Creates tables for the emotion detective learning feature
  - `emotion_detective_progress` - Tracks child progress and unlocked emotions
  - `emotion_detective_sessions` - Manages individual learning sessions
  - `emotion_attempts` - Records individual question attempts and results

## Table Relationships

```
children (existing)
├── emotion_detective_progress (1:1)
└── emotion_detective_sessions (1:many)
    └── emotion_attempts (1:many)
```

## Security

All tables include Row Level Security (RLS) policies to ensure users can only access data for their own children.