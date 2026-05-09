-- Fix subscription_plan constraint and default to properly handle unpaid users
-- Add 'free' as a valid option for unpaid users since starter costs $149

DO $$ 
BEGIN
    -- Drop the existing constraint
    ALTER TABLE public.user_preferences 
    DROP CONSTRAINT IF EXISTS user_preferences_subscription_plan_check;
    
    -- Add new constraint that includes 'free' for unpaid users
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_subscription_plan_check 
    CHECK (subscription_plan = ANY(ARRAY['free'::text, 'starter'::text, 'pro'::text, 'agency'::text]));
    
    -- Update the default value for the column to 'free' for unpaid users
    ALTER TABLE public.user_preferences 
    ALTER COLUMN subscription_plan SET DEFAULT 'free';
    
    -- Update any existing records with invalid states to 'free' (unpaid)
    UPDATE public.user_preferences 
    SET subscription_plan = 'free' 
    WHERE subscription_plan NOT IN ('free', 'starter', 'pro', 'agency');
    
    RAISE NOTICE 'Updated subscription_plan constraint to include free tier and set proper default';
END $$;
