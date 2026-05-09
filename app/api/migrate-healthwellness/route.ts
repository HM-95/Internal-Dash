import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notFoundUnlessDangerousApiEnabled } from '../../../lib/api-route-guards';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to map niches to wellness niches
function mapToWellnessNiche(originalNiche: string): string {
  const lowerNiche = originalNiche.toLowerCase();
  
  if (lowerNiche.includes('fitness') || lowerNiche.includes('workout') || lowerNiche.includes('gym') || lowerNiche.includes('exercise')) {
    return 'fitness';
  }
  if (lowerNiche.includes('nutrition') || lowerNiche.includes('diet') || lowerNiche.includes('food') || lowerNiche.includes('healthy')) {
    return 'nutrition';
  }
  if (lowerNiche.includes('mental') || lowerNiche.includes('therapy') || lowerNiche.includes('mindfulness') || lowerNiche.includes('wellness')) {
    return 'mental_health';
  }
  if (lowerNiche.includes('yoga') || lowerNiche.includes('meditation')) {
    return 'yoga';
  }
  if (lowerNiche.includes('sport') || lowerNiche.includes('athlete') || lowerNiche.includes('training')) {
    return 'sports';
  }
  if (lowerNiche.includes('lifestyle') || lowerNiche.includes('wellness') || lowerNiche.includes('health')) {
    return 'wellness_lifestyle';
  }
  if (lowerNiche.includes('business') || lowerNiche.includes('entrepreneur')) {
    return 'wellness_business';
  }
  if (lowerNiche.includes('recovery') || lowerNiche.includes('rehab')) {
    return 'recovery';
  }
  
  return 'wellness_lifestyle'; // Default fallback
}

// Helper function to extract wellness specialties
function extractWellnessSpecialties(originalNiche: string, bio: string): string[] {
  const specialties: string[] = [];
  const lowerNiche = originalNiche.toLowerCase();
  const lowerBio = bio.toLowerCase();
  
  if (lowerNiche.includes('fitness') || lowerBio.includes('workout') || lowerBio.includes('gym')) {
    specialties.push('weight_loss', 'muscle_building');
  }
  
  if (lowerNiche.includes('nutrition') || lowerBio.includes('nutrition') || lowerBio.includes('diet')) {
    specialties.push('meal_planning', 'nutrition_education');
  }
  
  if (lowerNiche.includes('mental') || lowerBio.includes('mental') || lowerBio.includes('therapy')) {
    specialties.push('stress_management', 'mindfulness');
  }
  
  if (lowerNiche.includes('yoga') || lowerBio.includes('yoga')) {
    specialties.push('flexibility', 'mind_body_connection');
  }
  
  if (specialties.length === 0) {
    specialties.push('general_wellness');
  }
  
  return specialties;
}

// Helper function to extract health credentials
function extractHealthCredentials(bio: string): string[] {
  const credentials: string[] = [];
  const lowerBio = bio.toLowerCase();
  
  if (lowerBio.includes('certified') || lowerBio.includes('certification')) {
    credentials.push('certified_trainer');
  }
  
  if (lowerBio.includes('nutritionist') || lowerBio.includes('dietitian')) {
    credentials.push('nutritionist');
  }
  
  if (lowerBio.includes('yoga') && (lowerBio.includes('instructor') || lowerBio.includes('teacher'))) {
    credentials.push('yoga_instructor');
  }
  
  if (lowerBio.includes('therapist') || lowerBio.includes('counselor')) {
    credentials.push('therapist');
  }
  
  if (lowerBio.includes('doctor') || lowerBio.includes('physician') || lowerBio.includes('medical')) {
    credentials.push('doctor');
  }
  
  if (credentials.length === 0) {
    credentials.push('wellness_practitioner');
  }
  
  return credentials;
}

export async function POST(request: NextRequest) {
  const blocked = notFoundUnlessDangerousApiEnabled();
  if (blocked) return blocked;

  try {
    console.log('🚀 Starting healthwellness migration...');
    
    // Check if healthwellness table already has data
    const { data: existingData, error: checkError } = await supabase
      .from('healthwellness')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking healthwellness table:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check healthwellness table',
        details: checkError.message 
      }, { status: 500 });
    }
    
    if (existingData && existingData.length > 0) {
      console.log('ℹ️ Healthwellness table already has data, skipping migration');
      return NextResponse.json({ 
        success: true, 
        message: 'Healthwellness table already populated',
        skipped: true 
      });
    }
    
    // Get creators from creatordata that have health/wellness related content
    const { data: creators, error: creatorsError } = await supabase
      .from('creatordata')
      .select('*')
      .not('primary_niche', 'is', null)
      .neq('primary_niche', '')
      .or(`
        primary_niche.ilike.%fitness%,
        primary_niche.ilike.%nutrition%,
        primary_niche.ilike.%health%,
        primary_niche.ilike.%wellness%,
        primary_niche.ilike.%yoga%,
        primary_niche.ilike.%mental%,
        primary_niche.ilike.%sport%,
        primary_niche.ilike.%lifestyle%,
        bio.ilike.%fitness%,
        bio.ilike.%nutrition%,
        bio.ilike.%health%,
        bio.ilike.%wellness%,
        bio.ilike.%yoga%,
        bio.ilike.%mental%,
        bio.ilike.%workout%,
        bio.ilike.%exercise%,
        bio.ilike.%diet%,
        bio.ilike.%therapy%,
        bio.ilike.%mindfulness%
      `);
    
    if (creatorsError) {
      console.error('❌ Error fetching creators:', creatorsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch creators',
        details: creatorsError.message 
      }, { status: 500 });
    }
    
    if (!creators || creators.length === 0) {
      console.log('ℹ️ No health/wellness creators found in creatordata table');
      return NextResponse.json({ 
        success: true, 
        message: 'No health/wellness creators found to migrate',
        statistics: { migratedCount: 0 }
      });
    }
    
    console.log(`📊 Found ${creators.length} health/wellness creators to migrate`);
    
    // Transform and insert creators into healthwellness table
    const healthwellnessCreators = creators.map(creator => ({
      uuid: creator.uuid,
      handle: creator.handle,
      display_name: creator.display_name,
      profile_url: creator.profile_url,
      profile_image_url: creator.profile_image_url,
      bio: creator.bio,
      platform: creator.platform,
      location: creator.location,
      location_region: creator.location_region,
      
      // Health & Wellness mapping
      primary_wellness_niche: mapToWellnessNiche(creator.primary_niche),
      secondary_niche: creator.secondary_niche ? mapToWellnessNiche(creator.secondary_niche) : null,
      wellness_specialties: extractWellnessSpecialties(creator.primary_niche, creator.bio || ''),
      target_audience: creator.followers_count < 10000 ? 'beginners' : 
                      creator.followers_count < 100000 ? 'intermediate' : 
                      creator.followers_count < 1000000 ? 'advanced' : 'experts',
      health_credentials: extractHealthCredentials(creator.bio || ''),
      years_experience: null,
      
      // Social metrics
      followers_count: creator.followers_count,
      followers_change: creator.followers_change,
      followers_change_type: creator.followers_change_type,
      average_views: creator.average_views,
      average_views_change: creator.average_views_change,
      average_views_change_type: creator.average_views_change_type,
      average_comments: creator.average_comments,
      average_comments_change: creator.average_comments_change,
      average_comments_change_type: creator.average_comments_change_type,
      average_likes: creator.average_likes,
      average_likes_change: creator.average_likes_change,
      average_likes_change_type: creator.average_likes_change_type,
      engagement_rate: creator.engagement_rate,
      engagement_rate_change: creator.engagement_rate_change,
      engagement_rate_change_type: creator.engagement_rate_change_type,
      
      // Health & Wellness specific metrics
      wellness_engagement_score: creator.engagement_rate * 1.1,
      content_quality_score: creator.engagement_rate > 0.05 ? 85.0 : 
                            creator.engagement_rate > 0.03 ? 75.0 : 
                            creator.engagement_rate > 0.02 ? 65.0 : 55.0,
      credibility_score: (creator.bio || '').toLowerCase().includes('certified') || 
                        (creator.bio || '').toLowerCase().includes('doctor') || 
                        (creator.bio || '').toLowerCase().includes('therapist') ? 90.0 :
                        (creator.bio || '').toLowerCase().includes('trainer') || 
                        (creator.bio || '').toLowerCase().includes('coach') ? 75.0 :
                        (creator.bio || '').toLowerCase().includes('instructor') || 
                        (creator.bio || '').toLowerCase().includes('teacher') ? 70.0 : 60.0,
      buzz_score: creator.buzz_score,
      
      // Content mapping
      wellness_hashtags: creator.hashtags,
      content_themes: ['wellness_education'], // Default
      content_frequency: 'weekly',
      
      // Recent content mapping
      recent_wellness_post_1: creator.recent_post_1,
      recent_wellness_post_2: creator.recent_post_2,
      recent_wellness_post_3: creator.recent_post_3,
      recent_wellness_post_4: creator.recent_post_4,
      recent_wellness_post_5: creator.recent_post_5,
      recent_wellness_post_6: creator.recent_post_6,
      recent_wellness_post_7: creator.recent_post_7,
      recent_wellness_post_8: creator.recent_post_8,
      recent_wellness_post_9: creator.recent_post_9,
      recent_wellness_post_10: creator.recent_post_10,
      recent_wellness_post_11: creator.recent_post_11,
      recent_wellness_post_12: creator.recent_post_12,
      
      // Contact and business
      email: creator.email,
      bio_links: creator.bio_links,
      brand_tags: creator.brand_tags,
      paid_ad_placements: creator.paid_ad_placements,
      
      // Wellness business info
      offers_services: (creator.bio || '').toLowerCase().includes('coach') || 
                      (creator.bio || '').toLowerCase().includes('consultation') || 
                      (creator.bio || '').toLowerCase().includes('service') || 
                      (creator.bio || '').toLowerCase().includes('training') || 
                      (creator.bio || '').toLowerCase().includes('session') || 
                      (creator.bio || '').toLowerCase().includes('program'),
      service_types: ['wellness_coaching'], // Default
      pricing_range: creator.followers_count > 1000000 ? 'premium' : 
                    creator.followers_count > 100000 ? 'mid_range' : 'budget',
      availability: 'available',
      
      // Timestamps
      created_at: creator.created_at,
      updated_at: new Date().toISOString()
    }));
    
    // Insert into healthwellness table
    const { data: insertedData, error: insertError } = await supabase
      .from('healthwellness')
      .insert(healthwellnessCreators);
    
    if (insertError) {
      console.error('❌ Error inserting into healthwellness table:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to insert into healthwellness table',
        details: insertError.message 
      }, { status: 500 });
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Get final statistics
    const { data: healthwellnessCount } = await supabase
      .from('healthwellness')
      .select('*', { count: 'exact', head: true });
    
    const { data: creatordataCount } = await supabase
      .from('creatordata')
      .select('*', { count: 'exact', head: true });
    
    // Check for secondary niches
    const { data: nichesData } = await supabase
      .from('healthwellness')
      .select('secondary_niche')
      .not('secondary_niche', 'is', null)
      .limit(10);
    
    console.log('📊 Migration Statistics:');
    console.log(`   Creators migrated to healthwellness: ${healthwellnessCount?.length || 0}`);
    console.log(`   Creators in creatordata table: ${creatordataCount?.length || 0}`);
    
    return NextResponse.json({
      success: true,
      message: 'Healthwellness migration completed successfully!',
      statistics: {
        migratedCount: healthwellnessCount?.length || 0,
        creatordataCount: creatordataCount?.length || 0,
        sampleNiches: nichesData?.map(creator => creator.secondary_niche) || []
      }
    });
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
