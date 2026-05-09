import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

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
  
  // Verify JWT token
  let sessionData;
  try {
    sessionData = jwt.verify(sessionToken, JWT_SECRET) as any;
  } catch (error) {
    console.log('Invalid session token, redirecting to login');
    redirect('/login');
  }
  
  console.log('Dashboard access granted for:', sessionData.username, 'Group:', sessionData.accessGroup);
  
  return (
    <DashboardLayoutClient 
      user={{
        username: sessionData.username,
        accessGroup: sessionData.accessGroup,
        userId: sessionData.userId
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
