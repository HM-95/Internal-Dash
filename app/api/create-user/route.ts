import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Create user with email/password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('User creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log('User created successfully:', {
      userId: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session
    });

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      message: data.user && !data.session 
        ? 'Please check your email for a confirmation link'
        : 'User created and signed in successfully'
    });

  } catch (error) {
    console.error('Unexpected error in create-user API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 