import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentSession } from '../../lib/internal-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create service role client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'getCreators') {
      // Get all talent network entries for the user
      // Try to select all columns, but handle case where note/what_do_you_post might not exist yet
      let { data: entries, error: entriesErr } = await supabase
        .from('talent_network')
        .select('creator_id, price, status, channel, what_do_you_post, note')
        .eq('user_id', userId);

      // If error is due to missing columns, try without them
      if (entriesErr && (entriesErr.message?.includes('column') || entriesErr.code === '42703')) {
        console.warn('Some columns may not exist, trying without note/what_do_you_post:', entriesErr.message);
        const { data: entriesFallback, error: entriesErrFallback } = await supabase
          .from('talent_network')
          .select('creator_id, price, status, channel')
          .eq('user_id', userId);
        
        if (entriesErrFallback) {
          console.error('Error fetching talent network entries:', entriesErrFallback);
          throw entriesErrFallback;
        }
        
        entries = entriesFallback;
        entriesErr = null;
      } else if (entriesErr) {
        console.error('Error fetching talent network entries:', entriesErr);
        throw entriesErr;
      }

      if (!entries || entries.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      // creator_id is now UUID, so use it directly
      const creatorIds: string[] = entries.map((e: any) => String(e.creator_id));

      if (creatorIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      const metadataMap: Record<string, { price: number | null; status: string; channel: string | null; what_do_you_post: string | null; note: string | null }> = {};
      
      entries.forEach((e: any) => {
        const id = String(e.creator_id);
        metadataMap[id] = {
          price: e.price ?? null,
          status: e.status ?? 'No reply',
          channel: e.channel ?? null,
          what_do_you_post: e.what_do_you_post ?? null,
          note: e.note ?? null, // Will be null if column doesn't exist
        };
      });

      // Fetch creators from healthwellness using UUIDs
      const { data: creators, error: cErr } = await supabase
        .from('healthwellness')
        .select('*')
        .in('id', creatorIds);

      if (cErr) {
        console.error('Error fetching creators from healthwellness:', cErr);
        throw cErr;
      }

      // Add metadata to each creator
      const creatorsWithMetadata = (creators ?? []).map(creator => {
        const metadata = metadataMap[String(creator.id)] || { price: null, status: 'No reply', channel: null, what_do_you_post: null, note: null };
        return {
          ...creator,
          price: metadata.price,
          status: metadata.status,
          channel: metadata.channel,
          what_do_you_post: metadata.what_do_you_post,
          note: metadata.note,
        };
      });

      return NextResponse.json(creatorsWithMetadata, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Talent Network API GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { action } = body;

    if (action === 'addCreators') {
      const { creatorIds } = body;
      if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
        return NextResponse.json({ error: 'creatorIds array required' }, { status: 400 });
      }

      // Handle both UUID strings and numeric IDs
      // healthwellness.id is UUID, so we need to resolve all IDs to UUIDs
      // list_items.creator_id is TEXT (storing UUID as string)
      // discover page uses UUID directly
      const resolvedCreatorIds: string[] = [];
      
      for (const creatorId of creatorIds) {
        const idStr = String(creatorId);
        
        // Check if it's a UUID (contains hyphens)
        if (idStr.includes('-')) {
          // It's a UUID, verify it exists in healthwellness table
          const { data: creator, error: lookupErr } = await supabase
            .from('healthwellness')
            .select('id')
            .eq('id', idStr)
            .single();
          
          if (lookupErr || !creator) {
            console.error(`Creator with UUID ${idStr} not found in healthwellness table:`, lookupErr);
            // Try looking up by uuid field instead
            const { data: creatorByUuid } = await supabase
              .from('healthwellness')
              .select('id')
              .eq('uuid', idStr)
              .single();
            
            if (creatorByUuid) {
              resolvedCreatorIds.push(creatorByUuid.id);
            } else {
              console.error(`Creator with UUID/uuid ${idStr} not found`);
            }
          } else {
            resolvedCreatorIds.push(creator.id);
          }
        } else {
          // It's a numeric ID (from My Lists page - but actually My Lists also uses UUIDs stored as TEXT)
          // This shouldn't happen, but handle it just in case
          console.warn(`Received numeric creator ID ${idStr}, but expected UUID. Skipping.`);
        }
      }

      if (resolvedCreatorIds.length === 0) {
        return NextResponse.json({ error: 'No valid creator IDs found. Make sure the creators exist in the database.' }, { status: 400 });
      }

      // Create entries with UUID creator_ids
      // Note: The database column needs to be UUID type, not BIGINT
      const entries = resolvedCreatorIds.map((creatorId: string) => ({
        user_id: userId,
        creator_id: creatorId, // UUID string
        price: null, // Default to N/A
        status: 'No reply',
        channel: 'Inbound',
      }));

      console.log('Adding creators to talent network:', { userId, entriesCount: entries.length, sampleEntry: entries[0] });

      const { data, error: insertErr } = await supabase
        .from('talent_network')
        .upsert(entries, { onConflict: 'user_id,creator_id' })
        .select();

      if (insertErr) {
        console.error('Error inserting into talent_network:', insertErr);
        
        // Check if error is due to type mismatch (BIGINT vs UUID)
        if (insertErr.message.includes('invalid input syntax for type') || 
            insertErr.message.includes('bigint') ||
            insertErr.code === '22P02') {
          throw new Error(
            'Database schema mismatch: The talent_network table needs to be migrated. ' +
            'Please visit /dashboard/admin/migrate-talent-network for migration instructions, ' +
            'or run the migration SQL in Supabase SQL Editor.'
          );
        }
        
        throw insertErr;
      }

      console.log('Successfully added creators to talent network:', data?.length || 0);

      return NextResponse.json({ success: true, added: data?.length || entries.length }, { status: 200 });
    }

    if (action === 'importFromCSV') {
      const { creators } = body; // Array of { username, platform, ... }
      if (!Array.isArray(creators) || creators.length === 0) {
        return NextResponse.json({ error: 'creators array required' }, { status: 400 });
      }

      const matchedCreatorIds: string[] = [];
      const errors: string[] = [];

      // Match each creator by username/platform
      for (const creator of creators) {
        try {
          // Search for existing creator in database
          let searchResult = await supabase
            .from('healthwellness')
            .select('id')
            .eq('handle', creator.username.toLowerCase())
            .eq('platform', creator.platform)
            .limit(1);

          if (searchResult.error) {
            errors.push(`Error searching for ${creator.username}: ${searchResult.error.message}`);
            continue;
          }

          // If no exact match, try case-insensitive
          if (!searchResult.data || searchResult.data.length === 0) {
            searchResult = await supabase
              .from('healthwellness')
              .select('id')
              .ilike('handle', creator.username.toLowerCase())
              .eq('platform', creator.platform)
              .limit(1);
          }

          if (searchResult.data && searchResult.data.length > 0) {
            matchedCreatorIds.push(String(searchResult.data[0].id));
          } else {
            errors.push(`Creator not found: ${creator.username} (${creator.platform})`);
          }
        } catch (error: any) {
          errors.push(`Error processing ${creator.username}: ${error.message}`);
        }
      }

      // Add matched creators to talent network
      if (matchedCreatorIds.length > 0) {
        const entries = matchedCreatorIds.map((creatorId: string) => ({
          user_id: userId,
          creator_id: creatorId,
          price: null, // Default to N/A
          status: 'No reply',
          channel: 'Inbound',
        }));

        const { error: insertErr } = await supabase
          .from('talent_network')
          .upsert(entries, { onConflict: 'user_id,creator_id' });

        if (insertErr) {
          errors.push(`Failed to add creators: ${insertErr.message}`);
        }
      }

      return NextResponse.json({ 
        success: true, 
        matched: matchedCreatorIds.length,
        errors 
      }, { status: 200 });
    }

    if (action === 'removeCreators') {
      const { creatorIds } = body;
      if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
        return NextResponse.json({ error: 'creatorIds array required' }, { status: 400 });
      }

      const { error: deleteErr } = await supabase
        .from('talent_network')
        .delete()
        .eq('user_id', userId)
        .in('creator_id', creatorIds);

      if (deleteErr) throw deleteErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'updatePrice') {
      const { creatorId, price } = body;
      if (!creatorId || price === undefined) {
        return NextResponse.json({ error: 'creatorId and price required' }, { status: 400 });
      }

      // Upsert to handle case where entry doesn't exist yet
      const { error: updateErr } = await supabase
        .from('talent_network')
        .upsert({
          user_id: userId,
          creator_id: creatorId,
          price: price,
        }, { onConflict: 'user_id,creator_id' });

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'updateStatus') {
      const { creatorId, status } = body;
      if (!creatorId || !status) {
        return NextResponse.json({ error: 'creatorId and status required' }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('talent_network')
        .upsert({
          user_id: userId,
          creator_id: creatorId,
          status: status,
        }, { onConflict: 'user_id,creator_id' });

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'updateChannel') {
      const { creatorId, channel } = body;
      if (!creatorId || channel === undefined) {
        return NextResponse.json({ error: 'creatorId and channel required' }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('talent_network')
        .upsert({
          user_id: userId,
          creator_id: creatorId,
          channel: channel,
        }, { onConflict: 'user_id,creator_id' });

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'updateWhatDoYouPost') {
      const { creatorId, whatDoYouPost } = body;
      if (!creatorId || whatDoYouPost === undefined) {
        return NextResponse.json({ error: 'creatorId and whatDoYouPost required' }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('talent_network')
        .upsert({
          user_id: userId,
          creator_id: creatorId,
          what_do_you_post: whatDoYouPost,
        }, { onConflict: 'user_id,creator_id' });

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'updateNote') {
      const { creatorId, note } = body;
      if (!creatorId || note === undefined) {
        return NextResponse.json({ error: 'creatorId and note required' }, { status: 400 });
      }

      const { error: updateErr } = await supabase
        .from('talent_network')
        .upsert({
          user_id: userId,
          creator_id: creatorId,
          note: note,
        }, { onConflict: 'user_id,creator_id' });

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Talent Network API POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

