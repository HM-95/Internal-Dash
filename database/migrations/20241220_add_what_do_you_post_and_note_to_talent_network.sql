-- Add 'What do you post?' and 'Note' columns to talent_network table
-- Run this SQL in Supabase SQL Editor

-- Add 'what_do_you_post' column if it doesn't exist
ALTER TABLE public.talent_network 
ADD COLUMN IF NOT EXISTS what_do_you_post TEXT DEFAULT NULL;

-- Add 'note' column if it doesn't exist
ALTER TABLE public.talent_network 
ADD COLUMN IF NOT EXISTS note TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.talent_network.what_do_you_post IS 'User-defined description of what the creator posts.';
COMMENT ON COLUMN public.talent_network.note IS 'User-defined notes about the creator.';

