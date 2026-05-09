import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking email data in database...');
    
    // Get a sample of creators with their email data
    const { data: creators, error } = await supabase
      .from('healthwellness')
      .select('id, display_name, handle, email')
      .limit(10);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('🔍 Debug: Found creators:', creators?.length || 0);
    
    // Check which creators have emails
    const creatorsWithEmails = creators?.filter(creator => 
      creator.email && creator.email.trim() !== ''
    ) || [];
    
    console.log('🔍 Debug: Creators with emails:', creatorsWithEmails.length);
    
    // Show sample email data
    const sampleEmails = creatorsWithEmails.slice(0, 5).map(creator => ({
      id: creator.id,
      name: creator.display_name,
      handle: creator.handle,
      email: creator.email
    }));
    
    return NextResponse.json({
      success: true,
      totalCreators: creators?.length || 0,
      creatorsWithEmails: creatorsWithEmails.length,
      sampleEmails,
      allCreators: creators
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Debug email data error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
