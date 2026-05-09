import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getJwtSecretBytes } from './lib/jwt-secret'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Only run middleware on actual page routes, not static assets
  const pathname = req.nextUrl.pathname
  
  // Skip middleware for static assets, API routes, and other non-page requests
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') || // Files with extensions (images, css, js, etc.)
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/.well-known')
  ) {
    return res
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/invitation', '/waitlist', '/waitlist-success', '/private-beta'];
  
  // Check if route requires authentication
  if (pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    // Skip auth check for public routes
    if (publicRoutes.includes(pathname)) {
      return res;
    }
    
    try {
      // Check for internal session cookie
      const sessionToken = req.cookies.get('internal_session')?.value;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware checking session:', {
          path: pathname,
          hasToken: !!sessionToken,
          tokenLength: sessionToken?.length,
          jwtSecret: !!process.env.JWT_SECRET,
        })
      }

      if (!sessionToken) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No session token found, redirecting to login')
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }

      try {
        const secret = getJwtSecretBytes()
        const { payload } = await jwtVerify(sessionToken, secret)

        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware session check:', {
            username: payload.username,
            accessGroup: payload.accessGroup,
            path: pathname,
          })
        }
      } catch (jwtError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Invalid session token, redirecting to login:', jwtError)
        }
        return NextResponse.redirect(new URL('/login', req.url))
      }
      
    } catch (err) {
      console.error('Middleware error:', err)
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}