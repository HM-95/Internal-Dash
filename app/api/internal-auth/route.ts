import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSessionCookie, clearSessionCookie, logAccessAttempt, getCurrentSession } from '../../lib/internal-auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (process.env.NODE_ENV === 'development') {
      console.log('Internal auth API called with:', {
        username,
        passwordLength: password?.length,
      });
    }

    if (!username || !password) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Missing credentials:', { username, hasPassword: !!password });
      }
      await logAccessAttempt(username || 'unknown', 'login_failed', request, { error: 'Missing credentials' });
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Log login attempt
    await logAccessAttempt(username, 'login_attempt', request);

    const user = await authenticateUser(username, password);
    if (process.env.NODE_ENV === 'development') {
      console.log('Authentication result:', { user: !!user, username: user?.username });
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Authentication failed for user:', username);
      }
      await logAccessAttempt(username, 'login_failed', request, { error: 'Invalid credentials' });
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const sessionData = {
      username: user.username,
      accessGroup: user.accessGroup,
      loginTime: Date.now(),
      userId: user.id
    };

    let token: string;
    try {
      token = await setSessionCookie(sessionData);
    } catch (sessionError) {
      console.error('Error setting session cookie:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    try {
      await logAccessAttempt(username, 'login_success', request, { accessGroup: user.accessGroup });
    } catch (logError) {
      console.error('Error logging access:', logError);
    }
    
    // Create response with cookie header
    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        accessGroup: user.accessGroup
      }
    });
    
    // Set the cookie in the response headers as well
    response.cookies.set('internal_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
      path: '/'
    });
    
    return response;

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (session) {
      await logAccessAttempt(session.username, 'logout', request);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        accessGroup: session.accessGroup
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
