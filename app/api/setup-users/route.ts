import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

type SeedUser = {
  username: string;
  password: string;
  access_group: 'code_access' | 'non_code_access' | 'guest_access';
};

function parseSeedUsers(): SeedUser[] | null {
  const raw = process.env.INTERNAL_USERS_SEED?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as SeedUser[];
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_USERS_SECRET?.trim();
  const headerSecret = request.headers.get('x-setup-secret');

  if (!setupSecret || headerSecret !== setupSecret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const users = parseSeedUsers();
  if (!users?.length) {
    return NextResponse.json(
      {
        error:
          'Configure INTERNAL_USERS_SEED with a JSON array of { username, password, access_group }',
      },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables are not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const results: { username: string; success: boolean; error?: string }[] = [];

  try {
    for (const user of users) {
      if (!user.username || !user.password || !user.access_group) {
        results.push({
          username: user.username || '(invalid)',
          success: false,
          error: 'Each entry needs username, password, and access_group',
        });
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, 12);

      const { error } = await supabase.from('internal_users').upsert(
        {
          username: user.username,
          password_hash: passwordHash,
          access_group: user.access_group,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'username' }
      );

      if (error) {
        results.push({ username: user.username, success: false, error: error.message });
      } else {
        results.push({ username: user.username, success: true });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User setup completed',
      results,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        error: 'Setup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
