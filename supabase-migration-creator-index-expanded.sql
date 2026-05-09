-- Migration: Expand creator_index table with additional filtering metadata
-- This migration adds new fields to support more accurate, filterable results

-- Add new columns to creator_index table
ALTER TABLE creator_index 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS location_region TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS brand_tags TEXT,
ADD COLUMN IF NOT EXISTS bio_links TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS past_ad_placements TEXT[];

-- Create indexes for the new filtering fields
CREATE INDEX IF NOT EXISTS idx_creator_index_location ON creator_index(location);
CREATE INDEX IF NOT EXISTS idx_creator_index_location_region ON creator_index(location_region);
CREATE INDEX IF NOT EXISTS idx_creator_index_platform ON creator_index(platform);
CREATE INDEX IF NOT EXISTS idx_creator_index_brand_tags ON creator_index USING GIN(to_tsvector('english', brand_tags));
CREATE INDEX IF NOT EXISTS idx_creator_index_past_ad_placements ON creator_index USING GIN(past_ad_placements);

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_creator_index_location_platform ON creator_index(location, platform);
CREATE INDEX IF NOT EXISTS idx_creator_index_location_niche ON creator_index(location, primary_niche);
CREATE INDEX IF NOT EXISTS idx_creator_index_platform_niche ON creator_index(platform, primary_niche);
CREATE INDEX IF NOT EXISTS idx_creator_index_location_platform_niche ON creator_index(location, platform, primary_niche);

-- Create functional indexes for case-insensitive searches
CREATE INDEX IF NOT EXISTS idx_creator_index_location_lower ON creator_index(LOWER(location));
CREATE INDEX IF NOT EXISTS idx_creator_index_location_region_lower ON creator_index(LOWER(location_region));
CREATE INDEX IF NOT EXISTS idx_creator_index_platform_lower ON creator_index(LOWER(platform));

-- Add comments for documentation
COMMENT ON COLUMN creator_index.location IS 'Creator location (e.g., "Miami, FL", "Los Angeles")';
COMMENT ON COLUMN creator_index.location_region IS 'General region (e.g., "Florida", "California", "Northeast")';
COMMENT ON COLUMN creator_index.platform IS 'Primary platform (e.g., "TikTok", "Instagram", "YouTube")';
COMMENT ON COLUMN creator_index.brand_tags IS 'Brand tags and categories (e.g., "crypto, tech, lifestyle")';
COMMENT ON COLUMN creator_index.bio_links IS 'Links from bio (e.g., "linktr.ee/creator")';
COMMENT ON COLUMN creator_index.email IS 'Contact email address';
COMMENT ON COLUMN creator_index.past_ad_placements IS 'Array of past brand collaborations and ad placements';

-- Update the updated_at trigger to include new columns
CREATE OR REPLACE FUNCTION update_creator_index_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_creator_index_updated_at_trigger ON creator_index;

-- Recreate trigger
CREATE TRIGGER update_creator_index_updated_at_trigger
    BEFORE UPDATE ON creator_index
    FOR EACH ROW
    EXECUTE FUNCTION update_creator_index_updated_at();

-- Grant necessary permissions (adjust as needed for your RLS setup)
-- Note: These permissions should align with your existing RLS policies

-- Example RLS policy for the new columns (adjust based on your existing policies)
-- This assumes you have existing RLS policies on creator_index
-- If you need to add new policies, uncomment and modify as needed:

/*
-- Example policy for authenticated users to read creator_index
CREATE POLICY "Allow authenticated users to read creator_index" ON creator_index
    FOR SELECT
    TO authenticated
    USING (true);

-- Example policy for service role to manage creator_index
CREATE POLICY "Allow service role to manage creator_index" ON creator_index
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
*/ 