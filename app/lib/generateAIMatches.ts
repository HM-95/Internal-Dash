/**
 * Server-side AI match generation utility
 * Used by webhooks and other server-side functions to generate AI matches for users
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AIMatch {
  creator_id: string;
  match_score: number;
  match_explanation: string;
  selected_niches: string[];
  target_audience_description?: string;
}

// Helper functions (copied from api/ai-matches/route.ts)
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

  // 4. Buzz Score bonus (up to 10 additional points)
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

/**
 * Generate AI matches for a specific user
 * This function can be called from server-side contexts like webhooks
 */
export async function generateAIMatchesForUser(userId: string, supabaseInstance?: any): Promise<boolean> {
  try {
    // Use provided supabase instance or create a new one
    const supabase = supabaseInstance || createRouteHandlerClient({ cookies });
    
    console.log('🔍 Generating AI matches for user:', userId);

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('selected_niches, target_audience_description')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences || !preferences.selected_niches || preferences.selected_niches.length === 0) {
      console.error('❌ User preferences not found or incomplete for user:', userId, prefError);
      return false;
    }

    const { selected_niches, target_audience_description } = preferences;
    console.log('✅ User preferences found:', { selected_niches, target_audience_description });

    // Clear existing AI matches for this user
    const { error: deleteError } = await supabase
      .from('ai_matches')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('❌ Error clearing existing AI matches:', deleteError);
    }

    // Fetch creators that match user's selected niches - PRIORITIZE PRIMARY NICHE
    console.log('🔍 Querying creators with niches:', selected_niches);
    
    // First priority: Exact primary niche matches (most relevant)
    // INCREASED LIMIT to check more of the database for better matches
    const { data: primaryMatches, error: primaryError } = await supabase
      .from('healthwellness')
      .select('*')
      .in('primary_wellness_niche', selected_niches)
      .order('followers_count', { ascending: false })
      .limit(800); // Increased from 300 to 800 to check more creators
    
    if (primaryError) {
      console.error('❌ Error querying primary niche creators:', primaryError);
      return false;
    }
    
    console.log(`🎯 Found ${primaryMatches?.length || 0} primary niche matches`);
    
    // Second priority: Secondary niche matches (only if we need more)
    let secondaryMatches: any[] = [];
    if ((primaryMatches?.length || 0) < 300) { // Increased threshold from 100 to 300
      const { data: secondary, error: secondaryError } = await supabase
        .from('healthwellness')
        .select('*')
        .in('secondary_wellness_niche', selected_niches)
        .not('primary_wellness_niche', 'in', `(${selected_niches.join(',')})`) // Exclude already matched primary niches
        .order('followers_count', { ascending: false })
        .limit(400); // Increased from 200 to 400 for better coverage
      
      if (!secondaryError && secondary) {
        secondaryMatches = secondary;
        console.log(`📈 Found ${secondary.length} additional secondary niche matches`);
      }
    }
    
    // Combine with primary matches taking priority
    const creators = [...(primaryMatches || []), ...secondaryMatches];

    if (!creators || creators.length === 0) {
      console.error('❌ No creators found for selected niches:', selected_niches);
      return false;
    }

    console.log(`✅ Found ${creators.length} creators for AI matching`);

    // Calculate match scores and generate AI matches
    const aiMatches: AIMatch[] = [];
    let highScoreMatches = 0;
    
    for (const creator of creators) {
      const matchScore = calculatePersonalizedMatchScore(creator, selected_niches, target_audience_description);
      
      // Prioritize creators by niche relevance and quality
      const primaryNiche = creator.primary_niche;
      const secondaryNiche = creator.secondary_niche;
      const hasExactPrimaryNiche = primaryNiche && selected_niches.includes(primaryNiche);
      const hasExactSecondaryNiche = secondaryNiche && selected_niches.includes(secondaryNiche);
      
      // Clean match score - round to whole number to avoid decimals
      const cleanMatchScore = Math.round(matchScore);
      
      // Strict matching criteria for better relevance
      let shouldInclude = false;
      
      if (hasExactPrimaryNiche) {
        // Primary niche match - align with discover page thresholds
        shouldInclude = cleanMatchScore >= 50;
      } else if (hasExactSecondaryNiche) {
        // Secondary niche match - align with discover page thresholds
        shouldInclude = cleanMatchScore >= 55;
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

    // If no high-quality matches, try with lower threshold
    if (aiMatches.length === 0) {
      console.warn('⚠️ No high-quality matches found, trying with lower threshold...');
      
      for (const creator of creators.slice(0, 100)) {
        const matchScore = calculatePersonalizedMatchScore(creator, selected_niches, target_audience_description);
        const cleanMatchScore = Math.round(matchScore);
        
        // Fallback: Only include creators with some niche relevance
        const primaryNiche = creator.primary_niche;
        const secondaryNiche = creator.secondary_niche;
        const hasAnyNicheMatch = (primaryNiche && selected_niches.includes(primaryNiche)) || 
                               (secondaryNiche && selected_niches.includes(secondaryNiche));
        
        // Lower threshold for fallback but still require niche relevance - align with discover page
        if (hasAnyNicheMatch && cleanMatchScore >= 40) {
          aiMatches.push({
            creator_id: creator.id.toString(),
            match_score: cleanMatchScore, // Clean whole number
            match_explanation: generateMatchExplanation(creator, selected_niches, target_audience_description),
            selected_niches,
            target_audience_description
          });
        }
      }
    }

    if (aiMatches.length === 0) {
      console.error('❌ No matches found even with lower threshold');
      return false;
    }

    // Sort by match score - store ALL qualifying matches like discover page
    aiMatches.sort((a, b) => b.match_score - a.match_score);
    const topMatches = aiMatches; // Store all matches, not just top 100

    // Store AI matches in database
    const matchesToInsert = topMatches.map(match => ({
      ...match,
      user_id: userId
    }));

    const { error: insertError } = await supabase
      .from('ai_matches')
      .insert(matchesToInsert);

    if (insertError) {
      console.error('❌ Error inserting AI matches:', insertError);
      return false;
    }

    console.log(`✅ Successfully stored ${topMatches.length} AI matches for user ${userId}`);
    return true;

  } catch (error) {
    console.error('❌ Error generating AI matches for user:', userId, error);
    return false;
  }
}
