-- Migration to update user_preferences table to match actual pricing plans
-- This focuses on imports and exports tracking as the main usage metrics

-- First, let's remove columns we don't need based on the pricing plans
DO $$ 
BEGIN
    -- Remove columns that aren't part of the pricing plan tracking
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_creator_searches') THEN
        ALTER TABLE public.user_preferences DROP COLUMN monthly_creator_searches;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_ai_chats') THEN
        ALTER TABLE public.user_preferences DROP COLUMN monthly_ai_chats;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_lists_created') THEN
        ALTER TABLE public.user_preferences DROP COLUMN monthly_lists_created;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'usage_reset_date') THEN
        ALTER TABLE public.user_preferences DROP COLUMN usage_reset_date;
    END IF;
    
    -- Remove columns that aren't essential for the core functionality
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'preferred_platforms') THEN
        ALTER TABLE public.user_preferences DROP COLUMN preferred_platforms;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'preferred_locations') THEN
        ALTER TABLE public.user_preferences DROP COLUMN preferred_locations;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'min_followers') THEN
        ALTER TABLE public.user_preferences DROP COLUMN min_followers;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'max_followers') THEN
        ALTER TABLE public.user_preferences DROP COLUMN max_followers;
    END IF;
END $$;

-- Add the new columns for tracking imports and exports
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_imports_used') THEN
        ALTER TABLE public.user_preferences ADD COLUMN monthly_imports_used integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_exports_used') THEN
        ALTER TABLE public.user_preferences ADD COLUMN monthly_exports_used integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_ai_searches_used') THEN
        ALTER TABLE public.user_preferences ADD COLUMN monthly_ai_searches_used integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'usage_reset_date') THEN
        ALTER TABLE public.user_preferences ADD COLUMN usage_reset_date date DEFAULT (CURRENT_DATE + INTERVAL '1 month');
    END IF;
END $$;

-- Update subscription plan values to match the actual pricing tiers
UPDATE public.user_preferences 
SET subscription_plan = 'starter'
WHERE subscription_plan = 'free';

-- Update the subscription_plan column to use the correct enum values
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_subscription_plan_check;

ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_subscription_plan_check 
CHECK (subscription_plan IN ('starter', 'pro', 'agency'));

-- Create indexes for the new usage tracking columns
CREATE INDEX IF NOT EXISTS idx_user_preferences_monthly_imports ON public.user_preferences(monthly_imports_used);
CREATE INDEX IF NOT EXISTS idx_user_preferences_monthly_exports ON public.user_preferences(monthly_exports_used);
CREATE INDEX IF NOT EXISTS idx_user_preferences_monthly_ai_searches ON public.user_preferences(monthly_ai_searches_used);

-- Update existing records to have default values for new columns
UPDATE public.user_preferences 
SET 
    monthly_imports_used = COALESCE(monthly_imports_used, 0),
    monthly_exports_used = COALESCE(monthly_exports_used, 0),
    monthly_ai_searches_used = COALESCE(monthly_ai_searches_used, 0),
    usage_reset_date = COALESCE(usage_reset_date, CURRENT_DATE + INTERVAL '1 month')
WHERE monthly_imports_used IS NULL 
   OR monthly_exports_used IS NULL 
   OR monthly_ai_searches_used IS NULL 
   OR usage_reset_date IS NULL;
