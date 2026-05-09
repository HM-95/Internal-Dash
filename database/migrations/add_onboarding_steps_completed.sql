-- Add onboarding_steps_completed column to user_preferences table
-- This column tracks if user completed onboarding steps but may not have subscribed yet

DO $$ 
BEGIN
    -- Check if the column doesn't exist before adding it
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'onboarding_steps_completed'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN onboarding_steps_completed boolean DEFAULT false;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding_steps_completed 
        ON user_preferences(onboarding_steps_completed);
        
        RAISE NOTICE 'Added onboarding_steps_completed column to user_preferences table';
    ELSE
        RAISE NOTICE 'Column onboarding_steps_completed already exists in user_preferences table';
    END IF;
END $$;
