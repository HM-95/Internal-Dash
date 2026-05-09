// Helper function to determine niche type
function getNicheType(niche: string): string {
  const nicheLower = niche.toLowerCase();
  if (nicheLower.includes('crypto') || nicheLower.includes('bitcoin') || nicheLower.includes('ethereum')) {
    return 'crypto';
  }
  if (nicheLower.includes('finance') || nicheLower.includes('financial')) {
    return 'finance';
  }
  if (nicheLower.includes('invest') || nicheLower.includes('investment')) {
    return 'investing';
  }
  if (nicheLower.includes('tech') || nicheLower.includes('technology')) {
    return 'technology';
  }
  if (nicheLower.includes('trading') || nicheLower.includes('trade')) {
    return 'trading';
  }
  if (nicheLower.includes('stock') || nicheLower.includes('market')) {
    return 'stock';
  }
  if (nicheLower.includes('personal')) {
    return 'personal';
  }
  return 'general';
}

// Helper function to determine change type
function getChangeType(change: number): string {
  if (!change || change === 0) return 'zero';
  return change > 0 ? 'positive' : 'negative';
}

export function transformCreatorData(creator: any) {
  // Extract platform from various possible fields
  const platform = creator.platform || creator.platform_type || 'instagram';
  
  // Create social media array with proper platform detection
  const socialMedia = [{
    platform: platform.toLowerCase(),
    url: creator.profile_url || creator.url || ''
  }];

  // Generate initials from name
  const name = creator.display_name || creator.name || creator.handle || 'Unknown';
  const initials = name
    .split(' ')
    .map((word: string) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Transform niches data - ensure we always have categories
  const niches = [];
  
  // Add primary niche if it exists - this should be blue (finance/investing)
  if (creator.primary_niche) {
    niches.push({
      name: creator.primary_niche,
      type: getNicheType(creator.primary_niche),
      isPrimary: true
    });
  }
  
  // Add secondary niche if it exists and is different - this should be yellow/orange (crypto)
  if (creator.secondary_niche && creator.secondary_niche !== creator.primary_niche) {
    niches.push({
      name: creator.secondary_niche,
      type: getNicheType(creator.secondary_niche),
      isPrimary: false
    });
  }

  // If no niches found, add a default one based on the data
  if (niches.length === 0) {
    // Try to infer from bio or other fields
    const bio = creator.bio || '';
    const handle = creator.handle || '';
    const displayName = creator.display_name || '';
    
    if (bio.toLowerCase().includes('crypto') || handle.toLowerCase().includes('crypto') || displayName.toLowerCase().includes('crypto')) {
      niches.push({ name: 'Crypto', type: 'crypto', isPrimary: false });
    } else if (bio.toLowerCase().includes('finance') || bio.toLowerCase().includes('invest')) {
      niches.push({ name: 'Finance', type: 'finance', isPrimary: true });
    } else if (bio.toLowerCase().includes('trading') || bio.toLowerCase().includes('trade')) {
      niches.push({ name: 'Trading', type: 'trading', isPrimary: true });
    } else {
      niches.push({ name: 'General', type: 'general', isPrimary: true });
    }
  }

  // Fix avatar URL mapping - try multiple possible fields and pick the first valid URL string
  const possibleAvatarFields = [
    creator.profile_picture_url,
    creator.profile_image_url,
    creator.avatar_url,
    creator.profile_pic,
    creator.image_url,
    creator.avatar,
    creator.profile_picture,
    creator.avatarUrl,
    creator.profileImageUrl,
  ];
  let avatarUrl = possibleAvatarFields.find((v: any) => typeof v === 'string' && v.startsWith('http')) || null;
  // Try unavatar based on platform + handle
  if (!avatarUrl && creator.handle) {
    const platform = (creator.platform || creator.platform_type || '').toLowerCase();
    const cleanHandle = String(creator.handle).replace(/^@/, '');
    if (platform === 'instagram' || platform === 'tiktok' || platform === 'twitter' || platform === 'x' || platform === 'youtube') {
      const provider = platform === 'x' ? 'twitter' : platform;
      avatarUrl = `https://unavatar.io/${provider}/${encodeURIComponent(cleanHandle)}`;
    } else {
      avatarUrl = `https://unavatar.io/${encodeURIComponent(cleanHandle)}`;
    }
  }
  // Final fallback to initials-based avatar
  if (!avatarUrl) {
    const fallbackName = (creator.display_name || creator.name || creator.handle || 'U').toString();
    avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=1f2937&color=ffffff&bold=true&size=64`;
  }

  return {
    id: creator.id || creator.handle,
    name: creator.display_name || creator.name || creator.handle,
    username_tag: `@${creator.handle}`,
    avatar_url: avatarUrl,
    bio: creator.bio || '',
    initials,
    social_media: socialMedia,
    followers: creator.followers_count || creator.followers || 0,
    followers_change: creator.followers_change || 0,
    followers_change_type: getChangeType(creator.followers_change),
    avg_views: creator.average_views || creator.avg_views || 0,
    avg_views_change: creator.average_views_change || creator.avg_views_change || 0,
    avg_views_change_type: getChangeType(creator.average_views_change),
    engagement_rate: creator.engagement_rate || 0,
    engagement_change: creator.engagement_rate_change || 0,
    engagement_change_type: getChangeType(creator.engagement_rate_change),
    niches,
    location: creator.location_region || creator.location || 'Unknown',
    buzz_score: creator.buzz_score || 0,
    match_score: creator.match_score || 0,
    email: creator.email || ''
  };
} 