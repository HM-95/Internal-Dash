import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { notFoundUnlessDebugApiEnabled } from '../../../lib/api-route-guards';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const blocked = notFoundUnlessDebugApiEnabled();
  if (blocked) return blocked;

  try {
    const { username, password } = await request.json();

    console.log('Debug auth for:', username);

    // 1. Check if user exists in database
    const { data: user, error: userError } = await supabase
      .from('internal_users')
      .select('*')
      .eq('username', username)
      .single();

    console.log('User query result:', { user, userError });

    if (userError) {
      return NextResponse.json({
        step: 'user_lookup',
        success: false,
        error: userError.message,
        details: userError
      });
    }

    if (!user) {
      return NextResponse.json({
        step: 'user_lookup',
        success: false,
        error: 'User not found',
        userExists: false
      });
    }

    // 2. Check if user is active
    if (!user.is_active) {
      return NextResponse.json({
        step: 'user_active_check',
        success: false,
        error: 'User is not active',
        userActive: false
      });
    }

    // 3. Test password verification
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password verification result:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json({
        step: 'password_verification',
        success: false,
        error: 'Invalid password',
        passwordValid: false,
        // Don't expose the actual hash in production
        hashLength: user.password_hash.length
      });
    }

    // 4. Test password hash generation (for comparison)
    const testHash = await bcrypt.hash(password, 12);
    const testVerification = await bcrypt.compare(password, testHash);

    return NextResponse.json({
      step: 'success',
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username,
        accessGroup: user.access_group,
        isActive: user.is_active,
        lastLogin: user.last_login
      },
      debug: {
        passwordValid: isValidPassword,
        testHashGeneration: testVerification,
        originalHashLength: user.password_hash.length,
        testHashLength: testHash.length
      }
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      step: 'error',
      success: false,
      error: 'Debug authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
