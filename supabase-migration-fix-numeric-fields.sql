-- Migration: Fix numeric field precision issues in creator_index table
-- This migration updates field types to handle larger numbers

-- Check current table structure
-- The error suggests DECIMAL(5,2) fields are too small for the data

-- Update numeric fields to handle larger values
ALTER TABLE creator_index 
ALTER COLUMN engagement_rate TYPE DECIMAL(8,4), -- Allow values up to 9999.9999
ALTER COLUMN engagement_rate_change TYPE DECIMAL(8,2), -- Allow values up to 999999.99
ALTER COLUMN followers_change TYPE DECIMAL(10,2), -- Allow values up to 99999999.99
ALTER COLUMN average_views_change TYPE DECIMAL(12,2); -- Allow values up to 9999999999.99

-- Also ensure other numeric fields are properly sized
ALTER TABLE creator_index 
ALTER COLUMN followers_count TYPE BIGINT, -- Allow larger follower counts
ALTER COLUMN average_views TYPE BIGINT, -- Allow larger view counts
ALTER COLUMN buzz_score TYPE INTEGER; -- Keep as integer

-- Add comments for documentation
COMMENT ON COLUMN creator_index.engagement_rate IS 'Engagement rate as percentage (e.g., 9.9 for 9.9%) - DECIMAL(8,4)';
COMMENT ON COLUMN creator_index.engagement_rate_change IS 'Change in engagement rate - DECIMAL(8,2)';
COMMENT ON COLUMN creator_index.followers_change IS 'Change in follower count - DECIMAL(10,2)';
COMMENT ON COLUMN creator_index.average_views_change IS 'Change in average views - DECIMAL(12,2)';
COMMENT ON COLUMN creator_index.followers_count IS 'Total follower count - BIGINT';
COMMENT ON COLUMN creator_index.average_views IS 'Average views per post - BIGINT';
COMMENT ON COLUMN creator_index.buzz_score IS 'Buzz score - INTEGER'; 