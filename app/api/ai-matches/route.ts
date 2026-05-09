import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AIMatch {
  creator_id: string;
  match_score: number;
  match_explanation: string;
  selected_niches: string[];
  target_audience_description?: string;
}

// POST: Generate and store new AI matches for user
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Generating AI matches for user:', user.id);

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('selected_niches, target_audience_description')
      .eq('user_id', user.id)
      .single();

    console.log('🔍 User preferences query result:', { 
      preferences, 
      prefError, 
      user_id: user.id 
    });

    if (prefError) {
      console.error('❌ Error fetching user preferences:', prefError);
      return NextResponse.json({ 
        error: 'Failed to fetch user preferences', 
        details: prefError.message 
      }, { status: 500 });
    }

    if (!preferences) {
      console.error('❌ No user preferences found for user:', user.id);
      return NextResponse.json({ 
        error: 'User preferences not found - user may not have completed onboarding' 
      }, { status: 400 });
    }

    if (!preferences.selected_niches || preferences.selected_niches.length === 0) {
      console.error('❌ User has no selected niches:', preferences);
      return NextResponse.json({ 
        error: 'User has no selected niches - onboarding incomplete' 
      }, { status: 400 });
    }

    const { selected_niches, target_audience_description } = preferences;
    console.log('✅ User preferences valid:', { 
      selected_niches, 
      target_audience_description,
      niches_count: selected_niches.length 
    });

    // First, clear existing AI matches for this user
    const { error: deleteError } = await supabase
      .from('ai_matches')
      .delete()
      .eq('user_id', user.id);
    
    // Check if table doesn't exist
    if (deleteError && deleteError.message?.includes('relation "ai_matches" does not exist')) {
      console.error('❌ AI matches table does not exist in database!');
      return NextResponse.json({ 
        error: 'AI matches table not found. Please run the migration: database/migrations/create_ai_matches_table.sql',
        code: 'TABLE_NOT_FOUND'
      }, { status: 500 });
    } else if (deleteError) {
      console.error('Error clearing existing AI matches:', deleteError);
      throw deleteError;
    }

    // Extract follower range from target audience if specified
    const followerRange = extractFollowerRange(target_audience_description || '');
    console.log('🎯 Follower range extracted:', followerRange);
    
    // Fetch creators that match user's selected niches - PRIORITIZE PRIMARY NICHE
    console.log('🔍 Querying creators with niches:', selected_niches);
    
    // First priority: Exact primary wellness niche matches (most relevant)
    // PROCESS ALL CREATORS - No limits for comprehensive matching
    let primaryQuery = supabase
      .from('healthwellness')
      .select('*')
      .in('primary_wellness_niche', selected_niches);
    
    // Apply follower range filter if specified
    if (followerRange) {
      primaryQuery = primaryQuery
        .gte('followers_count', followerRange.min)
        .lte('followers_count', followerRange.max);
    }
    
    const { data: primaryMatches, error: primaryError } = await primaryQuery
      .order('followers_count', { ascending: false });
      // REMOVED LIMIT: Process ALL primary niche matches in database
    
    if (primaryError) {
      console.error('❌ Error querying primary niche creators:', primaryError);
      throw primaryError;
    }
    
    console.log(`🎯 Found ${primaryMatches?.length || 0} primary niche matches`);
    
    // Second priority: Secondary wellness niche matches (always fetch for comprehensive coverage)
    let secondaryMatches: any[] = [];
    // REMOVED THRESHOLD: Always fetch secondary matches for complete coverage
    let secondaryQuery = supabase
      .from('healthwellness')
      .select('*')
      .in('secondary_wellness_niche', selected_niches)
      .not('primary_wellness_niche', 'in', `(${selected_niches.join(',')})`);
    
    // Apply follower range filter if specified
    if (followerRange) {
      secondaryQuery = secondaryQuery
        .gte('followers_count', followerRange.min)
        .lte('followers_count', followerRange.max);
    }
    
    const { data: secondary, error: secondaryError } = await secondaryQuery // Exclude already matched primary niches
      .order('followers_count', { ascending: false });
      // REMOVED LIMIT: Process ALL secondary niche matches in database
      
    if (!secondaryError && secondary) {
      secondaryMatches = secondary;
      console.log(`📈 Found ${secondary.length} additional secondary niche matches`);
    }
    
    // Combine with primary matches taking priority
    let creators = [...(primaryMatches || []), ...secondaryMatches];

    // Third priority: High-quality creators for comprehensive matching
    // REMOVED THRESHOLD: Always fetch high-quality creators for complete coverage
    console.log(`🔍 Found ${creators.length} niche matches, adding high-quality creators for comprehensive coverage...`);
    
    const { data: broadMatches, error: broadError } = await supabase
      .from('healthwellness')
      .select('*')
      .order('buzz_score', { ascending: false }); // Order by buzz_score for quality
      // REMOVED LIMIT: Process ALL creators for comprehensive matching
      
      if (!broadError && broadMatches) {
        // Filter out creators we already have and ones that might be relevant
        const existingIds = new Set(creators.map(c => c.id));
        const additionalCreators = broadMatches.filter(creator => 
          !existingIds.has(creator.id) && 
          (creator.buzz_score >= 70 || creator.followers_count >= 50000) // High quality creators
        );
        
        console.log(`📈 Found ${additionalCreators.length} additional high-quality creators from broad search`);
        creators = [...creators, ...additionalCreators];
      }

    console.log(`🔍 Total creator query result: ${creators?.length || 0} creators found`);

    if (!creators || creators.length === 0) {
      console.error('❌ No creators found for selected niches:', selected_niches);
      console.log('💡 Suggestion: Check if these niches exist in creatordata table:');
      console.log('   - primary_niche values:', selected_niches);
      return NextResponse.json({ 
        error: 'No creators found for selected niches',
        searched_niches: selected_niches,
        suggestion: 'Check if these niches exist in your creator database'
      }, { status: 404 });
    }

    console.log(`✅ Found ${creators.length} creators for AI matching with niches:`, selected_niches);
    
    // Debug: Show sample of found creators and their niches
    if (creators.length > 0) {
      const sampleCreators = creators.slice(0, 5);
      console.log('🔍 Sample creators found:');
      sampleCreators.forEach(creator => {
        console.log(`  - ${creator.display_name || creator.handle}: primary="${creator.primary_niche}", secondary="${creator.secondary_niche}"`);
      });
    }

    // Calculate match scores and generate AI matches
    const aiMatches: AIMatch[] = [];
    let totalCreatorsProcessed = 0;
    let highScoreMatches = 0;
    
    console.log('🎯 Calculating match scores for creators...');
    
    for (const creator of creators) {
      totalCreatorsProcessed++;
      const matchScore = calculatePersonalizedMatchScore(creator, selected_niches, target_audience_description);
      
      // Prioritize creators by niche relevance and quality
      const primaryNiche = creator.primary_niche;
      const secondaryNiche = creator.secondary_niche;
      const hasExactPrimaryNiche = primaryNiche && selected_niches.includes(primaryNiche);
      const hasExactSecondaryNiche = secondaryNiche && selected_niches.includes(secondaryNiche);
      
      // Clean match score - round to whole number to avoid decimals
      const cleanMatchScore = Math.round(matchScore);
      
      // More relaxed matching criteria for better coverage
      let shouldInclude = false;
      
      if (hasExactPrimaryNiche) {
        // Primary niche match - very relaxed threshold for maximum matches
        shouldInclude = cleanMatchScore >= 50; // Lowered from 70 to 50
      } else if (hasExactSecondaryNiche) {
        // Secondary niche match - relaxed threshold
        shouldInclude = cleanMatchScore >= 55; // Lowered from 75 to 55
      }
      
      if (shouldInclude) {
        highScoreMatches++;
        aiMatches.push({
          creator_id: creator.id.toString(),
          match_score: cleanMatchScore, // Clean whole number
          match_explanation: generateMatchExplanation(creator, selected_niches, target_audience_description),
          selected_niches,
          target_audience_description
        });
      }
    }

    console.log(`🎯 Match scoring results:`, {
      total_creators_processed: totalCreatorsProcessed,
      high_score_matches: highScoreMatches,
      match_threshold: 'exactNiche ≥75 OR anyMatch ≥80'
    });

    // Sort by match score
    aiMatches.sort((a, b) => b.match_score - a.match_score);

    // Store ALL qualifying matches - no artificial limits
    // Filter by minimum score threshold to ensure quality (lowered for better coverage)
    const qualifyingMatches = aiMatches.filter(match => match.match_score >= 50); // Lowered from 70 to 50 for more matches
    console.log(`✅ Generated ${qualifyingMatches.length} qualifying AI matches (score ≥50) from ${aiMatches.length} total processed`);

    // Store AI matches in database
    if (qualifyingMatches.length > 0) {
      const matchesToInsert = qualifyingMatches.map(match => ({
        ...match,
        user_id: user.id
      }));

      const { error: insertError } = await supabase
        .from('ai_matches')
        .insert(matchesToInsert);

      if (insertError) {
        console.error('❌ Error inserting AI matches:', insertError);
        throw insertError;
      }
      
      console.log(`✅ Successfully stored ${qualifyingMatches.length} AI matches for user ${user.id}`);
      
      return NextResponse.json({
        success: true,
        matches_generated: qualifyingMatches.length,
        message: `Generated ${qualifyingMatches.length} personalized creator matches`
      });
    } else {
      // No high-quality matches found - let's try with lower threshold
      console.warn('⚠️ No high-quality matches found, trying with lower threshold...');
      
      const lowerThresholdMatches: AIMatch[] = [];
      
      for (const creator of creators) { // Process ALL creators for comprehensive fallback matching
        const matchScore = calculatePersonalizedMatchScore(creator, selected_niches, target_audience_description);
        const cleanMatchScore = Math.round(matchScore);
        
        // Fallback: Only include creators with some niche relevance
        const primaryNiche = creator.primary_niche;
        const secondaryNiche = creator.secondary_niche;
        const hasAnyNicheMatch = (primaryNiche && selected_niches.includes(primaryNiche)) || 
                               (secondaryNiche && selected_niches.includes(secondaryNiche));
        
        // Lower threshold for fallback but still require niche relevance
        if (hasAnyNicheMatch && cleanMatchScore >= 60) {
          lowerThresholdMatches.push({
            creator_id: creator.id.toString(),
            match_score: cleanMatchScore, // Clean whole number
            match_explanation: generateMatchExplanation(creator, selected_niches, target_audience_description),
            selected_niches,
            target_audience_description
          });
        }
      }
      
      if (lowerThresholdMatches.length > 0) {
        // Sort and store ALL qualifying fallback matches
        lowerThresholdMatches.sort((a, b) => b.match_score - a.match_score);
        // REMOVED SLICE LIMIT: Store all qualifying fallback matches
        const fallbackMatches = lowerThresholdMatches.filter(match => match.match_score >= 40); // Much lower threshold for fallback
        
        const matchesToInsert = fallbackMatches.map(match => ({
          ...match,
          user_id: user.id
        }));

        const { error: insertError } = await supabase
          .from('ai_matches')
          .insert(matchesToInsert);

        if (insertError) {
          console.error('❌ Error inserting fallback AI matches:', insertError);
          throw insertError;
        }
        
        console.log(`✅ Stored ${fallbackMatches.length} fallback AI matches (score ≥40)`);
        
        return NextResponse.json({
          success: true,
          matches_generated: fallbackMatches.length,
          message: `Generated ${fallbackMatches.length} creator matches (relaxed criteria)`,
          fallback: true
        });
      } else {
        console.error('❌ No matches found even with lower threshold');
        return NextResponse.json({
          error: 'No suitable creator matches found for your preferences',
          searched_niches: selected_niches,
          total_creators_analyzed: totalCreatorsProcessed,
          suggestion: 'Try selecting different niches or check if creators exist for your selected categories'
        }, { status: 404 });
      }
    }

  } catch (error) {
    console.error('Error generating AI matches:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI matches' },
      { status: 500 }
    );
  }
}

// GET: Retrieve stored AI matches for user
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;

    // First, get the total count of AI matches for this user
    // IMPORTANT: Use exact same query as fetchAIMetrics to ensure consistency
    console.log(`🔍 Getting total AI matches count for user ${user.id}...`);
    
    const { count: totalCount, error: countError } = await supabase
      .from('ai_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    console.log(`🔍 Raw count query result: count=${totalCount}, error=${countError?.message || 'none'}`);
    
    if (countError) {
      console.error('❌ Error counting AI matches:', countError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: countError.message,
        code: countError.code || 'COUNT_QUERY_FAILED'
      }, { status: 500 });
    }
    
    console.log(`📊 User ${user.id} has ${totalCount || 0} total AI matches`);
    console.log(`🔍 Request params: page=${page}, limit=${limit}, startIndex=${startIndex}, endIndex=${endIndex}`);
    console.log(`🔍 Count query details: user_id=${user.id}, totalCount=${totalCount}`);
    console.log(`🚨 DEBUGGING: If totalCount=${totalCount} but frontend expects 473, there's a count query mismatch!`);
    
    if (!totalCount || totalCount === 0) {
      console.log('⚠️ No AI matches found for user, returning empty result');
      return NextResponse.json({
        success: true,
        matches: [],
        total_matches: 0,
        page,
        limit,
        has_more: false
      });
    }
    
    // Use fallback method directly for more reliable results
    console.log(`🔍 Fetching AI matches using fallback method for user: ${user.id} (page ${page}, limit ${limit})`);
    console.log(`🔍 Page ${page} debug: startIndex=${startIndex}, endIndex=${endIndex}, limit=${limit}, totalCount=${totalCount}`);
    
    const { data: matchesOnly, error: matchError } = await supabase
      .from('ai_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('match_score', { ascending: false })
      .range(startIndex, endIndex);
    
    if (matchError) {
      console.error('❌ Error fetching AI matches for user:', user.id);
      console.error('❌ Full error details:', matchError);
      return NextResponse.json({ 
        error: 'Database query failed',
        details: matchError.message,
        code: matchError.code || 'MATCHES_QUERY_FAILED'
      }, { status: 500 });
    }
    
    // Get creator data separately for each match to ensure we get all available data
    console.log(`📋 Fetching creator data separately for ${matchesOnly?.length || 0} matches...`);
    const enrichedMatches = [];
    
    for (const match of matchesOnly || []) {
      // Try multiple approaches to find creator data (handle type mismatches)
      let creatorData = null;
      
      // First try: exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('healthwellness')
        .select('*')
        .eq('id', match.creator_id)
        .single();
      
      if (!exactError && exactMatch) {
        creatorData = exactMatch;
      } else {
        // Second try: cast as integer (in case creator_id is string but id is integer)
        const numericId = parseInt(match.creator_id);
        if (!isNaN(numericId)) {
          const { data: numericMatch, error: numericError } = await supabase
            .from('healthwellness')
            .select('*')
            .eq('id', numericId)
            .single();
          
          if (!numericError && numericMatch) {
            creatorData = numericMatch;
          }
        }
      }
      
      if (creatorData) {
        enrichedMatches.push({
          ...match,
          creatordata: creatorData
        });
      } else {
        console.warn(`⚠️ Creator data not found for creator_id: ${match.creator_id} (tried both string and numeric matching)`);
      }
    }
    
    console.log(`✅ Successfully enriched ${enrichedMatches.length} out of ${matchesOnly?.length || 0} matches with creator data`);
    
    // If we have fewer enriched matches than expected, we need to get more AI matches to compensate
    const expectedResults = Math.min(limit, (totalCount || 0) - startIndex);
    if (enrichedMatches.length < expectedResults && enrichedMatches.length < limit) {
      console.log(`🔄 Got ${enrichedMatches.length} enriched matches, need ${expectedResults}. Fetching more AI matches...`);
      
      // Calculate how many more we need
      const additionalNeeded = Math.min(expectedResults - enrichedMatches.length, limit - enrichedMatches.length);
      const nextStartIndex = startIndex + (matchesOnly?.length || 0);
      const nextEndIndex = nextStartIndex + additionalNeeded - 1;
      
      // Fetch additional matches
      const { data: additionalMatches, error: additionalError } = await supabase
        .from('ai_matches')
        .select('*')
        .eq('user_id', user.id)
        .order('match_score', { ascending: false })
        .range(nextStartIndex, nextEndIndex);
      
      if (!additionalError && additionalMatches) {
        console.log(`📋 Fetching creator data for ${additionalMatches.length} additional matches...`);
        
        for (const match of additionalMatches) {
          // Same creator data fetching logic
          let creatorData = null;
          
          const { data: exactMatch, error: exactError } = await supabase
            .from('healthwellness')
            .select('*')
            .eq('id', match.creator_id)
            .single();
          
          if (!exactError && exactMatch) {
            creatorData = exactMatch;
          } else {
            const numericId = parseInt(match.creator_id);
            if (!isNaN(numericId)) {
              const { data: numericMatch, error: numericError } = await supabase
                .from('healthwellness')
                .select('*')
                .eq('id', numericId)
                .single();
              
              if (!numericError && numericMatch) {
                creatorData = numericMatch;
              }
            }
          }
          
          if (creatorData) {
            enrichedMatches.push({
              ...match,
              creatordata: creatorData
            });
            
            // Stop if we've reached our limit
            if (enrichedMatches.length >= limit) {
              break;
            }
          }
        }
        
        console.log(`✅ Final result: ${enrichedMatches.length} enriched matches after supplementation`);
      }
    }
    
    return NextResponse.json({
      success: true,
      matches: enrichedMatches,
      total_matches: totalCount || 0,
      page,
      limit,
      has_more: (totalCount || 0) > endIndex + 1,
      matchesCount: enrichedMatches.length
    });



  } catch (error) {
    console.error('Error fetching AI matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI matches' },
      { status: 500 }
    );
  }
}

// Helper functions (from useCreatorData.ts)
function calculatePersonalizedMatchScore(creator: any, userNiches: string[], targetAudience?: string): number {
  let score = 0;
  let maxScore = 0;

  // Extract location preferences and follower range from target audience
  const locationKeywords = extractLocationKeywords(targetAudience || '');
  const followerRange = extractFollowerRange(targetAudience || '');

  // 1. Niche alignment (35% of score - reduced to make room for follower range)
  maxScore += 35;
  const primaryNiche = creator.primary_niche;
  const secondaryNiche = creator.secondary_niche;
  
  if (primaryNiche && userNiches.includes(primaryNiche)) {
    score += 30; // Primary niche match is very important
  } else if (secondaryNiche && userNiches.includes(secondaryNiche)) {
    score += 20; // Secondary niche match is good
  }

  // 2. Location relevance (25% of score - reduced)
  maxScore += 25;
  if (locationKeywords.length > 0 && creator.location) {
    const creatorLocation = creator.location.toLowerCase();
    const hasLocationMatch = locationKeywords.some(keyword => 
      creatorLocation.includes(keyword.toLowerCase())
    );
    if (hasLocationMatch) {
      score += 25; // Perfect location match
    } else {
      score += 3; // Some points for having location data
    }
  } else if (creator.location) {
    score += 8; // Points for having location even if not specified by user
  }
  
  // 3. Follower range match (15% of score - NEW)
  maxScore += 15;
  const followersCount = creator.followers_count || 0;
  if (followerRange) {
    if (followersCount >= followerRange.min && followersCount <= followerRange.max) {
      score += 15; // Perfect match within range
    } else if (followersCount >= followerRange.min * 0.8 && followersCount <= followerRange.max * 1.2) {
      score += 10; // Close to range (within 20%)
    } else if (followersCount >= followerRange.min * 0.5 && followersCount <= followerRange.max * 1.5) {
      score += 5; // Somewhat close to range (within 50%)
    }
  } else {
    // No specific range requested, give some points based on follower tier
    if (followersCount >= 10000 && followersCount <= 500000) {
      score += 8; // Mid-tier influencers (good default)
    } else if (followersCount >= 1000 && followersCount <= 1000000) {
      score += 5; // Broader range
    }
  }

  // 4. Performance metrics (25% of score - reduced from 30%)
  maxScore += 25;
  const engagementRate = creator.engagement_rate || 0;
  const avgViews = creator.average_views || 0;
  
  // Engagement rate scoring (0-10 points)
  if (engagementRate >= 5) score += 10;
  else if (engagementRate >= 3) score += 7;
  else if (engagementRate >= 1) score += 5;
  else score += 2;
  
  // Views scoring (0-15 points)
  if (avgViews >= 1000000) score += 15;      // Viral content creators
  else if (avgViews >= 500000) score += 12;  // Very high performing
  else if (avgViews >= 100000) score += 10;   // High performing  
  else if (avgViews >= 50000) score += 8;    // Good performing
  else if (avgViews >= 10000) score += 5;    // Average performing
  else if (avgViews >= 1000) score += 3;     // Low but visible
  else score += 1;                           // Very low views

  // 5. Buzz Score bonus (up to 10 additional points)
  const buzzScore = creator.buzz_score || 0;
  if (buzzScore >= 90) score += 10;
  else if (buzzScore >= 70) score += 7;
  else if (buzzScore >= 50) score += 5;
  else if (buzzScore >= 30) score += 3;

  // Convert to percentage (0-100)
  return Math.min(100, Math.round((score / maxScore) * 100));
}

function generateMatchExplanation(creator: any, userNiches: string[], targetAudience?: string): string {
  const reasons: string[] = [];
  
  const primaryNiche = creator.primary_niche;
  const secondaryNiche = creator.secondary_niche;
  
  if (primaryNiche && userNiches.includes(primaryNiche)) {
    reasons.push(`Primary niche: ${primaryNiche}`);
  } else if (secondaryNiche && userNiches.includes(secondaryNiche)) {
    reasons.push(`Secondary niche: ${secondaryNiche}`);
  }
  
  const locationKeywords = extractLocationKeywords(targetAudience || '');
  if (locationKeywords.length > 0 && creator.location) {
    const hasLocationMatch = locationKeywords.some(keyword => 
      creator.location.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasLocationMatch) {
      reasons.push(`Location match: ${creator.location}`);
    }
  }
  
  const followerRange = extractFollowerRange(targetAudience || '');
  const followersCount = creator.followers_count || 0;
  if (followerRange && followersCount >= followerRange.min && followersCount <= followerRange.max) {
    reasons.push(`Followers in range: ${(followersCount / 1000).toFixed(0)}k`);
  }
  
  const engagementRate = creator.engagement_rate || 0;
  if (engagementRate >= 3) {
    reasons.push(`High engagement: ${engagementRate.toFixed(1)}%`);
  }
  
  const buzzScore = creator.buzz_score || 0;
  if (buzzScore >= 70) {
    reasons.push(`High Buzz Score: ${buzzScore}%`);
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'Good match based on profile analysis';
}

function extractLocationKeywords(targetAudience: string): string[] {
  if (!targetAudience) return [];
  
  const text = targetAudience.toLowerCase();
  const locationKeywords: string[] = [];
  
  // Region mappings (check these first)
  const regionMappings: { [key: string]: string[] } = {
    'asia': ['asia', 'asian'],
    'europe': ['europe', 'european'],
    'north america': ['north america', 'north american'],
    'south america': ['south america', 'south american'],
    'africa': ['africa', 'african'],
    'middle east': ['middle east', 'middle eastern'],
  };
  
  // Country mappings (expanded for Asia)
  const countryMappings: { [key: string]: string[] } = {
    'united states': ['us', 'usa', 'united states', 'america', 'american', 'states'],
    'canada': ['canada', 'canadian'],
    'united kingdom': ['uk', 'britain', 'british', 'england', 'scotland', 'wales'],
    'australia': ['australia', 'australian', 'aussie'],
    'germany': ['germany', 'german', 'deutschland'],
    'france': ['france', 'french'],
    'italy': ['italy', 'italian'],
    'spain': ['spain', 'spanish'],
    'brazil': ['brazil', 'brazilian'],
    // Asian countries
    'india': ['india', 'indian'],
    'japan': ['japan', 'japanese'],
    'korea': ['korea', 'korean', 'south korea'],
    'china': ['china', 'chinese'],
    'singapore': ['singapore', 'singaporean'],
    'malaysia': ['malaysia', 'malaysian'],
    'thailand': ['thailand', 'thai'],
    'indonesia': ['indonesia', 'indonesian'],
    'philippines': ['philippines', 'filipino'],
    'vietnam': ['vietnam', 'vietnamese'],
    'hong kong': ['hong kong', 'hk'],
    'taiwan': ['taiwan', 'taiwanese'],
    // Other
    'mexico': ['mexico', 'mexican'],
    'netherlands': ['netherlands', 'dutch', 'holland'],
  };
  
  // Asian countries list for region matching
  const asianCountries = ['india', 'japan', 'korea', 'china', 'singapore', 'malaysia', 
                          'thailand', 'indonesia', 'philippines', 'vietnam', 'hong kong', 'taiwan'];

  // City/State mappings
  const cityMappings: { [key: string]: string[] } = {
    'new york': ['new york', 'nyc', 'ny', 'manhattan', 'brooklyn'],
    'los angeles': ['los angeles', 'la', 'california', 'hollywood'],
    'chicago': ['chicago', 'illinois'],
    'miami': ['miami', 'florida'],
    'london': ['london'],
    'paris': ['paris'],
    'toronto': ['toronto'],
    'sydney': ['sydney'],
    'berlin': ['berlin'],
    'tokyo': ['tokyo'],
    'mumbai': ['mumbai', 'bombay'],
    'delhi': ['delhi', 'new delhi'],
    'shanghai': ['shanghai'],
    'beijing': ['beijing'],
    'seoul': ['seoul'],
    'bangkok': ['bangkok'],
    'singapore': ['singapore'],
  };

  // Check for region matches first (e.g., "Asia")
  Object.entries(regionMappings).forEach(([region, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      if (region === 'asia') {
        // If Asia is mentioned, add all Asian countries
        locationKeywords.push(...asianCountries);
      } else {
        locationKeywords.push(region);
      }
    }
  });
  
  // Check for specific location matches
  Object.entries({ ...countryMappings, ...cityMappings }).forEach(([location, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      if (!locationKeywords.includes(location)) {
        locationKeywords.push(location);
      }
    }
  });

  return locationKeywords;
}

// New function to extract follower range from target audience
function extractFollowerRange(targetAudience: string): { min: number; max: number } | null {
  if (!targetAudience) return null;
  
  const text = targetAudience.toLowerCase();
  
  // Look for patterns like "50k to 10M+", "50,000 - 10,000,000", "between 50k and 10M+"
  const patterns = [
    /(\d+)k?\s*(?:to|-|–)\s*(\d+)k?\s*followers/i,
    /between\s*(\d+)k?\s*(?:and|to)\s*(\d+)k?\s*followers/i,
    /(\d+)k?\s*(?:to|-|–)\s*(\d+)k?/i,
    /(\d+),?(\d{3})\s*(?:to|-|–)\s*(\d+),?(\d{3})/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Parse the numbers
      let min = parseInt(match[1]);
      let max = parseInt(match[2] || match[3]);
      
      // Handle 'k' notation
      if (text.includes(`${match[1]}k`)) min *= 1000;
      if (text.includes(`${match[2]}k`) || text.includes(`${match[3]}k`)) max *= 1000;
      
      // Handle comma notation (e.g., "50,000")
      if (match[0].includes(',')) {
        const fullMin = match[0].match(/(\d+),?(\d{3})/)?.[0].replace(',', '');
        const fullMax = match[0].match(/(\d+),?(\d{3})\s*(?:to|-|–)\s*(\d+),?(\d{3})/)?.[3]?.replace(',', '');
        if (fullMin) min = parseInt(fullMin);
        if (fullMax) max = parseInt(fullMax);
      }
      
      return { min, max };
    }
  }
  
  return null;
}
