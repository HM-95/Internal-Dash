-- Fix subscription logic and reset users to correct default states
-- This migration fixes the issues where unpaid users were set to 'starter' instead of 'free'

-- Step 1: Add 'free' as a valid subscription plan if not already included
DO $$ 
BEGIN
    -- Drop the existing constraint to modify it
    ALTER TABLE public.user_preferences 
    DROP CONSTRAINT IF EXISTS user_preferences_subscription_plan_check;
    
    -- Add new constraint that includes 'free' for unpaid users
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_subscription_plan_check 
    CHECK (subscription_plan = ANY(ARRAY['free'::text, 'starter'::text, 'pro'::text, 'agency'::text]));
    
    -- Update the default value for new records to 'free' for unpaid users
    ALTER TABLE public.user_preferences 
    ALTER COLUMN subscription_plan SET DEFAULT 'free';
    
    RAISE NOTICE 'Updated subscription_plan constraint to include free tier';
END $$;

-- Step 2: Reset all users with 'starter' plan who don't have Stripe subscription IDs to 'free'
-- This fixes users who were incorrectly set to 'starter' when they should be 'free'
UPDATE public.user_preferences 
SET 
    subscription_plan = 'free',
    subscription_status = 'active',
    updated_at = NOW()
WHERE 
    subscription_plan = 'starter' 
    AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');

-- Step 3: Fix the specific user mentioned if they don't have a valid Stripe subscription
UPDATE public.user_preferences 
SET 
    subscription_plan = 'free',
    subscription_status = 'active',
    onboarding_completed = false,
    updated_at = NOW()
WHERE 
    user_id = 'b9870549-d823-4759-b069-5e9601d11673'
    AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');

-- Step 4: Add missing onboarding_steps_completed column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'onboarding_steps_completed') THEN
        ALTER TABLE public.user_preferences ADD COLUMN onboarding_steps_completed boolean DEFAULT false;
        
        -- Update existing records
        UPDATE public.user_preferences 
        SET onboarding_steps_completed = COALESCE(onboarding_steps_completed, false)
        WHERE onboarding_steps_completed IS NULL;
        
        RAISE NOTICE 'Added onboarding_steps_completed column';
    END IF;
END $$;

-- Step 5: Show summary of changes
DO $$ 
DECLARE
    free_users_count INTEGER;
    paid_users_count INTEGER;
    total_users_count INTEGER;
BEGIN
    -- Count users by subscription type
    SELECT COUNT(*) INTO free_users_count FROM public.user_preferences WHERE subscription_plan = 'free';
    SELECT COUNT(*) INTO paid_users_count FROM public.user_preferences WHERE subscription_plan IN ('starter', 'pro', 'agency');
    SELECT COUNT(*) INTO total_users_count FROM public.user_preferences;
    
    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '- Total users: %', total_users_count;
    RAISE NOTICE '- Free users: %', free_users_count;
    RAISE NOTICE '- Paid users: %', paid_users_count;
END $$;
