# Fix Lists Database Foreign Key Constraint

## Problem

The `lists` and `tags` tables have foreign key constraints pointing to a `users` table, but we're now using `internal_users` for authentication. This causes the error:

```
Key (user_id)=(d9db9013-994b-4ed7-aae5-e1a9a25a0441) is not present in table "users".
```

## Solution

Run the migration script to update the foreign key constraints to point to `internal_users` instead of `users`.

## Steps to Fix

### 1. Go to Supabase Dashboard

1. Navigate to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar

### 2. Run the Migration

Copy and paste the following SQL script into the SQL Editor:

```sql
-- Fix foreign key constraint on lists table to reference internal_users instead of users
-- This migration removes the old constraint and adds a new one pointing to internal_users

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.lists
DROP CONSTRAINT IF EXISTS lists_user_id_fkey;

-- Step 2: Add new foreign key constraint pointing to internal_users
ALTER TABLE public.lists
ADD CONSTRAINT lists_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.internal_users(id) 
ON DELETE CASCADE;

-- Step 3: Do the same for tags table if it has a user_id foreign key
ALTER TABLE public.tags
DROP CONSTRAINT IF EXISTS tags_user_id_fkey;

ALTER TABLE public.tags
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.internal_users(id) 
ON DELETE CASCADE;
```

### 3. Click "Run" to execute the migration

### 4. Verify the Changes

Run this query to confirm the foreign keys are now pointing to `internal_users`:

```sql
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('lists', 'tags')
    AND kcu.column_name = 'user_id';
```

**Expected Result:**
You should see that both `lists` and `tags` tables now reference `internal_users` instead of `users`.

## What This Does

- **Removes** old foreign key constraints that pointed to the `users` table
- **Adds** new foreign key constraints that point to the `internal_users` table
- **Enables CASCADE DELETE** so if an internal user is deleted, their lists and tags are also deleted
- **Fixes** the list creation error immediately

## After Running This Migration

1. Test creating a new list from the Discover page
2. Test creating a new list from the My Lists page
3. All list operations should now work correctly!

## Troubleshooting

If you get an error about existing data:

1. Check if there's existing data in `lists` or `tags` with invalid `user_id` values
2. Clean up any orphaned records first:

```sql
-- Find orphaned lists
SELECT * FROM lists WHERE user_id NOT IN (SELECT id FROM internal_users);

-- Find orphaned tags
SELECT * FROM tags WHERE user_id NOT IN (SELECT id FROM internal_users);

-- Delete orphaned records if found
DELETE FROM lists WHERE user_id NOT IN (SELECT id FROM internal_users);
DELETE FROM tags WHERE user_id NOT IN (SELECT id FROM internal_users);
```

Then re-run the migration script.

