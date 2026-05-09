import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up internal users...');
    
    const users = [
      { username: 'hari_m', password: 'Havendev%2026', access_group: 'code_access' },
      { username: 'odin_l', password: 'Havendev%2026', access_group: 'code_access' },
      { username: 'avik_r', password: 'Havendev%2026', access_group: 'code_access' },
      { username: 'member_haven', password: 'Team@haven.2026', access_group: 'non_code_access' }
    ];

    const results = [];

    for (const user of users) {
      console.log(`Processing user: ${user.username}`);
      
      const passwordHash = await bcrypt.hash(user.password, 12);
      
      const { data, error } = await supabase
        .from('internal_users')
        .upsert({
          username: user.username,
          password_hash: passwordHash,
          access_group: user.access_group,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'username' 
        });

      if (error) {
        console.error(`Error setting up user ${user.username}:`, error);
        results.push({ username: user.username, success: false, error: error.message });
      } else {
        console.log(`✓ User ${user.username} setup successfully`);
        results.push({ username: user.username, success: true });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Users setup completed',
      results 
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
