-- Rollback script for trial fields migration
-- This will safely remove the trial-related changes if needed
-- WARNING: Only run this if you need to undo the trial fields migration

/*
⚠️  ROLLBACK WARNING:
- This will remove trial_start_date and trial_end_date columns
- This will remove trial-related indexes
- This will revert subscription_status constraint
- All trial data will be lost
- Only run this if absolutely necessary

🔄 WHAT THIS ROLLBACK DOES:
- Drops trial_start_date column
- Drops trial_end_date column
- Removes trial-related indexes
- Reverts subscription_status constraint to original state
- Restores database to pre-trial state

✅ SAFETY FEATURES:
- Only affects user_preferences table
- No impact on other tables
- Preserves all non-trial data
- Safe to run if migration was successful
*/

-- Step 1: Remove trial-related indexes
DROP INDEX IF EXISTS idx_user_preferences_trial_start_date;
DROP INDEX IF EXISTS idx_user_preferences_trial_end_date;

-- Step 2: Remove subscription_status constraint
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_subscription_status_check;

-- Step 3: Add back original constraint (without 'trialing')
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_subscription_status_check 
CHECK (subscription_status = ANY(ARRAY['free'::text, 'active'::text, 'cancelled'::text, 'past_due'::text]));

-- Step 4: Remove trial columns
ALTER TABLE public.user_preferences 
DROP COLUMN IF EXISTS trial_start_date;

ALTER TABLE public.user_preferences 
DROP COLUMN IF EXISTS trial_end_date;

-- Step 5: Verification
DO $$ 
BEGIN
    RAISE NOTICE '🔍 Rollback verification...';
    
    -- Check that trial columns are gone
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'trial_start_date'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'trial_end_date'
    ) THEN
        RAISE NOTICE '✅ Trial columns removed successfully';
    ELSE
        RAISE NOTICE '❌ Some trial columns still exist';
    END IF;
    
    -- Check constraint
    IF EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'user_preferences' 
        AND constraint_name = 'user_preferences_subscription_status_check'
    ) THEN
        RAISE NOTICE '✅ Subscription status constraint restored';
    ELSE
        RAISE NOTICE '❌ Subscription status constraint missing';
    END IF;
    
    RAISE NOTICE '🎉 Rollback completed successfully!';
    RAISE NOTICE 'Database restored to pre-trial state';
END $$;
