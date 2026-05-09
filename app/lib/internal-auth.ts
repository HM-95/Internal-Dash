import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export interface InternalUser {
  id: string;
  username: string;
  accessGroup: 'code_access' | 'non_code_access' | 'guest_access';
  isActive: boolean;
  lastLogin?: Date;
}

export interface SessionData {
  username: string;
  accessGroup: string;
  loginTime: number;
  userId: string;
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const SESSION_COOKIE_NAME = 'internal_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token for session
 */
export async function createSessionToken(sessionData: SessionData): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT(sessionData as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret);
    
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current session from cookies
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    console.log('getCurrentSession - Cookie check:', {
      cookieName: SESSION_COOKIE_NAME,
      hasToken: !!sessionToken,
      tokenLength: sessionToken?.length
    });
    
    if (!sessionToken) {
      console.log('getCurrentSession - No session token found');
      return null;
    }
    
    const session = await verifySessionToken(sessionToken);
    console.log('getCurrentSession - Verified session:', {
      hasSession: !!session,
      userId: session?.userId,
      username: session?.username
    });
    
    return session;
  } catch (error) {
    console.error('getCurrentSession - Error:', error);
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(sessionData: SessionData): Promise<string> {
  const token = await createSessionToken(sessionData);
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/'
  });
  
  return token;
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current user from internal session (client-side)
 */
export async function getCurrentUser(): Promise<InternalUser | null> {
  try {
    const response = await fetch('/api/internal-auth');
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.user) {
        return data.user as InternalUser;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(username: string, password: string): Promise<InternalUser | null> {
  try {
    // Use service role key for server-side authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('Authenticating user:', username);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: user, error } = await supabase
      .from('internal_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('Database query result:', { user, error });

    if (error || !user) {
      console.log('User not found or error:', error);
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await supabase
      .from('internal_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return {
      id: user.id,
      username: user.username,
      accessGroup: user.access_group,
      isActive: user.is_active,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Log access attempt
 */
export async function logAccessAttempt(
  username: string,
  action: 'login_attempt' | 'login_success' | 'login_failed' | 'logout',
  request?: NextRequest,
  metadata?: any
): Promise<void> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    await supabase
      .from('internal_access_logs')
      .insert({
        username,
        action,
        ip_address: request?.ip || request?.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request?.headers.get('user-agent') || 'unknown',
        metadata: metadata || {}
      });
  } catch (error) {
    console.error('Error logging access attempt:', error);
  }
}

/**
 * Check if user has specific access level
 */
export function hasAccess(userGroup: string, requiredGroups: string[]): boolean {
  return requiredGroups.includes(userGroup);
}

/**
 * Get all internal users (for admin purposes)
 */
export async function getInternalUsers(): Promise<InternalUser[]> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: users, error } = await supabase
      .from('internal_users')
      .select('id, username, access_group, is_active, last_login')
      .order('username');

    if (error || !users) {
      return [];
    }

    return users.map(user => ({
      id: user.id,
      username: user.username,
      accessGroup: user.access_group,
      isActive: user.is_active,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined
    }));
  } catch (error) {
    console.error('Error fetching internal users:', error);
    return [];
  }
}

/**
 * Add a new internal user (for admin purposes)
 */
export async function addInternalUser(
  username: string, 
  password: string, 
  accessGroup: 'code_access' | 'non_code_access' | 'guest_access'
): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const passwordHash = await hashPassword(password);
    
    const { error } = await supabase
      .from('internal_users')
      .insert({
        username,
        password_hash: passwordHash,
        access_group: accessGroup
      });

    return !error;
  } catch (error) {
    console.error('Error adding internal user:', error);
    return false;
  }
}