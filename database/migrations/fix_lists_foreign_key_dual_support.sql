-- Fix foreign key constraints to support BOTH users and internal_users tables
-- This allows backward compatibility while enabling internal authentication

-- Step 1: Drop the existing foreign key constraints (they're too restrictive)
ALTER TABLE public.lists
DROP CONSTRAINT IF EXISTS lists_user_id_fkey;

ALTER TABLE public.tags
DROP CONSTRAINT IF EXISTS tags_user_id_fkey;

-- Step 2: We WON'T add back the foreign key constraints
-- Instead, we'll rely on application-level validation
-- This allows user_id to reference either users OR internal_users table

-- Step 3: Add indexes for performance (since we removed the FK indexes)
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- Step 4: Verify the constraints are removed
SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('lists', 'tags')
    AND kcu.column_name = 'user_id';

-- This query should return 0 rows, confirming the FK constraints are removed

