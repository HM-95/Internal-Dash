import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';
import { jwtVerify } from 'jose';
import { getJwtSecretBytes } from '../../lib/jwt-secret';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('internal_session')?.value;

  if (!sessionToken) {
    if (process.env.NODE_ENV === 'development') {
      console.log('No session token found, redirecting to login');
    }
    redirect('/login');
  }

  let sessionData: {
    username: string;
    accessGroup: string;
    userId: string;
  };

  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(sessionToken, secret);
    sessionData = {
      username: payload.username as string,
      accessGroup: payload.accessGroup as string,
      userId: payload.userId as string,
    };
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.log('Invalid session token, redirecting to login');
    }
    redirect('/login');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Dashboard access granted for:',
      sessionData.username,
      'Group:',
      sessionData.accessGroup
    );
  }

  return (
    <DashboardLayoutClient
      user={{
        username: sessionData.username,
        accessGroup: sessionData.accessGroup,
        userId: sessionData.userId,
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
