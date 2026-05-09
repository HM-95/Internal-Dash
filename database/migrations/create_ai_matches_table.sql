-- Create ai_matches table for storing user's personalized creator matches
CREATE TABLE IF NOT EXISTS public.ai_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL, -- References creatordata.id
    match_score INTEGER NOT NULL DEFAULT 0, -- 0-100 match score
    match_explanation TEXT, -- Why this creator was matched
    selected_niches TEXT[] NOT NULL DEFAULT '{}', -- User's selected niches that influenced this match
    target_audience_description TEXT, -- User's target audience description
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_matches_user_id ON public.ai_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_creator_id ON public.ai_matches(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_matches_match_score ON public.ai_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_matches_user_score ON public.ai_matches(user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_matches_created_at ON public.ai_matches(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI matches" ON public.ai_matches
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI matches" ON public.ai_matches
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI matches" ON public.ai_matches
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI matches" ON public.ai_matches
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_ai_matches_updated_at
    BEFORE UPDATE ON public.ai_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_matches_updated_at();

-- Add comments
COMMENT ON TABLE public.ai_matches IS 'Stores personalized creator matches for users based on their preferences';
COMMENT ON COLUMN public.ai_matches.match_score IS 'Match score from 0-100 based on niche, location, and other factors';
COMMENT ON COLUMN public.ai_matches.match_explanation IS 'Human-readable explanation of why this creator was matched';
COMMENT ON COLUMN public.ai_matches.selected_niches IS 'User niches that influenced this match';
