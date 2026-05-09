// DISABLED - OAuth callback disabled for internal access
// This file is preserved for potential future re-enablement

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // OAuth is disabled for internal access - redirect to login
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl.toString());
}
