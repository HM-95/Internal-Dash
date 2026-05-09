import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';
import { jwtVerify } from 'jose';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check internal authentication
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('internal_session')?.value;
  
  if (!sessionToken) {
    console.log('No session token found, redirecting to login');
    redirect('/login');
  }
  
  // Verify JWT token using jose (compatible with server components)
  let sessionData;
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    );
    
    const { payload } = await jwtVerify(sessionToken, secret);
    sessionData = payload;
  } catch (error) {
    console.log('Invalid session token, redirecting to login');
    redirect('/login');
  }
  
  console.log('Dashboard access granted for:', sessionData.username, 'Group:', sessionData.accessGroup);
  
  return (
    <DashboardLayoutClient 
      user={{
        username: sessionData.username as string,
        accessGroup: sessionData.accessGroup as string,
        userId: sessionData.userId as string
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}