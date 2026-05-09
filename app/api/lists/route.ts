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
    console.log('Lists API GET - Session check:', { 
      hasSession: !!session, 
      userId: session?.userId,
      username: session?.username 
    });
    
    if (!session) {
      console.log('Lists API GET - No session found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'getLists') {
      // Get all lists for the user
      const { data: lists, error: listErr } = await supabase
        .from('lists')
        .select('id,name,created_at,is_active')
        .eq('is_active', true)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (listErr) throw listErr;

      // Get creator counts for each list
      const { data: items, error: itemsErr } = await supabase
        .from('list_items')
        .select('list_id, creator_id')
        .in('list_id', (lists ?? []).map(l => l.id));

      if (itemsErr) {
        return NextResponse.json(lists ?? [], { status: 200 });
      }

      const counts = new Map<string, number>();
      for (const row of items ?? []) {
        const k = row.list_id as string;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }

      const listsWithCounts = (lists ?? []).map(l => ({
        ...l,
        creatorCount: counts.get(l.id) ?? 0
      }));

      return NextResponse.json(listsWithCounts, { status: 200 });
    }

    if (action === 'getCreatorsForList') {
      const listId = searchParams.get('listId');
      if (!listId) {
        return NextResponse.json({ error: 'listId required' }, { status: 400 });
      }

      // Get creator IDs and prices
      const { data: items, error: liErr } = await supabase
        .from('list_items')
        .select('creator_id, price')
        .eq('list_id', listId);

      if (liErr) throw liErr;

      const creatorIds: string[] = (items ?? []).map((r: any) => String(r.creator_id));
      const priceMap: Record<string, number | null> = {};
      (items ?? []).forEach((r: any) => {
        priceMap[String(r.creator_id)] = r.price ?? null;
      });

      if (creatorIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      // Fetch creators from healthwellness
      const { data: creators, error: cErr } = await supabase
        .from('healthwellness')
        .select('*')
        .in('id', creatorIds);

      if (cErr) throw cErr;

      // Add price to each creator
      const creatorsWithPrice = (creators ?? []).map(creator => ({
        ...creator,
        price: priceMap[String(creator.id)] ?? null
      }));

      return NextResponse.json(creatorsWithPrice, { status: 200 });
    }

    if (action === 'getAvailableTags') {
      const { data: existing, error: readErr } = await supabase
        .from('tags')
        .select('name')
        .eq('user_id', userId);

      if (readErr) throw readErr;

      const BASE_TAGS = ['Tech', 'Crypto', 'Finance', 'Fashion', 'Lifestyle'];

      if (!existing || existing.length === 0) {
        const rows = BASE_TAGS.map((name) => ({ user_id: userId, name }));
        await supabase.from('tags').upsert(rows, { onConflict: 'user_id,name' });
      }

      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      const names = (data ?? []).map((r: any) => r.name as string);
      return NextResponse.json(names, { status: 200 });
    }

    if (action === 'getTagsForList') {
      const listId = searchParams.get('listId');
      if (!listId) {
        return NextResponse.json({ error: 'listId required' }, { status: 400 });
      }

      const { data: lt, error: ltErr } = await supabase
        .from('list_tags')
        .select('tag_id')
        .eq('list_id', listId);

      if (ltErr) throw ltErr;

      const tagIds = (lt ?? []).map((r: any) => r.tag_id as string);

      if (!tagIds.length) {
        return NextResponse.json([], { status: 200 });
      }

      const { data: tags, error: tErr } = await supabase
        .from('tags')
        .select('id, name')
        .in('id', tagIds);

      if (tErr) throw tErr;

      const names = (tags ?? []).map((r: any) => r.name as string);
      return NextResponse.json(names, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Lists GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getCurrentSession();
    console.log('Lists API POST - Session check:', { 
      hasSession: !!session, 
      userId: session?.userId,
      username: session?.username 
    });
    
    if (!session) {
      console.log('Lists API POST - No session found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { action } = body;
    
    console.log('Lists API POST - Action:', action);

    if (action === 'createList') {
      const { name } = body;
      if (!name) {
        return NextResponse.json({ error: 'name required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('lists')
        .insert({ user_id: userId, name })
        .select('id,name,created_at')
        .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }

    if (action === 'addCreators') {
      const { listId, creatorIds } = body;
      if (!listId || !creatorIds || !Array.isArray(creatorIds)) {
        return NextResponse.json(
          { error: 'listId and creatorIds[] required' },
          { status: 400 }
        );
      }

      if (creatorIds.length === 0) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Check for existing creators
      const { data: existing, error: checkError } = await supabase
        .from('list_items')
        .select('creator_id')
        .eq('list_id', listId)
        .in('creator_id', creatorIds);

      if (checkError) throw checkError;

      // Filter out duplicates
      const existingIds = new Set(existing?.map(item => item.creator_id) || []);
      const newCreatorIds = creatorIds.filter(id => !existingIds.has(id));

      if (newCreatorIds.length === 0) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Insert new creators
      const rows = newCreatorIds.map((id) => ({ list_id: listId, creator_id: id }));
      const { error } = await supabase.from('list_items').insert(rows);

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'removeCreator') {
      const { listId, creatorId } = body;
      if (!listId || !creatorId) {
        return NextResponse.json(
          { error: 'listId and creatorId required' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('list_items')
        .delete()
        .match({ list_id: listId, creator_id: creatorId });

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'renameList') {
      const { listId, name } = body;
      if (!listId || !name) {
        return NextResponse.json({ error: 'listId and name required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('lists')
        .update({ name })
        .eq('id', listId);

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'softDeleteLists') {
      const { listIds } = body;
      if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
        return NextResponse.json({ error: 'listIds[] required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('lists')
        .update({ is_active: false })
        .in('id', listIds);

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'createTag') {
      const { name } = body;
      if (!name) {
        return NextResponse.json({ error: 'name required' }, { status: 400 });
      }

      const norm = name.trim();
      const { data, error } = await supabase
        .from('tags')
        .upsert({ user_id: userId, name: norm }, { onConflict: 'user_id,name' })
        .select('id, name')
        .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }

    if (action === 'setTagsForList') {
      const { listId, tagNames } = body;
      if (!listId || !tagNames || !Array.isArray(tagNames)) {
        return NextResponse.json(
          { error: 'listId and tagNames[] required' },
          { status: 400 }
        );
      }

      const unique = Array.from(new Set(tagNames.map(t => t.trim()).filter(Boolean)));

      if (unique.length === 0) {
        const { error } = await supabase.from('list_tags').delete().eq('list_id', listId);
        if (error) throw error;
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const tagIdByName = new Map<string, string>();
      for (const nm of unique) {
        const { data, error } = await supabase
          .from('tags')
          .upsert({ user_id: userId, name: nm }, { onConflict: 'user_id,name' })
          .select('id')
          .single();

        if (error) throw error;
        tagIdByName.set(nm, (data as any).id as string);
      }

      const { error: delErr } = await supabase.from('list_tags').delete().eq('list_id', listId);
      if (delErr) throw delErr;

      const rows = Array.from(tagIdByName.values()).map((id) => ({
        list_id: listId,
        tag_id: id
      }));

      const { error: insErr } = await supabase
        .from('list_tags')
        .upsert(rows, { onConflict: 'list_id,tag_id', ignoreDuplicates: true });

      if (insErr) throw insErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'renameTag') {
      const { oldName, newName } = body;
      if (!oldName || !newName) {
        return NextResponse.json({ error: 'oldName and newName required' }, { status: 400 });
      }

      const normOld = oldName.trim();
      const normNew = newName.trim();

      if (!normOld || !normNew || normOld === normNew) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { data: oldTag, error: oldErr } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', normOld)
        .single();

      if (oldErr || !oldTag) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { data: newTag, error: findErr } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', normNew)
        .maybeSingle();

      if (findErr) throw findErr;

      if (newTag?.id) {
        const { error: moveErr } = await supabase
          .from('list_tags')
          .update({ tag_id: newTag.id })
          .eq('tag_id', oldTag.id);

        if (moveErr) throw moveErr;

        const { error: delErr } = await supabase
          .from('tags')
          .delete()
          .eq('id', oldTag.id)
          .eq('user_id', userId);

        if (delErr) throw delErr;
      } else {
        const { error: updErr } = await supabase
          .from('tags')
          .update({ name: normNew })
          .eq('id', oldTag.id)
          .eq('user_id', userId);

        if (updErr) throw updErr;
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'unlinkTagFromList') {
      const { listId, tagName } = body;
      if (!listId || !tagName) {
        return NextResponse.json({ error: 'listId and tagName required' }, { status: 400 });
      }

      const { data: tag, error: findErr } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', tagName.trim())
        .maybeSingle();

      if (findErr) throw findErr;

      if (!tag?.id) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { error: delErr } = await supabase
        .from('list_tags')
        .delete()
        .match({ list_id: listId, tag_id: tag.id });

      if (delErr) throw delErr;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'deleteTag') {
      const { name } = body;
      if (!name) {
        return NextResponse.json({ error: 'name required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('user_id', userId)
        .eq('name', name.trim());

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'updateCreatorPrice') {
      const { listId, creatorId, price } = body;
      if (!listId || !creatorId || price === undefined) {
        return NextResponse.json(
          { error: 'listId, creatorId and price required' },
          { status: 400 }
        );
      }

      // Verify the list belongs to the user
      const { data: listCheck, error: listCheckErr } = await supabase
        .from('lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

      if (listCheckErr || !listCheck) {
        return NextResponse.json({ error: 'List not found or unauthorized' }, { status: 403 });
      }

      // Update the price in list_items table
      const { error } = await supabase
        .from('list_items')
        .update({ price: price })
        .match({ list_id: listId, creator_id: creatorId });

      if (error) throw error;

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Lists POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
