'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { BuzzberryDashboard } from '../screens/BuzzberryDashboard';

export function AISearchPage() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');

  return (
    <div className="bg-black min-h-full">
      <BuzzberryDashboard initialPrompt={prompt || undefined} />
    </div>
  );
}