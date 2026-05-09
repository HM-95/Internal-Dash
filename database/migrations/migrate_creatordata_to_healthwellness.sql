-- Migration script to transfer data from creatordata to healthwellness table
-- This script maps general creator data to health/wellness focused fields

-- First, let's create a mapping function for wellness niches
CREATE OR REPLACE FUNCTION map_to_wellness_niche(original_niche TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Map general niches to health/wellness specific niches
  CASE 
    WHEN original_niche ILIKE '%fitness%' OR original_niche ILIKE '%workout%' OR original_niche ILIKE '%gym%' OR original_niche ILIKE '%exercise%' THEN 'fitness'
    WHEN original_niche ILIKE '%nutrition%' OR original_niche ILIKE '%diet%' OR original_niche ILIKE '%food%' OR original_niche ILIKE '%healthy%' THEN 'nutrition'
    WHEN original_niche ILIKE '%mental%' OR original_niche ILIKE '%therapy%' OR original_niche ILIKE '%mindfulness%' OR original_niche ILIKE '%wellness%' THEN 'mental_health'
    WHEN original_niche ILIKE '%yoga%' OR original_niche ILIKE '%meditation%' OR original_niche ILIKE '%mindfulness%' THEN 'yoga'
    WHEN original_niche ILIKE '%sport%' OR original_niche ILIKE '%athlete%' OR original_niche ILIKE '%training%' THEN 'sports'
    WHEN original_niche ILIKE '%lifestyle%' OR original_niche ILIKE '%wellness%' OR original_niche ILIKE '%health%' THEN 'wellness_lifestyle'
    WHEN original_niche ILIKE '%business%' OR original_niche ILIKE '%entrepreneur%' THEN 'wellness_business'
    WHEN original_niche ILIKE '%recovery%' OR original_niche ILIKE '%rehab%' THEN 'recovery'
    ELSE 'wellness_lifestyle' -- Default fallback
  END;
END;
$$ LANGUAGE plpgsql;

-- Create wellness specialties based on original niches and content
CREATE OR REPLACE FUNCTION extract_wellness_specialties(original_niche TEXT, bio TEXT, hashtags TEXT[])
RETURNS TEXT[] AS $$
DECLARE
  specialties TEXT[] := '{}';
BEGIN
  -- Extract specialties based on niche and bio content
  IF original_niche ILIKE '%fitness%' OR bio ILIKE '%workout%' OR bio ILIKE '%gym%' THEN
    specialties := specialties || 'weight_loss';
    specialties := specialties || 'muscle_building';
  END IF;
  
  IF original_niche ILIKE '%nutrition%' OR bio ILIKE '%nutrition%' OR bio ILIKE '%diet%' THEN
    specialties := specialties || 'meal_planning';
    specialties := specialties || 'nutrition_education';
  END IF;
  
  IF original_niche ILIKE '%mental%' OR bio ILIKE '%mental%' OR bio ILIKE '%therapy%' THEN
    specialties := specialties || 'stress_management';
    specialties := specialties || 'mindfulness';
  END IF;
  
  IF original_niche ILIKE '%yoga%' OR bio ILIKE '%yoga%' THEN
    specialties := specialties || 'flexibility';
    specialties := specialties || 'mind_body_connection';
  END IF;
  
  -- If no specific specialties found, add general wellness
  IF array_length(specialties, 1) IS NULL THEN
    specialties := ARRAY['general_wellness'];
  END IF;
  
  RETURN specialties;
END;
$$ LANGUAGE plpgsql;

-- Create health credentials based on bio and content
CREATE OR REPLACE FUNCTION extract_health_credentials(bio TEXT, hashtags TEXT[])
RETURNS TEXT[] AS $$
DECLARE
  credentials TEXT[] := '{}';
BEGIN
  -- Look for credential indicators in bio
  IF bio ILIKE '%certified%' OR bio ILIKE '%certification%' THEN
    credentials := credentials || 'certified_trainer';
  END IF;
  
  IF bio ILIKE '%nutritionist%' OR bio ILIKE '%dietitian%' THEN
    credentials := credentials || 'nutritionist';
  END IF;
  
  IF bio ILIKE '%yoga%' AND (bio ILIKE '%instructor%' OR bio ILIKE '%teacher%') THEN
    credentials := credentials || 'yoga_instructor';
  END IF;
  
  IF bio ILIKE '%therapist%' OR bio ILIKE '%counselor%' THEN
    credentials := credentials || 'therapist';
  END IF;
  
  IF bio ILIKE '%doctor%' OR bio ILIKE '%physician%' OR bio ILIKE '%medical%' THEN
    credentials := credentials || 'doctor';
  END IF;
  
  -- If no credentials found, add general wellness practitioner
  IF array_length(credentials, 1) IS NULL THEN
    credentials := ARRAY['wellness_practitioner'];
  END IF;
  
  RETURN credentials;
END;
$$ LANGUAGE plpgsql;

-- Create content themes based on hashtags and bio
CREATE OR REPLACE FUNCTION extract_content_themes(hashtags TEXT[], bio TEXT)
RETURNS TEXT[] AS $$
DECLARE
  themes TEXT[] := '{}';
BEGIN
  -- Analyze hashtags for content themes
  IF 'workout' = ANY(hashtags) OR 'fitness' = ANY(hashtags) OR 'exercise' = ANY(hashtags) THEN
    themes := themes || 'workout_routines';
  END IF;
  
  IF 'nutrition' = ANY(hashtags) OR 'healthy' = ANY(hashtags) OR 'diet' = ANY(hashtags) THEN
    themes := themes || 'nutrition_tips';
  END IF;
  
  IF 'mental' = ANY(hashtags) OR 'mindfulness' = ANY(hashtags) OR 'wellness' = ANY(hashtags) THEN
    themes := themes || 'mental_health';
  END IF;
  
  IF 'recovery' = ANY(hashtags) OR 'rest' = ANY(hashtags) THEN
    themes := themes || 'recovery';
  END IF;
  
  IF 'motivation' = ANY(hashtags) OR 'inspiration' = ANY(hashtags) THEN
    themes := themes || 'motivation';
  END IF;
  
  -- If no themes found, add general wellness content
  IF array_length(themes, 1) IS NULL THEN
    themes := ARRAY['wellness_education'];
  END IF;
  
  RETURN themes;
END;
$$ LANGUAGE plpgsql;

-- Determine if creator offers services based on bio and links
CREATE OR REPLACE FUNCTION determine_offers_services(bio TEXT, bio_links TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Look for service indicators
  IF bio ILIKE '%coach%' OR bio ILIKE '%consultation%' OR bio ILIKE '%service%' OR 
     bio ILIKE '%training%' OR bio ILIKE '%session%' OR bio ILIKE '%program%' THEN
    RETURN TRUE;
  END IF;
  
  -- Check bio_links for service indicators
  IF bio_links ILIKE '%coach%' OR bio_links ILIKE '%consultation%' OR bio_links ILIKE '%service%' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Extract service types from bio and content
CREATE OR REPLACE FUNCTION extract_service_types(bio TEXT, bio_links TEXT)
RETURNS TEXT[] AS $$
DECLARE
  services TEXT[] := '{}';
BEGIN
  -- Look for specific service types
  IF bio ILIKE '%personal%' AND (bio ILIKE '%train%' OR bio ILIKE '%coach%') THEN
    services := services || 'personal_training';
  END IF;
  
  IF bio ILIKE '%nutrition%' AND (bio ILIKE '%coach%' OR bio ILIKE '%consult%') THEN
    services := services || 'nutrition_coaching';
  END IF;
  
  IF bio ILIKE '%wellness%' AND (bio ILIKE '%consult%' OR bio ILIKE '%coach%') THEN
    services := services || 'wellness_consulting';
  END IF;
  
  IF bio ILIKE '%course%' OR bio ILIKE '%program%' OR bio ILIKE '%class%' THEN
    services := services || 'online_courses';
  END IF;
  
  -- If no specific services found but offers services, add general coaching
  IF array_length(services, 1) IS NULL AND determine_offers_services(bio, bio_links) THEN
    services := ARRAY['wellness_coaching'];
  END IF;
  
  RETURN services;
END;
$$ LANGUAGE plpgsql;

-- Main migration query
INSERT INTO public.healthwellness (
  -- Basic identification (mapped from creatordata)
  uuid,
  handle,
  display_name,
  profile_url,
  profile_image_url,
  bio,
  platform,
  location,
  location_region,
  
  -- Health & Wellness specific mapping
  primary_wellness_niche,
  secondary_wellness_niche,
  wellness_specialties,
  target_audience,
  health_credentials,
  years_experience,
  
  -- Social metrics (direct mapping)
  followers_count,
  followers_change,
  followers_change_type,
  average_views,
  average_views_change,
  average_views_change_type,
  average_comments,
  average_comments_change,
  average_comments_change_type,
  average_likes,
  average_likes_change,
  average_likes_change_type,
  engagement_rate,
  engagement_rate_change,
  engagement_rate_change_type,
  
  -- Health & Wellness specific metrics (calculated)
  wellness_engagement_score,
  content_quality_score,
  credibility_score,
  buzz_score,
  
  -- Content and hashtags (mapped)
  wellness_hashtags,
  content_themes,
  content_frequency,
  
  -- Recent content (mapped)
  recent_wellness_post_1,
  recent_wellness_post_2,
  recent_wellness_post_3,
  recent_wellness_post_4,
  recent_wellness_post_5,
  recent_wellness_post_6,
  recent_wellness_post_7,
  recent_wellness_post_8,
  recent_wellness_post_9,
  recent_wellness_post_10,
  recent_wellness_post_11,
  recent_wellness_post_12,
  
  -- Contact and business info (mapped)
  email,
  bio_links,
  brand_tags,
  paid_ad_placements,
  
  -- Wellness business info (calculated)
  offers_services,
  service_types,
  pricing_range,
  availability,
  
  -- Timestamps
  created_at,
  updated_at
)
SELECT 
  -- Basic identification
  cd.uuid,
  cd.handle,
  cd.display_name,
  cd.profile_url,
  cd.profile_image_url,
  cd.bio,
  cd.platform,
  cd.location,
  cd.location_region,
  
  -- Health & Wellness mapping
  map_to_wellness_niche(cd.primary_niche) as primary_wellness_niche,
  map_to_wellness_niche(cd.secondary_niche) as secondary_wellness_niche,
  extract_wellness_specialties(cd.primary_niche, cd.bio, cd.hashtags) as wellness_specialties,
  CASE 
    WHEN cd.followers_count < 10000 THEN 'beginners'
    WHEN cd.followers_count < 100000 THEN 'intermediate'
    WHEN cd.followers_count < 1000000 THEN 'advanced'
    ELSE 'experts'
  END as target_audience,
  extract_health_credentials(cd.bio, cd.hashtags) as health_credentials,
  NULL as years_experience, -- Will need to be populated manually
  
  -- Social metrics
  cd.followers_count,
  cd.followers_change,
  cd.followers_change_type,
  cd.average_views,
  cd.average_views_change,
  cd.average_views_change_type,
  cd.average_comments,
  cd.average_comments_change,
  cd.average_comments_change_type,
  cd.average_likes,
  cd.average_likes_change,
  cd.average_likes_change_type,
  cd.engagement_rate,
  cd.engagement_rate_change,
  cd.engagement_rate_change_type,
  
  -- Health & Wellness specific metrics (calculated)
  cd.engagement_rate * 1.1 as wellness_engagement_score, -- Boost for wellness content
  CASE 
    WHEN cd.engagement_rate > 0.05 THEN 85.0
    WHEN cd.engagement_rate > 0.03 THEN 75.0
    WHEN cd.engagement_rate > 0.02 THEN 65.0
    ELSE 55.0
  END as content_quality_score,
  CASE 
    WHEN cd.bio ILIKE '%certified%' OR cd.bio ILIKE '%doctor%' OR cd.bio ILIKE '%therapist%' THEN 90.0
    WHEN cd.bio ILIKE '%trainer%' OR cd.bio ILIKE '%coach%' THEN 75.0
    WHEN cd.bio ILIKE '%instructor%' OR cd.bio ILIKE '%teacher%' THEN 70.0
    ELSE 60.0
  END as credibility_score,
  cd.buzz_score,
  
  -- Content mapping
  cd.hashtags as wellness_hashtags,
  extract_content_themes(cd.hashtags, cd.bio) as content_themes,
  'weekly' as content_frequency, -- Default, can be updated
  
  -- Recent content mapping
  cd.recent_post_1 as recent_wellness_post_1,
  cd.recent_post_2 as recent_wellness_post_2,
  cd.recent_post_3 as recent_wellness_post_3,
  cd.recent_post_4 as recent_wellness_post_4,
  cd.recent_post_5 as recent_wellness_post_5,
  cd.recent_post_6 as recent_wellness_post_6,
  cd.recent_post_7 as recent_wellness_post_7,
  cd.recent_post_8 as recent_wellness_post_8,
  cd.recent_post_9 as recent_wellness_post_9,
  cd.recent_post_10 as recent_wellness_post_10,
  cd.recent_post_11 as recent_wellness_post_11,
  cd.recent_post_12 as recent_wellness_post_12,
  
  -- Contact and business
  cd.email,
  cd.bio_links,
  cd.brand_tags,
  cd.paid_ad_placements,
  
  -- Wellness business info
  determine_offers_services(cd.bio, cd.bio_links) as offers_services,
  extract_service_types(cd.bio, cd.bio_links) as service_types,
  CASE 
    WHEN cd.followers_count > 1000000 THEN 'premium'
    WHEN cd.followers_count > 100000 THEN 'mid_range'
    ELSE 'budget'
  END as pricing_range,
  'available' as availability, -- Default, can be updated
  
  -- Timestamps
  cd.created_at,
  NOW() as updated_at
  
FROM public.creatordata cd
WHERE cd.primary_niche IS NOT NULL 
  AND cd.primary_niche != ''
  AND (
    -- Only migrate creators with health/wellness related content
    cd.primary_niche ILIKE '%fitness%' OR
    cd.primary_niche ILIKE '%nutrition%' OR
    cd.primary_niche ILIKE '%health%' OR
    cd.primary_niche ILIKE '%wellness%' OR
    cd.primary_niche ILIKE '%yoga%' OR
    cd.primary_niche ILIKE '%mental%' OR
    cd.primary_niche ILIKE '%sport%' OR
    cd.primary_niche ILIKE '%lifestyle%' OR
    cd.bio ILIKE '%fitness%' OR
    cd.bio ILIKE '%nutrition%' OR
    cd.bio ILIKE '%health%' OR
    cd.bio ILIKE '%wellness%' OR
    cd.bio ILIKE '%yoga%' OR
    cd.bio ILIKE '%mental%' OR
    cd.bio ILIKE '%workout%' OR
    cd.bio ILIKE '%exercise%' OR
    cd.bio ILIKE '%diet%' OR
    cd.bio ILIKE '%therapy%' OR
    cd.bio ILIKE '%mindfulness%' OR
    'fitness' = ANY(cd.hashtags) OR
    'nutrition' = ANY(cd.hashtags) OR
    'health' = ANY(cd.hashtags) OR
    'wellness' = ANY(cd.hashtags) OR
    'yoga' = ANY(cd.hashtags) OR
    'mental' = ANY(cd.hashtags) OR
    'workout' = ANY(cd.hashtags) OR
    'exercise' = ANY(cd.hashtags) OR
    'diet' = ANY(cd.hashtags) OR
    'therapy' = ANY(cd.hashtags) OR
    'mindfulness' = ANY(cd.hashtags)
  );

-- Create healthwellness_index entries for semantic search
INSERT INTO public.healthwellness_index (
  healthwellness_id,
  handle,
  display_name,
  bio,
  primary_wellness_niche,
  secondary_wellness_niche,
  wellness_specialties,
  target_audience,
  followers_count,
  average_views,
  engagement_rate,
  wellness_engagement_score,
  content_quality_score,
  credibility_score,
  buzz_score,
  wellness_hashtags,
  content_themes,
  recent_wellness_content,
  location,
  location_region,
  platform,
  bio_links,
  brand_tags,
  email,
  service_types,
  health_credentials,
  created_at,
  updated_at
)
SELECT 
  hw.id as healthwellness_id,
  hw.handle,
  hw.display_name,
  hw.bio,
  hw.primary_wellness_niche,
  hw.secondary_wellness_niche,
  hw.wellness_specialties,
  hw.target_audience,
  hw.followers_count,
  hw.average_views,
  hw.engagement_rate,
  hw.wellness_engagement_score,
  hw.content_quality_score,
  hw.credibility_score,
  hw.buzz_score,
  hw.wellness_hashtags,
  hw.content_themes,
  -- Combine recent post content for embedding
  COALESCE(
    (hw.recent_wellness_post_1->>'caption'), ''
  ) || ' ' || COALESCE(
    (hw.recent_wellness_post_2->>'caption'), ''
  ) || ' ' || COALESCE(
    (hw.recent_wellness_post_3->>'caption'), ''
  ) as recent_wellness_content,
  hw.location,
  hw.location_region,
  hw.platform,
  hw.bio_links,
  hw.brand_tags,
  hw.email,
  hw.service_types,
  hw.health_credentials,
  hw.created_at,
  hw.updated_at
FROM public.healthwellness hw;

-- Clean up helper functions
DROP FUNCTION IF EXISTS map_to_wellness_niche(TEXT);
DROP FUNCTION IF EXISTS extract_wellness_specialties(TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS extract_health_credentials(TEXT, TEXT[]);
DROP FUNCTION IF EXISTS extract_content_themes(TEXT[], TEXT);
DROP FUNCTION IF EXISTS determine_offers_services(TEXT, TEXT);
DROP FUNCTION IF EXISTS extract_service_types(TEXT, TEXT);

-- Add summary statistics
DO $$
DECLARE
  total_creators INTEGER;
  migrated_creators INTEGER;
  index_entries INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_creators FROM public.creatordata;
  SELECT COUNT(*) INTO migrated_creators FROM public.healthwellness;
  SELECT COUNT(*) INTO index_entries FROM public.healthwellness_index;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Total creators in creatordata: %', total_creators;
  RAISE NOTICE 'Creators migrated to healthwellness: %', migrated_creators;
  RAISE NOTICE 'Index entries created: %', index_entries;
  RAISE NOTICE 'Migration percentage: %', ROUND((migrated_creators::DECIMAL / total_creators::DECIMAL) * 100, 2);
END $$;
