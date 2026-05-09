-- Migration to add missing columns to existing user_preferences table
-- This script adds the new columns we need for the enhanced functionality

-- Add subscription and plan information columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.user_preferences ADD COLUMN subscription_plan text DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.user_preferences ADD COLUMN subscription_status text DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.user_preferences ADD COLUMN stripe_customer_id text;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.user_preferences ADD COLUMN stripe_subscription_id text;
    END IF;
END $$;

-- Add onboarding and user status columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.user_preferences ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'onboarding_completed_at') THEN
        ALTER TABLE public.user_preferences ADD COLUMN onboarding_completed_at timestamp with time zone;
    END IF;
END $$;

-- Add usage tracking columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_creator_searches') THEN
        ALTER TABLE public.user_preferences ADD COLUMN monthly_creator_searches integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_ai_chats') THEN
        ALTER TABLE public.user_preferences ADD COLUMN monthly_ai_chats integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'monthly_lists_created') THEN
        ALTER TABLE public.user_preferences ADD COLUMN monthly_lists_created integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'usage_reset_date') THEN
        ALTER TABLE public.user_preferences ADD COLUMN usage_reset_date date DEFAULT (CURRENT_DATE + INTERVAL '1 month');
    END IF;
END $$;

-- Add additional preferences columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'preferred_platforms') THEN
        ALTER TABLE public.user_preferences ADD COLUMN preferred_platforms jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'preferred_locations') THEN
        ALTER TABLE public.user_preferences ADD COLUMN preferred_locations jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'min_followers') THEN
        ALTER TABLE public.user_preferences ADD COLUMN min_followers integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'max_followers') THEN
        ALTER TABLE public.user_preferences ADD COLUMN max_followers integer;
    END IF;
END $$;

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'user_preferences_user_id_unique') THEN
        ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription_plan ON public.user_preferences(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding_completed ON public.user_preferences(onboarding_completed);

-- Function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_user_preferences_updated_at') THEN
        CREATE TRIGGER update_user_preferences_updated_at
          BEFORE UPDATE ON public.user_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_user_preferences_updated_at();
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE public.user_preferences 
SET 
    subscription_plan = COALESCE(subscription_plan, 'free'),
    subscription_status = COALESCE(subscription_status, 'active'),
    onboarding_completed = COALESCE(onboarding_completed, false),
    monthly_creator_searches = COALESCE(monthly_creator_searches, 0),
    monthly_ai_chats = COALESCE(monthly_ai_chats, 0),
    monthly_lists_created = COALESCE(monthly_lists_created, 0),
    usage_reset_date = COALESCE(usage_reset_date, CURRENT_DATE + INTERVAL '1 month'),
    preferred_platforms = COALESCE(preferred_platforms, '[]'::jsonb),
    preferred_locations = COALESCE(preferred_locations, '[]'::jsonb),
    min_followers = COALESCE(min_followers, 0)
WHERE subscription_plan IS NULL 
   OR subscription_status IS NULL 
   OR onboarding_completed IS NULL 
   OR monthly_creator_searches IS NULL 
   OR monthly_ai_chats IS NULL 
   OR monthly_lists_created IS NULL 
   OR usage_reset_date IS NULL 
   OR preferred_platforms IS NULL 
   OR preferred_locations IS NULL 
   OR min_followers IS NULL;
