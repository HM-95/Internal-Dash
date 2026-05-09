import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentSession } from '../../lib/internal-auth';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export interface ImportCreatorRequest {
  username: string;
  platform: string;
  display_name?: string;
  followers_count?: number;
  engagement_rate?: number;
}

export interface ImportResult {
  found: CreatorMatch[];
  notFound: CreatorToScrape[];
  errors: string[];
}

export interface CreatorMatch {
  username: string;
  platform: string;
  creatorId: string;
  display_name: string;
  followers_count: number;
  engagement_rate: number;
  profile_image_url?: string;
}

export interface CreatorToScrape {
  username: string;
  platform: string;
  display_name?: string;
  followers_count?: number;
  engagement_rate?: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Import creators API called');
    
    const session = await getCurrentSession();
    if (!session) {
      console.error('Import creators - no internal session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Import creators - missing Supabase environment variables');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = session.userId;

    console.log('User authenticated via internal session:', userId);

    const body = await request.json();
    const { listId, creators } = body;

    console.log('Import request received:', { listId, creatorsCount: creators?.length, sampleCreator: creators?.[0] });

    if (!listId || !creators || !Array.isArray(creators)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Verify that the user owns this list
    console.log('Verifying list access for listId:', listId, 'userId:', userId);
    
    const { data: listData, error: listError } = await supabase
      .from('lists')
      .select('id, name, user_id')
      .eq('id', listId)
      .eq('user_id', userId)
      .single();

    if (listError) {
      console.error('List access error:', listError);
      return NextResponse.json({ error: `List access error: ${listError.message}` }, { status: 403 });
    }
    
    if (!listData) {
      console.error('List not found for listId:', listId, 'userId:', userId);
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 403 });
    }

    console.log('List access verified:', { listId: listData.id, listName: listData.name, userId: listData.user_id });

    const result: ImportResult = {
      found: [],
      notFound: [],
      errors: []
    };

    // Process each creator
    for (const creator of creators) {
      try {
        console.log(`Processing creator: ${creator.username} (${creator.platform})`);
        
        // Search for existing creator in database with more flexible matching
        let existingCreators = null;
        let searchError = null;
        
        // First try exact match
        console.log(`Searching for creator: ${creator.username} (${creator.platform})`);
        let searchResult = await supabase
          .from('healthwellness')
          .select('id, handle, platform, display_name, followers_count, engagement_rate, profile_image_url')
          .eq('handle', creator.username.toLowerCase())
          .eq('platform', creator.platform) // Use exact platform case from CSV
          .limit(1);
        
        existingCreators = searchResult.data;
        searchError = searchResult.error;
        
        console.log(`Search result for ${creator.username}:`, {
          data: existingCreators,
          error: searchError,
          count: existingCreators?.length || 0
        });
        
        // If no exact match, try case-insensitive username search
        if ((!existingCreators || existingCreators.length === 0) && !searchError) {
          console.log(`No exact match found for ${creator.username}, trying case-insensitive search...`);
          
          searchResult = await supabase
            .from('healthwellness')
            .select('id, handle, platform, display_name, followers_count, engagement_rate, profile_image_url')
            .ilike('handle', creator.username.toLowerCase())
            .eq('platform', creator.platform) // Use exact platform case from CSV
            .limit(1);
          
          existingCreators = searchResult.data;
          searchError = searchResult.error;
        }
        
        // If still no match, try broader platform matching
        if ((!existingCreators || existingCreators.length === 0) && !searchError) {
          console.log(`No case-insensitive match found for ${creator.username}, trying broader platform search...`);
          
          // Handle platform variations (e.g., 'x' vs 'twitter')
          let platformToSearch = creator.platform;
          if (platformToSearch.toLowerCase() === 'x') platformToSearch = 'Twitter';
          
          searchResult = await supabase
            .from('healthwellness')
            .select('id, handle, platform, display_name, followers_count, engagement_rate, profile_image_url')
            .ilike('handle', creator.username.toLowerCase())
            .eq('platform', platformToSearch)
            .limit(1);
          
          existingCreators = searchResult.data;
          searchError = searchResult.error;
        }

        if (searchError) {
          console.error(`Search error for ${creator.username}:`, searchError);
          result.errors.push(`Error searching for ${creator.username}: ${searchError.message}`);
          continue;
        }

        if (existingCreators && existingCreators.length > 0) {
          console.log(`Found creator: ${existingCreators[0].handle} (${existingCreators[0].platform})`);
          // Creator found in database
          const existingCreator = existingCreators[0];
          
          result.found.push({
            username: creator.username,
            platform: creator.platform,
            creatorId: existingCreator.id,
            display_name: existingCreator.display_name,
            followers_count: existingCreator.followers_count,
            engagement_rate: existingCreator.engagement_rate,
            profile_image_url: existingCreator.profile_image_url
          });

          // Add creator to the list
          console.log(`Adding creator ${existingCreator.handle} to list ${listId}`);
          console.log(`Insert data:`, {
            list_id: listId,
            creator_id: existingCreator.id.toString(),
            created_at: new Date().toISOString()
          });
          
          const { error: addError } = await supabase
            .from('list_items')
            .insert({
              list_id: listId,
              creator_id: existingCreator.id.toString(), // Convert to string since list_items.creator_id is TEXT
              created_at: new Date().toISOString() // Use created_at to match your schema
            })
            .select()
            .single();

          if (addError) {
            console.error(`Error adding creator ${existingCreator.handle} to list:`, addError);
            if (addError.message.includes('duplicate key') || addError.message.includes('duplicate key value')) {
              console.log(`Creator ${existingCreator.handle} already exists in list - skipping`);
            } else {
              result.errors.push(`Error adding ${creator.username} to list: ${addError.message}`);
            }
          } else {
            console.log(`Successfully added creator ${existingCreator.handle} to list`);
          }
        } else {
          // Creator not found - needs scraping
          result.notFound.push({
            username: creator.username,
            platform: creator.platform,
            display_name: creator.display_name,
            followers_count: creator.followers_count,
            engagement_rate: creator.engagement_rate
          });
        }
      } catch (error) {
        result.errors.push(`Error processing ${creator.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // If there are creators that need scraping, add them to a scraping queue
    if (result.notFound.length > 0) {
      try {
        await addToScrapingQueue(supabase, listId, result.notFound, userId);
      } catch (scrapingError) {
        console.warn('Could not add to scraping queue (table may not exist):', scrapingError);
        // Don't fail the import if scraping queue fails
      }
    }

    console.log('Import completed successfully:', {
      found: result.found.length,
      notFound: result.notFound.length,
      errors: result.errors.length,
      sampleFound: result.found[0],
      sampleNotFound: result.notFound[0]
    });

    // Return success even if some creators couldn't be found (they'll be queued for scraping)
    return NextResponse.json({
      success: true,
      result,
      message: `Import completed: ${result.found.length} creators added to list, ${result.notFound.length} queued for scraping, ${result.errors.length} errors`
    });

  } catch (error) {
    console.error('Import creators error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add creators to scraping queue for future processing
 */
async function addToScrapingQueue(
  supabase: any, 
  listId: string, 
  creatorsToScrape: CreatorToScrape[], 
  userId: string
) {
  try {
    // Create scraping jobs table entry (we'll create this table structure)
    const scrapingJobs = creatorsToScrape.map(creator => ({
      list_id: listId,
      user_id: userId,
      username: creator.username,
      platform: creator.platform,
      display_name: creator.display_name,
      provided_followers_count: creator.followers_count,
      provided_engagement_rate: creator.engagement_rate,
      status: 'pending',
      created_at: new Date().toISOString(),
      attempts: 0
    }));

    // For now, we'll store these in a simple table
    // When the scraper is ready, it can pick up jobs from this table
    try {
      const { error } = await supabase
        .from('scraping_jobs')
        .insert(scrapingJobs);

      if (error) {
        if (error.message.includes('relation "scraping_jobs" does not exist')) {
          console.log('Scraping jobs table does not exist yet - skipping queue for now');
          return; // Exit gracefully
        } else {
          console.error('Error adding to scraping queue:', error);
          throw error; // Re-throw non-table-exists errors
        }
      }
      
      console.log(`Successfully added ${scrapingJobs.length} creators to scraping queue`);
    } catch (tableError) {
      if (tableError instanceof Error && tableError.message.includes('relation "scraping_jobs" does not exist')) {
        console.log('Scraping jobs table does not exist yet - skipping queue for now');
        return; // Exit gracefully
      }
      throw tableError; // Re-throw other errors
    }
  } catch (error) {
    console.error('Error in addToScrapingQueue:', error);
  }
}

// GET endpoint to check scraping status and debug creators
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Import creators GET - missing Supabase environment variables');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const debug = searchParams.get('debug');

    // Debug endpoint to see what creators exist in database
    if (debug === 'creators') {
      const { data: creators, error: creatorsError } = await supabase
        .from('healthwellness')
        .select('handle, platform, display_name')
        .limit(20);

      if (creatorsError) {
        return NextResponse.json({ error: creatorsError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        debug: {
          creatorsCount: creators?.length || 0,
          sampleCreators: creators?.slice(0, 5) || [],
          allCreators: creators || []
        }
      });
    }

    if (!listId) {
      return NextResponse.json({ error: 'List ID required' }, { status: 400 });
    }

    // Get scraping job status for this list
    let scrapingJobs = [];
    let error = null;
    
    try {
      const result = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('list_id', listId)
        .eq('user_id', userId);
      
      if (result.error) {
        if (result.error.message.includes('relation "scraping_jobs" does not exist')) {
          // Table doesn't exist yet - this is expected
          console.log('Scraping jobs table does not exist yet - returning empty results');
          scrapingJobs = [];
        } else {
          // Real error
          console.error('Error fetching scraping jobs:', result.error);
          error = result.error;
        }
      } else {
        scrapingJobs = result.data || [];
      }
    } catch (e) {
      // Table doesn't exist yet - this is expected
      console.log('Scraping jobs table does not exist yet - returning empty results');
      scrapingJobs = [];
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const jobs = scrapingJobs || [];
    const pending = jobs.filter(job => job.status === 'pending').length;
    const completed = jobs.filter(job => job.status === 'completed').length;
    const failed = jobs.filter(job => job.status === 'failed').length;

    return NextResponse.json({
      success: true,
      scraping: {
        total: jobs.length,
        pending,
        completed,
        failed,
        jobs: jobs
      }
    });

  } catch (error) {
    console.error('Get scraping status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

