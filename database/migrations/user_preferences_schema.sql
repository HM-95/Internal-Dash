-- Enhanced user_preferences table schema
-- This includes additional columns for subscription plans, onboarding status, and other features

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  selected_niches jsonb NULL DEFAULT '[]'::jsonb,
  target_audience_description text NULL,
  
  -- Subscription and plan information
  subscription_plan text NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status text NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
  stripe_customer_id text NULL,
  stripe_subscription_id text NULL,
  
  -- Onboarding and user status
  onboarding_completed boolean NULL DEFAULT false,
  onboarding_completed_at timestamp with time zone NULL,
  onboarding_steps_completed boolean NULL DEFAULT false, -- User completed steps but may not have subscribed yet
  
  -- Usage tracking for plan limits
  monthly_creator_searches integer NULL DEFAULT 0,
  monthly_ai_chats integer NULL DEFAULT 0,
  monthly_lists_created integer NULL DEFAULT 0,
  usage_reset_date date NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  
  -- Additional preferences
  preferred_platforms jsonb NULL DEFAULT '[]'::jsonb, -- ['instagram', 'tiktok', 'youtube']
  preferred_locations jsonb NULL DEFAULT '[]'::jsonb, -- ['New York', 'Los Angeles']
  min_followers integer NULL DEFAULT 0,
  max_followers integer NULL,
  
  -- Timestamps
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription_plan ON public.user_preferences(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding_completed ON public.user_preferences(onboarding_completed);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Insert default preferences for existing users (optional)
-- This can be run after the table is created to set up default preferences for existing users
-- INSERT INTO public.user_preferences (user_id, selected_niches, target_audience_description, onboarding_completed)
-- SELECT id, '[]'::jsonb, NULL, false
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.user_preferences WHERE user_id IS NOT NULL);
