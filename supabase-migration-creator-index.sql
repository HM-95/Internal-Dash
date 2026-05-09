-- Migration: Create creator_index table for semantic search
-- This table is optimized for fast filtering and AI-enhanced matching

-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the creator_index table
CREATE TABLE IF NOT EXISTS creator_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic creator information
    handle VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    primary_niche VARCHAR(100),
    secondary_niche VARCHAR(100),
    
    -- Metrics
    followers_count INTEGER DEFAULT 0,
    average_views INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0,
    buzz_score INTEGER DEFAULT 0,
    
    -- Content and tags
    hashtags TEXT[] DEFAULT '{}',
    engagement_rate_change DECIMAL(5,2) DEFAULT 0,
    followers_change DECIMAL(5,2) DEFAULT 0,
    average_views_change DECIMAL(5,2) DEFAULT 0,
    recent_post_captions TEXT,
    
    -- Embeddings for semantic search
    bio_embedding VECTOR(1536),
    hashtags_embedding VECTOR(1536),
    recent_content_embedding VECTOR(1536),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key reference to original creatordata
    creator_id INTEGER REFERENCES creatordata(id) ON DELETE CASCADE
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_creator_index_handle ON creator_index(handle);
CREATE INDEX IF NOT EXISTS idx_creator_index_primary_niche ON creator_index(primary_niche);
CREATE INDEX IF NOT EXISTS idx_creator_index_secondary_niche ON creator_index(secondary_niche);
CREATE INDEX IF NOT EXISTS idx_creator_index_followers_count ON creator_index(followers_count);
CREATE INDEX IF NOT EXISTS idx_creator_index_engagement_rate ON creator_index(engagement_rate);
CREATE INDEX IF NOT EXISTS idx_creator_index_buzz_score ON creator_index(buzz_score);
CREATE INDEX IF NOT EXISTS idx_creator_index_creator_id ON creator_index(creator_id);

-- Create vector indexes for semantic search
CREATE INDEX IF NOT EXISTS idx_creator_index_bio_embedding ON creator_index USING ivfflat (bio_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_creator_index_hashtags_embedding ON creator_index USING ivfflat (hashtags_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_creator_index_recent_content_embedding ON creator_index USING ivfflat (recent_content_embedding vector_cosine_ops) WITH (lists = 100);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_creator_index_niche_followers ON creator_index(primary_niche, followers_count);
CREATE INDEX IF NOT EXISTS idx_creator_index_niche_engagement ON creator_index(primary_niche, engagement_rate);
CREATE INDEX IF NOT EXISTS idx_creator_index_followers_engagement ON creator_index(followers_count, engagement_rate);

-- Create GIN index for hashtags array
CREATE INDEX IF NOT EXISTS idx_creator_index_hashtags_gin ON creator_index USING GIN (hashtags);

-- Add RLS policies (if needed)
ALTER TABLE creator_index ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read creator_index
CREATE POLICY "Allow authenticated users to read creator_index" ON creator_index
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow service role to manage creator_index
CREATE POLICY "Allow service role to manage creator_index" ON creator_index
    FOR ALL USING (auth.role() = 'service_role');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_creator_index_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_creator_index_updated_at
    BEFORE UPDATE ON creator_index
    FOR EACH ROW
    EXECUTE FUNCTION update_creator_index_updated_at();

-- Add comments for documentation
COMMENT ON TABLE creator_index IS 'Optimized table for semantic search and AI-enhanced creator matching';
COMMENT ON COLUMN creator_index.bio_embedding IS 'Vector embedding of creator bio for semantic search';
COMMENT ON COLUMN creator_index.hashtags_embedding IS 'Vector embedding of hashtags for semantic search';
COMMENT ON COLUMN creator_index.recent_content_embedding IS 'Vector embedding of recent post captions for semantic search';
COMMENT ON COLUMN creator_index.recent_post_captions IS 'Concatenated captions from recent posts 1-3';
COMMENT ON COLUMN creator_index.creator_id IS 'Foreign key reference to original creatordata table'; 