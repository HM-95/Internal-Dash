-- Add trial fields to user_preferences table for 7-day free trial functionality
-- This migration adds columns to track trial start/end dates and trial status

DO $$ 
BEGIN
    -- Add trial_start_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'trial_start_date'
    ) THEN
        ALTER TABLE public.user_preferences 
        ADD COLUMN trial_start_date timestamp with time zone;
        
        RAISE NOTICE 'Added trial_start_date column to user_preferences table';
    ELSE
        RAISE NOTICE 'Column trial_start_date already exists in user_preferences table';
    END IF;
    
    -- Add trial_end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'trial_end_date'
    ) THEN
        ALTER TABLE public.user_preferences 
        ADD COLUMN trial_end_date timestamp with time zone;
        
        RAISE NOTICE 'Added trial_end_date column to user_preferences table';
    ELSE
        RAISE NOTICE 'Column trial_end_date already exists in user_preferences table';
    END IF;
    
    -- Add 'trialing' as a valid subscription status if not already included
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'subscription_status'
    ) THEN
        -- Column doesn't exist, add it
        ALTER TABLE public.user_preferences 
        ADD COLUMN subscription_status text DEFAULT 'active';
        
        RAISE NOTICE 'Added subscription_status column to user_preferences table';
    ELSE
        -- Column exists, check if we need to update the constraint
        RAISE NOTICE 'Column subscription_status already exists in user_preferences table';
    END IF;
END $$;

-- First, check what invalid subscription_status values exist
DO $$ 
DECLARE
    invalid_statuses RECORD;
BEGIN
    RAISE NOTICE 'Checking for invalid subscription_status values...';
    
    FOR invalid_statuses IN 
        SELECT DISTINCT subscription_status, COUNT(*) as count
        FROM public.user_preferences 
        WHERE subscription_status NOT IN ('free', 'active', 'cancelled', 'past_due', 'trialing')
           OR subscription_status IS NULL
        GROUP BY subscription_status
    LOOP
        RAISE NOTICE 'Found invalid status: % with % rows', invalid_statuses.subscription_status, invalid_statuses.count;
    END LOOP;
END $$;

-- Fix any existing invalid subscription_status values
UPDATE public.user_preferences 
SET subscription_status = 'free'
WHERE subscription_status NOT IN ('free', 'active', 'cancelled', 'past_due', 'trialing')
   OR subscription_status IS NULL;

-- Update subscription_status constraint to include 'trialing' status
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.user_preferences 
    DROP CONSTRAINT IF EXISTS user_preferences_subscription_status_check;
    
    -- Add new constraint that includes 'trialing' for trial subscriptions
    ALTER TABLE public.user_preferences 
    ADD CONSTRAINT user_preferences_subscription_status_check 
    CHECK (subscription_status = ANY(ARRAY['free'::text, 'active'::text, 'trialing'::text, 'cancelled'::text, 'past_due'::text]));
    
    RAISE NOTICE 'Updated subscription_status constraint to include trialing status';
END $$;

-- Create indexes for trial-related columns for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_trial_start_date ON public.user_preferences(trial_start_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_trial_end_date ON public.user_preferences(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription_status ON public.user_preferences(subscription_status);

-- Update existing records to have default values for new columns
UPDATE public.user_preferences 
SET 
    trial_start_date = COALESCE(trial_start_date, NULL),
    trial_end_date = COALESCE(trial_end_date, NULL),
    subscription_status = COALESCE(subscription_status, 'active')
WHERE trial_start_date IS NULL 
   OR trial_end_date IS NULL 
   OR subscription_status IS NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN public.user_preferences.trial_start_date IS 'When the user started their 7-day free trial';
COMMENT ON COLUMN public.user_preferences.trial_end_date IS 'When the user''s 7-day free trial ends';
COMMENT ON COLUMN public.user_preferences.subscription_status IS 'Current subscription status: free, active, trialing, cancelled, or past_due';
