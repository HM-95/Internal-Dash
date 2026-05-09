# Reverting to Public Platform

This document provides instructions for reverting the Buzzberry platform from internal-only access back to the public invitation-based system.

## Overview

The platform was converted to internal-only access with the following changes:
- Replaced Supabase Auth with internal username/password authentication
- Disabled onboarding flow
- Disabled Stripe integration
- Disabled invitation system
- Disabled OAuth (Google Sign-in)

All original code has been preserved with backup files.

## Files to Restore

### 1. Authentication System

**Restore Supabase Auth:**
```bash
# Restore original login page
cp app/login/page-original-backup.tsx app/login/page.tsx

# Restore original dashboard layout
cp app/dashboard/layout-original-backup.tsx app/dashboard/layout.tsx

# Restore original main page
# (The main page was modified to redirect to login instead of invitation)
```

**Restore OAuth Callback:**
```bash
cp app/auth/callback/route-original-backup.ts app/auth/callback/route.ts
```

### 2. Onboarding System

**Restore Onboarding:**
```bash
cp app/onboarding/page-original-backup.tsx app/onboarding/page.tsx
```

### 3. Invitation System

**Restore Invitation System:**
```bash
cp app/invitation/page-original-backup.tsx app/invitation/page.tsx
```

### 4. Middleware

**Restore Supabase Middleware:**
```typescript
// Replace middleware.ts with original Supabase middleware
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  
  // Only run auth checks on actual page routes
  if (pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/auth')) {
    const supabase = createMiddlewareClient({ req, res })
    
    try {
      // Refresh session if expired - required for Server Components
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('Middleware session error:', error.message)
        // Don't block the request, just log the error
      } else {
        // Only log session info for actual page requests, not static assets
        console.log('Middleware session check:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          path: pathname 
        })
      }
      
      // Allow all requests to proceed, even if there are auth issues
      // This ensures users can still access the dashboard
      
    } catch (err) {
      console.error('Middleware error:', err)
      // Don't block the request on middleware errors
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Environment Variables to Restore

**Add back to .env.local:**
```env
# Supabase Auth (restore these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Integration (restore these)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Remove internal auth variables
# JWT_SECRET=...
# INTERNAL_AUTH_SECRET=...
```

## Database Changes

### Remove Internal Tables (Optional)
```sql
-- Only run if you want to completely remove internal access system
DROP TABLE IF EXISTS public.internal_access_logs;
DROP TABLE IF EXISTS public.internal_users;
```

### Restore Supabase Auth Tables
Ensure these tables exist and are properly configured:
- `auth.users` (Supabase Auth)
- `user_preferences`
- `chat_sessions`
- `chat_messages`
- `user_profiles`

## Code Changes Required

### 1. Restore Login Page
- Change username field back to email field
- Restore Google Sign-in button
- Restore invitation code verification
- Restore Supabase auth integration

### 2. Restore Main Page
```typescript
// Restore original logic in app/page.tsx
useEffect(() => {
  const checkAuthAndRedirect = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        router.push('/invitation');
        return;
      }

      if (session?.user) {
        // Check user preferences and redirect accordingly
        // ... original logic
      } else {
        router.push('/invitation');
      }
    } catch (err) {
      console.error('Unexpected error checking auth:', err);
      router.push('/invitation');
    } finally {
      setIsLoading(false);
    }
  };
  
  checkAuthAndRedirect();
}, [router, supabase]);
```

### 3. Restore Dashboard Layout
- Restore subscription status checks
- Restore onboarding completion checks
- Restore Supabase user session handling

### 4. Restore API Endpoints
- Re-enable all `/api/stripe/*` endpoints
- Restore `/api/create-user` endpoint
- Update all protected endpoints to use Supabase auth

## Components to Re-enable

### 1. Google Sign-in Button
```typescript
// In app/login/page.tsx, restore:
import { GoogleSignInButton } from '../components/GoogleSignInButton';

// And add back the Google Sign-in button in the UI
```

### 2. Onboarding Components
- `NewOnboardingFlow.tsx`
- `OnboardingPricingPage.tsx`
- All onboarding-related components

### 3. Invitation Components
- All invitation-related components and pages

## Testing Checklist

After reverting, test the following:

1. **Authentication Flow:**
   - [ ] Invitation code entry works
   - [ ] Email/password login works
   - [ ] Google OAuth works
   - [ ] Session persistence works

2. **Onboarding Flow:**
   - [ ] New users are redirected to onboarding
   - [ ] Onboarding completion works
   - [ ] Subscription selection works

3. **Dashboard Access:**
   - [ ] Authenticated users can access dashboard
   - [ ] Subscription status is checked
   - [ ] User preferences are loaded

4. **Stripe Integration:**
   - [ ] Payment processing works
   - [ ] Webhook handling works
   - [ ] Subscription management works

## Rollback Steps

1. **Backup Current State:**
   ```bash
   # Create backup of current internal system
   cp -r app app-internal-backup
   cp middleware.ts middleware-internal-backup.ts
   ```

2. **Restore Original Files:**
   ```bash
   # Restore all original files as listed above
   ```

3. **Update Environment Variables:**
   - Add back Supabase and Stripe environment variables
   - Remove internal auth variables

4. **Test Authentication:**
   - Test invitation system
   - Test email/password login
   - Test Google OAuth
   - Test onboarding flow

5. **Deploy Changes:**
   - Deploy to staging first
   - Test thoroughly
   - Deploy to production

## Notes

- All original code has been preserved in backup files
- The internal access system can be completely removed if not needed
- Database tables for internal access can be dropped if not needed
- Environment variables should be updated in your deployment platform

## Support

If you encounter issues during the reversion process:
1. Check that all backup files exist
2. Verify environment variables are correct
3. Test each component individually
4. Check Supabase dashboard for auth configuration
5. Verify Stripe webhook endpoints are configured
