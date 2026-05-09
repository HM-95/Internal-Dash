import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSessionCookie, clearSessionCookie, logAccessAttempt, getCurrentSession } from '../../lib/internal-auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    console.log('Internal auth API called with:', { username, passwordLength: password?.length });

    if (!username || !password) {
      console.log('Missing credentials:', { username, password: !!password });
      await logAccessAttempt(username || 'unknown', 'login_failed', request, { error: 'Missing credentials' });
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Log login attempt
    await logAccessAttempt(username, 'login_attempt', request);

    // Authenticate user
    console.log('Attempting to authenticate user:', username);
    const user = await authenticateUser(username, password);
    console.log('Authentication result:', { user: !!user, username: user?.username });

    if (!user) {
      console.log('Authentication failed for user:', username);
      await logAccessAttempt(username, 'login_failed', request, { error: 'Invalid credentials' });
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    console.log('Creating session for user:', user.username);
    const sessionData = {
      username: user.username,
      accessGroup: user.accessGroup,
      loginTime: Date.now(),
      userId: user.id
    };

    console.log('Session data:', sessionData);
    
    let token: string;
    try {
      token = await setSessionCookie(sessionData);
      console.log('Session cookie set successfully');
    } catch (sessionError) {
      console.error('Error setting session cookie:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    try {
      await logAccessAttempt(username, 'login_success', request, { accessGroup: user.accessGroup });
      console.log('Access log recorded successfully');
    } catch (logError) {
      console.error('Error logging access:', logError);
    }

    console.log('Returning success response with cookie');
    
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
