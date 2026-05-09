import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  
  console.log('OAuth callback received:', { 
    code: !!code, 
    error, 
    errorDescription,
    fullUrl: request.url 
  })
  
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    
    // If it's a database error, try to handle it gracefully
    if (errorDescription?.includes('Database error saving new user')) {
      console.log('Database error detected - attempting to handle gracefully')
      
      try {
        const supabase = createRouteHandlerClient({ cookies })
        
        // Try to get any existing session first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Existing session found despite database error, proceeding to dashboard')
          const redirectUrl = new URL('/dashboard', request.url)
          return NextResponse.redirect(redirectUrl.toString())
        }
        
        // If no session, redirect to signup page with helpful message
        console.log('No session found, redirecting to signup page')
        const signupUrl = new URL(`/invitation?error=${encodeURIComponent('Please use the invitation code to access the platform or contact support if the issue persists.')}`, request.url)
        return NextResponse.redirect(signupUrl.toString())
      } catch (sessionError) {
        console.log('Session check failed, redirecting to signup page')
        const signupUrl = new URL(`/invitation?error=${encodeURIComponent('Please use the invitation code to access the platform or contact support if the issue persists.')}`, request.url)
        return NextResponse.redirect(signupUrl.toString())
      }
    }
    
    const errorUrl = new URL(`/invitation?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, request.url)
    return NextResponse.redirect(errorUrl.toString())
  }
  
  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        
        // If it's a database error, redirect to signup
        if (exchangeError.message.includes('Database error')) {
          const signupUrl = new URL(`/invitation?error=${encodeURIComponent('Please use the invitation code to access the platform or contact support if the issue persists.')}`, request.url)
          return NextResponse.redirect(signupUrl.toString())
        }
        
        const errorUrl = new URL(`/invitation?error=${encodeURIComponent('Authentication failed. Please try again.')}`, request.url)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      console.log('Session exchange successful:', { 
        user: data.user?.email,
        userId: data.user?.id,
        session: !!data.session 
      })
      
      // Verify the session was created and has a user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session verification error:', sessionError)
        const errorUrl = new URL(`/invitation?error=${encodeURIComponent('Session verification failed. Please try again.')}`, request.url)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      if (!session?.user) {
        console.error('No user found in session after OAuth')
        const errorUrl = new URL(`/invitation?error=${encodeURIComponent('No user found in session. Please try again.')}`, request.url)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      console.log('Session verified successfully:', { 
        hasSession: !!session, 
        userId: session.user.id,
        userEmail: session.user.email,
        accessToken: !!session.access_token 
      })
      
      // Check if this is an existing user by looking for user_preferences
      console.log('Checking if user exists in system...')
      const { data: existingUser, error: userCheckError } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single()
      
      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking user existence:', userCheckError)
        const errorUrl = new URL(`/invitation?error=${encodeURIComponent('Error validating user account. Please try again.')}`, request.url)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      // If no user_preferences record exists, this is a new user trying to sign up via Google
      if (!existingUser) {
        console.log('New user detected via Google OAuth - rejecting signup')
        
        // Sign out the user since we don't want them to be authenticated
        await supabase.auth.signOut()
        
        const errorUrl = new URL(`/invitation?error=${encodeURIComponent('Google Sign In is only available for existing users. Please use the invitation code to access the platform.')}&description=${encodeURIComponent('If you already have an account, make sure you\'re using the same email address.')}`, request.url)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      console.log('Existing user confirmed, proceeding with authentication')
      
      // Successfully authenticated existing user - redirect to dashboard
      console.log('OAuth authentication successful, redirecting to dashboard')
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl.toString())
      
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      const errorUrl = new URL(`/invitation?error=${encodeURIComponent('Unexpected error during authentication. Please try again.')}`, request.url)
      return NextResponse.redirect(errorUrl.toString())
    }
  } else {
    console.error('No code received in callback')
    const errorUrl = new URL('/invitation?error=no_code', request.url)
    return NextResponse.redirect(errorUrl.toString())
  }
} 