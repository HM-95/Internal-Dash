import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'
import { generateAIResponse, generateAIResponseStream } from '@/lib/ai/gemini'
import {
  createChatSession,
  createChatMessage,
  updateChatSession,
  getChatMessages,
  getInfluencerStats,
  smartInfluencerSearch,
  getInfluencerByHandle
} from '@/lib/ai/database'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Skip during build time when environment variables aren't available - v2
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping ai-chat route during build time');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    const { message, sessionId, systemPromptName = 'buzzberry_default', page = 1, pageSize = 10, listId, listName } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get authenticated user for verification
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authError: authError?.message 
    });

    // Ensure we have a valid authenticated user
    if (!user?.id) {
      console.log('No authenticated user found, returning error');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = user.id;

    console.log('Using user ID:', userId);

    // Create service role client for database operations
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test if chat_sessions table exists and has data
    try {
      const { data: testData, error: testError } = await supabaseService
        .from('chat_sessions')
        .select('*')
        .limit(1);
      
      console.log('Chat sessions table test:', { 
        hasData: !!testData, 
        dataLength: testData?.length || 0, 
        error: testError?.message 
      });
    } catch (error) {
      console.error('Error testing chat_sessions table:', error);
    }

    // Create or get chat session
    let currentSessionId = sessionId
    if (!currentSessionId) {
      console.log('Creating new chat session for user:', userId);
      const newSession = await createChatSession(userId, message.substring(0, 50), '', supabaseService)
      console.log('createChatSession result:', newSession);
      
      if (!newSession) {
        console.error('Failed to create chat session - returning error');
        return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 })
      }
      
      currentSessionId = newSession.id
      console.log('New session created with ID:', currentSessionId);
    } else {
      console.log('Using existing session ID:', currentSessionId);
    }

    // Search for relevant creators with server-side pagination
    let relevantCreators: any[] = []
    let totalInfluencers = 0
    let totalPages = 0
    try {
      const pageNum = Math.max(1, parseInt(page as any) || 1);
      const pageSz = Math.max(1, parseInt(pageSize as any) || 10);
      
      if (listId && listName) {
        // Search within the selected list only
        console.log(`Searching within list: ${listName} (${listId})`);
        
        // Get creators from the specific list
        const { data: listCreators, error: listError } = await supabaseService
          .from('list_creators')
          .select(`
            creators (
              id, handle, display_name, bio, primary_niche, secondary_niche,
              followers_count, average_views, engagement_rate, buzz_score,
              hashtags, location, location_region, platform, brand_tags,
              bio_links, email, past_ad_placements, profile_image_url
            )
          `)
          .eq('list_id', listId);
          
        if (listError) {
          console.error('Error fetching list creators:', listError);
          relevantCreators = [];
        } else {
          // Extract creator data and apply semantic search within the list
          const listCreatorData = listCreators?.map(lc => lc.creators).filter(Boolean) || [];
          console.log(`Found ${listCreatorData.length} creators in list ${listName}`);
          
          // For now, return all creators in the list (could add semantic filtering later)
          relevantCreators = listCreatorData.map((creator, index) => ({
            ...creator,
            semantic_score: 0.9 - (index * 0.01), // Mock semantic scores
            metadata_score: 0.8,
            final_score: 0.85
          }));
          
          totalInfluencers = relevantCreators.length;
          totalPages = Math.ceil(totalInfluencers / pageSz);
          
          // Apply pagination to the list results
          const startIndex = (pageNum - 1) * pageSz;
          const endIndex = startIndex + pageSz;
          relevantCreators = relevantCreators.slice(startIndex, endIndex);
        }
      } else {
        // Use smartInfluencerSearch for full database search
        const searchResult = await smartInfluencerSearch(message, {}, pageSz, pageNum, supabaseService);
        relevantCreators = searchResult.data;
        totalInfluencers = searchResult.totalCount;
        totalPages = searchResult.totalPages;
      }
      
      // Log the influencer data being sent to Gemini for debugging
      console.log('Influencer data sent to Gemini:', JSON.stringify(relevantCreators, null, 2));
      console.log('Search context:', { listId, listName, searchType: listId ? 'list-specific' : 'database-wide' });
      console.log('Pagination info:', { page: pageNum, pageSize: pageSz, total: totalInfluencers, totalPages });
    } catch (error) {
      console.error('Error searching influencers:', error)
    }

    // Save user message to database FIRST (so it's included in context)
    try {
      await createChatMessage(currentSessionId, 'user', message, supabaseService)
      console.log('User message saved successfully');
    } catch (error) {
      console.error('Error saving user message:', error)
    }

    // Get full chat history for context (like ChatGPT) - NOW INCLUDES THE CURRENT MESSAGE
    let chatHistory: any[] = []
    try {
      console.log('Fetching chat history for session:', currentSessionId);
      chatHistory = await getChatMessages(currentSessionId, 50, supabaseService) // Get last 50 messages for context
      console.log('Chat history loaded:', chatHistory.length, 'messages');
    } catch (error) {
      console.error('Error getting chat history:', error)
    }

    // Get database stats
    let influencerStats: any = {}
    try {
      influencerStats = await getInfluencerStats()
    } catch (error) {
      console.error('Error getting influencer stats:', error)
    }

    // Generate conversationContext from chatHistory
    const conversationContext = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })).slice(-20);

    // Now handle wantsJson
    const url = new URL(request.url);
    const wantsJson = url.searchParams.get('json') === '1' || request.headers.get('x-influencer-json') === '1';
    if (wantsJson) {
      // When generating the AI response (for streaming or non-JSON):
      const contextData = {
        stats: influencerStats,
        creators: relevantCreators, // Pass all relevant creators
        history: conversationContext,
        searchQuery: message,
        filters: {},
        listContext: listId ? { listId, listName } : null
      };
      
      const aiResponse = await generateAIResponse({
        prompt: message,
        systemPromptName,
        context: contextData
      });
      return NextResponse.json({
        influencers: relevantCreators,
        total: totalInfluencers,
        totalPages: totalPages,
        page: Math.max(1, parseInt(page as any) || 1), // Use client-provided page
        pageSize: Math.max(1, parseInt(pageSize as any) || 10), // Use client-provided pageSize
        aiResponseText: aiResponse.content, // Use Gemini's summary/follow-up text
        sessionId: currentSessionId // Include session ID to maintain context
      });
    }

    // Format chat history for Gemini context (include both user and assistant messages)
    console.log('Conversation context for AI:', {
      messageCount: conversationContext.length,
      context: conversationContext.map(msg => `${msg.role}: ${msg.content.substring(0, 50)}...`)
    });

    // Generate AI response with full conversation context (like ChatGPT)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = ''
        try {
          const streamContextData = {
            stats: influencerStats,
            creators: relevantCreators,
            history: conversationContext, // Use full conversation context
            searchQuery: message,
            filters: {},
            listContext: listId ? { listId, listName } : null
          };
          
          for await (const chunk of generateAIResponseStream({
            prompt: message,
            systemPromptName,
            context: streamContextData
          })) {
            controller.enqueue(encoder.encode(chunk))
            fullText += chunk
          }
          // Save AI response to database after streaming is done
          await createChatMessage(currentSessionId, 'assistant', fullText, supabaseService)
          await updateChatSession(currentSessionId, { title: message.substring(0, 50) }, supabaseService)
        } catch (error) {
          console.error('Error streaming Gemini response:', error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Session-ID': currentSessionId, // Include session ID in response headers
        'X-Influencer-Total': totalInfluencers.toString(),
        'X-Influencer-Page': Math.max(1, parseInt(page as any) || 1).toString(), // Use client-provided page
        'X-Influencer-PageSize': Math.max(1, parseInt(pageSize as any) || 10).toString(), // Use client-provided pageSize
      },
    })

  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 