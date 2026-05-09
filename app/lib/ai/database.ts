import { createClient } from '@supabase/supabase-js';
import type { 
  ChatSession, 
  ChatMessage, 
  AISystemPrompt, 
  ChatSessionSettings,
  InfluencerSearchFilters,
  InfluencerStats
} from './types'

// Create a Supabase client for server-side operations using service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Chat Session Functions
export async function createChatSession(
  userId: string, 
  title: string, 
  subtitle: string = '',
  supabaseClient?: any
): Promise<ChatSession | null> {
  try {
    console.log('Creating chat session:', { userId, title, subtitle });
    
    const client = supabaseClient || supabase;
    
    // Use direct insert with service role key to bypass all RLS issues
    const { data, error } = await client
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title,
        subtitle
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating chat session:', error);
      throw error;
    }
    
    console.log('Chat session created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    return null;
  }
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

export async function updateChatSession(
  sessionId: string, 
  updates: Partial<Pick<ChatSession, 'title' | 'subtitle' | 'is_active'>>,
  supabaseClient?: any
): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    
    const { error } = await client
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating chat session:', error);
    return false;
  }
}

export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
}

export async function createChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  supabaseClient?: any
): Promise<ChatMessage | null> {
  try {
    console.log('Creating chat message:', { sessionId, role, contentLength: content.length });
    
    const client = supabaseClient || supabase;
    
    // Use direct insert with service role key to bypass all RLS and schema issues
    const { data, error } = await client
      .from('chat_messages')
      .insert({
        chat_session_id: sessionId,
        role,
        content
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating chat message:', error);
      throw error;
    }
    
    console.log('Chat message created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating chat message:', error);
    return null;
  }
}

export async function getChatMessages(sessionId: string, limit: number = 50, supabaseClient?: any): Promise<ChatMessage[]> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
}

// AI System Prompt Functions
export async function getSystemPrompts(): Promise<AISystemPrompt[]> {
  try {
    const { data, error } = await supabase
      .from('ai_system_prompts')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return [];
  }
}

export async function getSystemPromptByName(name: string): Promise<AISystemPrompt | null> {
  try {
    const { data, error } = await supabase
      .from('ai_system_prompts')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return null;
  }
}

// Chat Session Settings Functions
export async function getChatSessionSettings(sessionId: string): Promise<ChatSessionSettings | null> {
  try {
    const { data, error } = await supabase
      .from('chat_session_settings')
      .select('*')
      .eq('chat_session_id', sessionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat session settings:', error);
    return null;
  }
}

export async function updateChatSessionSettings(
  sessionId: string,
  settings: Partial<ChatSessionSettings>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_session_settings')
      .upsert({
        chat_session_id: sessionId,
        ...settings
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating chat session settings:', error);
    return false;
  }
}

// Influencer Database Functions (from existing database.ts)
export async function getInfluencerStats(): Promise<InfluencerStats> {
  try {
    const { data, error } = await supabase
      .from('creator_index')
      .select('*');

    if (error) throw error;

    const creators = data || [];
    const total = creators.length;
    
    const platforms = Array.from(new Set(creators.map(c => c.platform))).filter(Boolean) as string[];
    const niches = Array.from(new Set(creators.map(c => c.primary_niche).filter(Boolean))).slice(0, 20) as string[];
    
    const avgEngagement = creators.length > 0 
      ? creators.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / creators.length 
      : 0;
    
    const avgFollowers = creators.length > 0 
      ? creators.reduce((sum, c) => sum + (c.followers_count || 0), 0) / creators.length 
      : 0;
    
    const avgViews = creators.length > 0 
      ? creators.reduce((sum, c) => sum + (c.average_views || 0), 0) / creators.length 
      : 0;
    
    const totalViews = creators.reduce((sum, c) => sum + (c.average_views || 0), 0);
    
    const platformCounts = creators.reduce((acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPlatform = Object.entries(platformCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Unknown';
    
    const nicheCounts = creators.reduce((acc, c) => {
      acc[c.primary_niche] = (acc[c.primary_niche] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topNiche = Object.entries(nicheCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Unknown';

    return {
      total,
      platforms,
      niches,
      avgEngagement,
      avgFollowers,
      avgViews,
      totalViews,
      topPlatform,
      topNiche
    };
  } catch (error) {
    console.error('Error getting influencer stats:', error);
    return {
      total: 0,
      platforms: [],
      niches: [],
      avgEngagement: 0,
      avgFollowers: 0,
      avgViews: 0,
      totalViews: 0,
      topPlatform: 'Unknown',
      topNiche: 'Unknown'
    };
  }
}

export async function searchInfluencers(
  query: string,
  filters: InfluencerSearchFilters,
  limit: number = 20
): Promise<any[]> {
  try {
    let queryBuilder = supabase
      .from('creator_index')
      .select('*');

    if (query && query.trim()) {
      // Only allow alphanumeric, space, and underscore in search term
      const searchTerm = query.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, '');
      const cleanHandle = searchTerm.replace('@', '');
      // Only search on a few key fields, and never pass the full prompt
      queryBuilder = queryBuilder.or(
        `handle.ilike.%${cleanHandle}%,display_name.ilike.%${searchTerm}%,primary_niche.ilike.%${searchTerm}%,secondary_niche.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,location_region.ilike.%${searchTerm}%`
      );
    }

    if (filters.platform) {
      queryBuilder = queryBuilder.eq('platform', filters.platform);
    }
    if (filters.primary_niche) {
      queryBuilder = queryBuilder.ilike('primary_niche', `%${filters.primary_niche}%`);
    }
    if (filters.min_followers) {
      queryBuilder = queryBuilder.gte('followers_count', filters.min_followers);
    }
    if (filters.max_followers) {
      queryBuilder = queryBuilder.lte('followers_count', filters.max_followers);
    }
    if (filters.min_engagement_rate) {
      queryBuilder = queryBuilder.gte('engagement_rate', filters.min_engagement_rate);
    }
    if (filters.location) {
      queryBuilder = queryBuilder.or(`location.ilike.%${filters.location}%,location_region.ilike.%${filters.location}%`);
    }
    if (filters.hashtags && filters.hashtags.length > 0) {
      const hashtagConditions = filters.hashtags.map(tag => `hashtags.cs.{${tag}}`).join(',');
      queryBuilder = queryBuilder.or(hashtagConditions);
    }

    queryBuilder = queryBuilder.order('engagement_rate', { ascending: false });
    queryBuilder = queryBuilder.order('followers_count', { ascending: false });
    queryBuilder = queryBuilder.limit(limit);

    const { data, error } = await queryBuilder;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching influencers:', error);
    return [];
  }
}

export async function getInfluencerByHandle(handle: string): Promise<any | null> {
  try {
    const cleanHandle = handle.replace('@', '');
    
    const { data, error } = await supabase
      .from('creator_index')
      .select('*')
      .eq('handle', cleanHandle)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting influencer by handle:', error);
    return null;
  }
} 

export async function smartInfluencerSearch(
  userQuery: string,
  filters: InfluencerSearchFilters = {},
  limit: number = 20,
  page: number = 1,
  supabaseClient?: any
): Promise<{
  data: any[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  try {
    // Extract meaningful keywords from userQuery
    const keywords = userQuery
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'will', 'want', 'need', 'find', 'show', 'get', 'see', 'look'].includes(word));

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Use passed client or fall back to global client
    const client = supabaseClient || supabase;
    
    let queryBuilder = client
      .from('creator_index')
      .select('*', { count: 'exact' }); // Get total count for pagination

    // Use a more efficient search approach
    if (keywords.length > 0) {
      // Take the most relevant keywords (first 3)
      const searchTerms = keywords.slice(0, 3);
      const conditions = [];
      
      for (const term of searchTerms) {
        conditions.push(`handle.ilike.%${term}%`);
        conditions.push(`display_name.ilike.%${term}%`);
        conditions.push(`primary_niche.ilike.%${term}%`);
        conditions.push(`secondary_niche.ilike.%${term}%`);
        conditions.push(`bio.ilike.%${term}%`);
        conditions.push(`location.ilike.%${term}%`);
        conditions.push(`location_region.ilike.%${term}%`);
      }
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.or(conditions.join(','));
      }
    }

    // Apply additional filters
    if (filters.platform) {
      queryBuilder = queryBuilder.eq('platform', filters.platform);
    }
    if (filters.primary_niche) {
      queryBuilder = queryBuilder.ilike('primary_niche', `%${filters.primary_niche}%`);
    }
    if (filters.min_followers) {
      queryBuilder = queryBuilder.gte('followers_count', filters.min_followers);
    }
    if (filters.max_followers) {
      queryBuilder = queryBuilder.lte('followers_count', filters.max_followers);
    }
    if (filters.min_engagement_rate) {
      queryBuilder = queryBuilder.gte('engagement_rate', filters.min_engagement_rate);
    }
    if (filters.location) {
      queryBuilder = queryBuilder.or(`location.ilike.%${filters.location}%,location_region.ilike.%${filters.location}%`);
    }

    // Order by engagement, then followers for better results
    queryBuilder = queryBuilder.order('engagement_rate', { ascending: false });
    queryBuilder = queryBuilder.order('followers_count', { ascending: false });
    
    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;
    if (error) throw error;
    
    const creators = data || [];
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Improved scoring algorithm
    const scored = creators.map((c: any) => {
      let score = 0;
      const fields = [
        c.handle,
        c.display_name,
        c.primary_niche,
        c.secondary_niche,
        c.bio,
        c.location,
        c.location_region,
        ...(Array.isArray(c.hashtags) ? c.hashtags : [])
      ].map(f => (f || '').toString().toLowerCase());
      
      // Score based on keyword relevance
      for (const k of keywords) {
        for (const f of fields) {
          if (f.includes(k)) {
            // Exact match gets higher score
            if (f === k) score += 15;
            // Partial match gets lower score
            else if (f.includes(k)) score += 5;
          }
        }
      }
      
      // Bonus for high engagement (weighted more heavily)
      if (c.engagement_rate && c.engagement_rate > 0.05) score += 8;
      if (c.engagement_rate && c.engagement_rate > 0.1) score += 5;
      
      // Bonus for reasonable follower count
      if (c.followers_count && c.followers_count > 10000 && c.followers_count < 1000000) score += 3;
      
      // Normalize score to 0-100 range
      const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
      
      return { ...c, match_score: normalizedScore };
    });
    
    // Sort by score, then engagement, then followers
    scored.sort((a: any, b: any) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      if (b.engagement_rate !== a.engagement_rate) return (b.engagement_rate || 0) - (a.engagement_rate || 0);
      return (b.followers_count || 0) - (a.followers_count || 0);
    });
    
    return {
      data: scored,
      totalCount,
      totalPages,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in smartInfluencerSearch:', error);
    return {
      data: [],
      totalCount: 0,
      totalPages: 0,
      page,
      limit
    };
  }
} 