import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get table info
    const { table, nicheField } = await getTableAndField();
    
    // Check total creators
    const { count: totalCount } = await supabase
      .from(table)
      .select('*', { count: 'planned', head: true });
    
    // Check creators with email (current logic)
    const { count: withEmailCurrent } = await supabase
      .from(table)
      .select('*', { count: 'planned', head: true })
      .not('email', 'is', null)
      .not('email', 'eq', '');
    
    // Check creators with email (alternative logic)
    const { count: withEmailAlt } = await supabase
      .from(table)
      .select('*', { count: 'planned', head: true })
      .not('email', 'is', null);
    
    // Check creators with non-empty email
    const { count: withEmailNonEmpty } = await supabase
      .from(table)
      .select('*', { count: 'planned', head: true })
      .not('email', 'eq', '');
    
    // Get sample of email data to see what's in there
    const { data: emailSamples } = await supabase
      .from(table)
      .select('email')
      .not('email', 'is', null)
      .limit(10);
    
    // Check for different email patterns
    const { count: withEmailPattern1 } = await supabase
      .from(table)
      .select('*', { count: 'planned', head: true })
      .like('email', '%@%');
    
    const { count: withEmailPattern2 } = await supabase
      .from(table)
      .select('*', { count: 'planned', head: true })
      .not('email', 'is', null)
      .not('email', 'eq', '')
      .like('email', '%@%');

    return NextResponse.json({
      table,
      totalCount,
      withEmailCurrent,
      withEmailAlt,
      withEmailNonEmpty,
      withEmailPattern1,
      withEmailPattern2,
      emailSamples: emailSamples?.map(s => s.email).filter(Boolean),
      debug: {
        currentLogic: 'not(email, is, null).not(email, eq, "")',
        altLogic: 'not(email, is, null)',
        nonEmptyLogic: 'not(email, eq, "")',
        patternLogic: 'like(email, "%@%")'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function getTableAndField() {
  // Check if healthwellness table has data
  const { data: healthwellnessData, error: healthwellnessError } = await supabase
    .from('healthwellness')
    .select('id')
    .limit(1);
  
  if (!healthwellnessError && healthwellnessData && healthwellnessData.length > 0) {
    return { table: 'healthwellness', nicheField: 'secondary_niche' };
  }
  
  // Fallback to creatordata
  return { table: 'creatordata', nicheField: 'secondary_niche' };
}
