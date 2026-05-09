import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Use the Next.js Auth Helpers browser client so the Supabase session
// from cookies is available in client components (lists page, etc.)
export const supabase = createClientComponentClient();