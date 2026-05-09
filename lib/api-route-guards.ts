import { NextResponse } from 'next/server';

/** Debug / diagnostic HTTP handlers (password checks, raw DB introspection, etc.) */
export function notFoundUnlessDebugApiEnabled(): NextResponse | null {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_API !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}

/** Destructive or data-moving routes (migrations, bulk updates via HTTP) */
export function notFoundUnlessDangerousApiEnabled(): NextResponse | null {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_DANGEROUS_MIGRATIONS !== 'true'
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}
