'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BuzzberryChatPage } from '../../components/dashboard/screens/BuzzberryChatPage';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

export default function DashboardChatPage() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  const listId = searchParams.get('listId');
  const listName = searchParams.get('listName');
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };
    
    getUser();
  }, [supabase]);

  return (
    <div className="bg-black min-h-full">
      <BuzzberryChatPage 
        initialPrompt={prompt || undefined} 
        user={user || undefined}
      />
    </div>
  );
} 