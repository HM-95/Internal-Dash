'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export interface InternalUser {
  username: string;
  accessGroup: string;
  userId: string;
}

interface InternalAuthContextType {
  user: InternalUser | null;
}

const InternalAuthContext = createContext<InternalAuthContextType>({
  user: null,
});

export const useInternalAuth = () => {
  const context = useContext(InternalAuthContext);
  if (!context) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
};

interface InternalAuthProviderProps {
  children: ReactNode;
  user: InternalUser;
}

export const InternalAuthProvider: React.FC<InternalAuthProviderProps> = ({ 
  children, 
  user 
}) => {
  return (
    <InternalAuthContext.Provider value={{ user }}>
      {children}
    </InternalAuthContext.Provider>
  );
};
