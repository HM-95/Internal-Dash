// Client-safe helpers for internal auth. Do NOT import next/headers here.

export interface InternalUser {
  id: string;
  username: string;
  accessGroup: string;
  isActive: boolean;
  lastLogin?: string | null;
}

export async function getCurrentUser(): Promise<InternalUser | null> {
  try {
    const res = await fetch('/api/internal-auth', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.authenticated && data?.user) return data.user as InternalUser;
    return null;
  } catch {
    return null;
  }
}


