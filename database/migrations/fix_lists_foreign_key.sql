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

-- Verify the changes
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

