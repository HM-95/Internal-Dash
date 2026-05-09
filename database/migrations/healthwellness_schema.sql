-- Health & Wellness Creator Data Schema
-- Migration from creatordata to healthwellness table for health/wellness focused platform

-- Create healthwellness table with health/wellness specific fields
CREATE TABLE IF NOT EXISTS public.healthwellness (
  -- Basic identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uuid VARCHAR(255) UNIQUE,
  handle VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  profile_url TEXT,
  profile_image_url TEXT,
  bio TEXT,
  
  -- Platform and location
  platform VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  location_region VARCHAR(255),
  
  -- Health & Wellness specific niches
  primary_wellness_niche VARCHAR(100) NOT NULL, -- 'fitness', 'nutrition', 'mental_health', 'yoga', 'meditation', 'wellness_lifestyle', 'holistic_health', 'sports', 'recovery', 'wellness_business'
  secondary_wellness_niche VARCHAR(100), -- Additional wellness focus
  wellness_specialties TEXT[], -- Array of specific specialties like ['weight_loss', 'muscle_building', 'stress_management']
  target_audience VARCHAR(255), -- 'beginners', 'intermediate', 'advanced', 'seniors', 'athletes', 'busy_professionals'
  
  -- Health credentials and certifications
  health_credentials TEXT[], -- ['certified_trainer', 'nutritionist', 'yoga_instructor', 'therapist', 'doctor']
  certifications TEXT[], -- Specific certifications
  years_experience INTEGER, -- Years in health/wellness field
  
  -- Social metrics (same as before)
  followers_count INTEGER DEFAULT 0,
  followers_change DECIMAL(5,2) DEFAULT 0,
  followers_change_type VARCHAR(20) DEFAULT 'neutral',
  average_views INTEGER DEFAULT 0,
  average_views_change DECIMAL(5,2) DEFAULT 0,
  average_views_change_type VARCHAR(20) DEFAULT 'neutral',
  average_comments INTEGER DEFAULT 0,
  average_comments_change DECIMAL(5,2) DEFAULT 0,
  average_comments_change_type VARCHAR(20) DEFAULT 'neutral',
  average_likes JSONB, -- Store likes data as JSONB
  average_likes_change DECIMAL(5,2) DEFAULT 0,
  average_likes_change_type VARCHAR(20) DEFAULT 'neutral',
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  engagement_rate_change DECIMAL(5,2) DEFAULT 0,
  engagement_rate_change_type VARCHAR(20) DEFAULT 'neutral',
  
  -- Health & Wellness specific metrics
  wellness_engagement_score DECIMAL(5,2) DEFAULT 0, -- Specialized engagement for health content
  content_quality_score DECIMAL(5,2) DEFAULT 0, -- Quality of health advice/education
  credibility_score DECIMAL(5,2) DEFAULT 0, -- Based on credentials and content accuracy
  buzz_score INTEGER DEFAULT 0, -- Overall platform buzz score
  
  -- Content and hashtags
  wellness_hashtags TEXT[], -- Health/wellness specific hashtags
  content_themes TEXT[], -- ['workout_routines', 'nutrition_tips', 'mental_health', 'recovery', 'motivation']
  content_frequency VARCHAR(50), -- 'daily', 'weekly', 'bi_weekly', 'monthly'
  
  -- Recent content (health focused)
  recent_wellness_post_1 JSONB,
  recent_wellness_post_2 JSONB,
  recent_wellness_post_3 JSONB,
  recent_wellness_post_4 JSONB,
  recent_wellness_post_5 JSONB,
  recent_wellness_post_6 JSONB,
  recent_wellness_post_7 JSONB,
  recent_wellness_post_8 JSONB,
  recent_wellness_post_9 JSONB,
  recent_wellness_post_10 JSONB,
  recent_wellness_post_11 JSONB,
  recent_wellness_post_12 JSONB,
  
  -- Contact and business info
  email VARCHAR(255),
  bio_links TEXT, -- Wellness-related links
  brand_tags TEXT, -- Health/wellness brand partnerships
  paid_ad_placements BOOLEAN DEFAULT FALSE,
  
  -- Wellness business info
  offers_services BOOLEAN DEFAULT FALSE, -- Does creator offer wellness services
  service_types TEXT[], -- ['personal_training', 'nutrition_coaching', 'wellness_consulting', 'online_courses']
  pricing_range VARCHAR(50), -- 'budget', 'mid_range', 'premium', 'luxury'
  availability VARCHAR(50), -- 'available', 'limited', 'waitlist', 'not_available'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_healthwellness_handle ON public.healthwellness(handle);
CREATE INDEX IF NOT EXISTS idx_healthwellness_platform ON public.healthwellness(platform);
CREATE INDEX IF NOT EXISTS idx_healthwellness_primary_wellness_niche ON public.healthwellness(primary_wellness_niche);
CREATE INDEX IF NOT EXISTS idx_healthwellness_secondary_wellness_niche ON public.healthwellness(secondary_wellness_niche);
CREATE INDEX IF NOT EXISTS idx_healthwellness_wellness_specialties ON public.healthwellness USING GIN(wellness_specialties);
CREATE INDEX IF NOT EXISTS idx_healthwellness_wellness_hashtags ON public.healthwellness USING GIN(wellness_hashtags);
CREATE INDEX IF NOT EXISTS idx_healthwellness_content_themes ON public.healthwellness USING GIN(content_themes);
CREATE INDEX IF NOT EXISTS idx_healthwellness_followers_count ON public.healthwellness(followers_count);
CREATE INDEX IF NOT EXISTS idx_healthwellness_engagement_rate ON public.healthwellness(engagement_rate);
CREATE INDEX IF NOT EXISTS idx_healthwellness_buzz_score ON public.healthwellness(buzz_score);
CREATE INDEX IF NOT EXISTS idx_healthwellness_wellness_engagement_score ON public.healthwellness(wellness_engagement_score);
CREATE INDEX IF NOT EXISTS idx_healthwellness_content_quality_score ON public.healthwellness(content_quality_score);
CREATE INDEX IF NOT EXISTS idx_healthwellness_credibility_score ON public.healthwellness(credibility_score);
CREATE INDEX IF NOT EXISTS idx_healthwellness_location ON public.healthwellness(location);
CREATE INDEX IF NOT EXISTS idx_healthwellness_location_region ON public.healthwellness(location_region);
CREATE INDEX IF NOT EXISTS idx_healthwellness_offers_services ON public.healthwellness(offers_services);
CREATE INDEX IF NOT EXISTS idx_healthwellness_service_types ON public.healthwellness USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_healthwellness_health_credentials ON public.healthwellness USING GIN(health_credentials);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_healthwellness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_healthwellness_updated_at
  BEFORE UPDATE ON public.healthwellness
  FOR EACH ROW
  EXECUTE FUNCTION update_healthwellness_updated_at();

-- Enable RLS
ALTER TABLE public.healthwellness ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (service role only for now, can be updated later)
CREATE POLICY IF NOT EXISTS "Service role can manage healthwellness" ON public.healthwellness
  FOR ALL USING (auth.role() = 'service_role');

-- Create healthwellness_index table for semantic search (similar to creator_index)
CREATE TABLE IF NOT EXISTS public.healthwellness_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  healthwellness_id UUID REFERENCES public.healthwellness(id) ON DELETE CASCADE,
  
  -- Basic info for search
  handle VARCHAR(255),
  display_name VARCHAR(255),
  bio TEXT,
  primary_wellness_niche VARCHAR(100),
  secondary_wellness_niche VARCHAR(100),
  wellness_specialties TEXT[],
  target_audience VARCHAR(255),
  
  -- Metrics
  followers_count INTEGER,
  average_views INTEGER,
  engagement_rate DECIMAL(5,4),
  wellness_engagement_score DECIMAL(5,2),
  content_quality_score DECIMAL(5,2),
  credibility_score DECIMAL(5,2),
  buzz_score INTEGER,
  
  -- Content for embeddings
  wellness_hashtags TEXT[],
  content_themes TEXT[],
  recent_wellness_content TEXT, -- Combined recent post captions
  
  -- Embeddings for semantic search
  bio_embedding VECTOR(1536),
  wellness_hashtags_embedding VECTOR(1536),
  recent_content_embedding VECTOR(1536),
  
  -- Location and platform
  location TEXT,
  location_region TEXT,
  platform TEXT,
  
  -- Business info
  bio_links TEXT,
  brand_tags TEXT,
  email TEXT,
  service_types TEXT[],
  health_credentials TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for healthwellness_index
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_healthwellness_id ON public.healthwellness_index(healthwellness_id);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_primary_wellness_niche ON public.healthwellness_index(primary_wellness_niche);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_secondary_wellness_niche ON public.healthwellness_index(secondary_wellness_niche);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_wellness_specialties ON public.healthwellness_index USING GIN(wellness_specialties);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_wellness_hashtags ON public.healthwellness_index USING GIN(wellness_hashtags);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_content_themes ON public.healthwellness_index USING GIN(content_themes);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_service_types ON public.healthwellness_index USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_health_credentials ON public.healthwellness_index USING GIN(health_credentials);

-- Vector indexes for semantic search
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_bio_embedding ON public.healthwellness_index USING ivfflat (bio_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_hashtags_embedding ON public.healthwellness_index USING ivfflat (wellness_hashtags_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_healthwellness_index_content_embedding ON public.healthwellness_index USING ivfflat (recent_content_embedding vector_cosine_ops) WITH (lists = 100);

-- Create updated_at trigger for healthwellness_index
CREATE TRIGGER trigger_update_healthwellness_index_updated_at
  BEFORE UPDATE ON public.healthwellness_index
  FOR EACH ROW
  EXECUTE FUNCTION update_healthwellness_updated_at();

-- Enable RLS for healthwellness_index
ALTER TABLE public.healthwellness_index ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for healthwellness_index
CREATE POLICY IF NOT EXISTS "Service role can manage healthwellness_index" ON public.healthwellness_index
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE public.healthwellness IS 'Health and wellness focused creator data for specialized platform';
COMMENT ON COLUMN public.healthwellness.primary_wellness_niche IS 'Main wellness focus area (fitness, nutrition, mental_health, etc.)';
COMMENT ON COLUMN public.healthwellness.wellness_specialties IS 'Specific wellness specialties and expertise areas';
COMMENT ON COLUMN public.healthwellness.health_credentials IS 'Professional health and wellness credentials';
COMMENT ON COLUMN public.healthwellness.wellness_engagement_score IS 'Specialized engagement score for health/wellness content';
COMMENT ON COLUMN public.healthwellness.content_quality_score IS 'Quality score for health advice and educational content';
COMMENT ON COLUMN public.healthwellness.credibility_score IS 'Credibility score based on credentials and content accuracy';
COMMENT ON COLUMN public.healthwellness.service_types IS 'Types of wellness services offered by creator';
