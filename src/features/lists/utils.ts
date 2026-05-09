// Keep this file focused on small helpers used in MyListsPage. The overlay uses its own local type.

export function formatNumberShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toString();
}

export function average<T>(items: T[], get: (t: T) => number): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((s, it) => s + get(it), 0);
  return sum / items.length;
}

export function clampPercent(p: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, p));
}

// Extraction functions to handle Supabase JSONB fields (same logic as main app)
function extractAverageLikes(averageLikesData: any): number {
  if (typeof averageLikesData === 'object' && averageLikesData !== null) {
    // Handle case where it's an object with avg_value
    if (averageLikesData.avg_value !== undefined) {
      return averageLikesData.avg_value;
    }
    // Handle case where it's an object with average_likes property
    if (averageLikesData.average_likes !== undefined) {
      return averageLikesData.average_likes;
    }
  }
  // Handle case where it's a direct number
  return averageLikesData || 0;
}

function extractAverageComments(averageCommentsData: any): number {
  if (typeof averageCommentsData === 'object' && averageCommentsData !== null) {
    // Handle case where it's an object with avg_value
    if (averageCommentsData.avg_value !== undefined) {
      return averageCommentsData.avg_value;
    }
    // Handle case where it's an object with average_comments property
    if (averageCommentsData.average_comments !== undefined) {
      return averageCommentsData.average_comments;
    }
  }
  // Handle case where it's a direct number
  return averageCommentsData || 0;
}

// Helper function to extract static thumbnail from video URL
function extractStaticThumbnail(videoUrl: string): string {
  if (!videoUrl) return '';
  
  // TikTok video URL pattern - extract thumbnail
  if (videoUrl.includes('tiktok.com') || videoUrl.includes('tiktokcdn.com')) {
    // For TikTok, try to convert video URL to thumbnail URL
    if (videoUrl.includes('.mp4')) {
      return videoUrl.replace('.mp4', '.jpeg').replace('/video/', '/thumb/');
    }
  }
  
  // For other platforms, return the video URL as fallback
  return videoUrl;
}

export function mapCreatorToOverlay(c: any) {
  const handle = String(c.handle ?? c.username ?? '').replace(/^@+/, '');
  
  // Use extraction functions to properly handle Supabase JSONB fields
  const avgLikes = c.avg_likes ?? extractAverageLikes(c.average_likes);
  const avgComments = c.avg_comments ?? extractAverageComments(c.average_comments);
  
  // Extract thumbnails from recent_post fields
  const validThumbnails = [];
  const validShareUrls = [];
  
  // Process posts to extract thumbnails (max 4 for UI)
  for (let i = 1; i <= 12 && validThumbnails.length < 4; i++) {
    let post = c[`recent_post_${i}`];
    if (post) {
      // Handle case where post might be a JSON string
      if (typeof post === 'string') {
        const trimmed = post.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            post = JSON.parse(trimmed);
          } catch (_e) {
            // Failed to parse post - skip this post
            continue;
          }
        } else {
          // Not JSON structure we can parse - skip
          continue;
        }
      }
      
      // Prefer media_urls[0] if available (Instagram), else fallback to video_url
      let thumbnailUrl = '';
      if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
        thumbnailUrl = post.media_urls[0];
        // Clean up URL if it ends with '?'
        if (thumbnailUrl && thumbnailUrl.endsWith('?')) {
          thumbnailUrl = thumbnailUrl.slice(0, -1);
        }
      } else if (typeof post.media_urls === 'string' && post.media_urls.trim()) {
        // Handle case where media_urls is a single URL string
        thumbnailUrl = post.media_urls.trim();
        // Clean up URL if it ends with '?'
        if (thumbnailUrl && thumbnailUrl.endsWith('?')) {
          thumbnailUrl = thumbnailUrl.slice(0, -1);
        }
      } else if (post.video_url) {
        thumbnailUrl = extractStaticThumbnail(post.video_url);
      }
      
      // Only add valid thumbnails (skip empty media_urls)
      if (thumbnailUrl) {
        validThumbnails.push(thumbnailUrl);
        
        // Extract share URL for TikTok posts
        if (c.platform?.toLowerCase() === 'tiktok' && post.share_url) {
          validShareUrls.push(post.share_url);
        } else {
          validShareUrls.push(''); // Empty string for non-TikTok posts
        }
      }
    }
  }
  
  // Fill remaining slots with placeholder thumbnails if needed
  const placeholderThumbnails = [
    '/images/PostThumbnail-1.svg',
    '/images/PostThumbnail-2.svg',
    '/images/PostThumbnail-3.svg',
    '/images/PostThumbnail.svg',
  ];
  
  while (validThumbnails.length < 4) {
    validThumbnails.push(placeholderThumbnails[validThumbnails.length] || '/images/PostThumbnail.svg');
  }
  
  while (validShareUrls.length < 4) {
    validShareUrls.push('');
  }
  
  return {
    username: String(c.display_name ?? c.username ?? 'Creator Name'),
    username_tag: `@${handle}`,
    profile_pic: c.profile_image_url ?? undefined,
    email: c.email ?? undefined,
    location: c.location ?? undefined,
    bio: c.bio ?? 'This is a placeholder bio for the creator.',
    social_media: [{ platform: String(c.platform ?? 'instagram'), url: c.profile_url ?? undefined }],
    niches: [
      ...(c.primary_niche ? [{ name: String(c.primary_niche), type: 'primary' as const }] : []),
      ...(c.secondary_niche ? [{ name: String(c.secondary_niche), type: 'secondary' as const }] : []),
    ],
    followers: Number(c.followers_count ?? 0),
    followers_change: Number(c.follower_change ?? c.followers_change ?? 0),
    avg_views: Number(c.average_views ?? 0),
    avg_views_change: Number(c.views_change ?? c.average_views_change ?? 0),
    engagement: Number(c.engagement_rate ?? 0),
    engagement_change: Number(c.engagement_change ?? c.engagement_rate_change ?? 0),
    avg_likes: Number(avgLikes),
    avg_likes_change: Number(c.avg_likes_change ?? c.average_likes_change ?? 0),
    avg_comments: Number(avgComments),
    avg_comments_change: Number(c.avg_comments_change ?? c.average_comments_change ?? 0),
    buzz_score: Number(c.buzz_score ?? 75),
    hashtags: c.hashtags ?? ['#tech', '#growth', '#startup', '#innovation'],
    expanded_thumbnails: validThumbnails,
    share_urls: validShareUrls.filter(Boolean),
    // Talent network specific fields
    price: c.price ?? null,
    status: c.status ?? 'No reply',
    channel: c.channel ?? null,
    what_do_you_post: c.what_do_you_post ?? null,
    note: c.note ?? null,
    creator_id: c.id, // Store original creator ID for updates
  };
}


