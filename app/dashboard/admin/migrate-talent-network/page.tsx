"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function MigrateTalentNetworkPage() {
  const [copied, setCopied] = useState(false);

  const migrationSQL = `-- Fix talent_network table to use UUID for creator_id
-- Run this SQL in Supabase SQL Editor (Dashboard > SQL Editor)

-- Drop and recreate the table with UUID creator_id
-- Note: This removes the foreign key constraint on user_id to support internal_users
DROP TABLE IF EXISTS public.talent_network CASCADE;

CREATE TABLE public.talent_network (
  id BIGSERIAL PRIMARY KEY,
  creator_id UUID NOT NULL,
  user_id UUID NOT NULL, -- No foreign key to support internal_users authentication
  price INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'No reply',
  channel TEXT DEFAULT NULL,
  what_do_you_post TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_talent_network_user_id ON public.talent_network(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_network_creator_id ON public.talent_network(creator_id);
CREATE INDEX IF NOT EXISTS idx_talent_network_status ON public.talent_network(status);
CREATE INDEX IF NOT EXISTS idx_talent_network_channel ON public.talent_network(channel);

-- Enable RLS
ALTER TABLE public.talent_network ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own talent network entries" ON public.talent_network
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own talent network entries" ON public.talent_network
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own talent network entries" ON public.talent_network
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own talent network entries" ON public.talent_network
  FOR DELETE USING (auth.uid() = user_id);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(migrationSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Talent Network Migration</h1>
        
        <Card className="bg-[#0f1419] border-gray-700 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-6">
              <li>Open your Supabase Dashboard</li>
              <li>Go to SQL Editor</li>
              <li>Copy the SQL below</li>
              <li>Paste it into the SQL Editor</li>
              <li>Click "Run" to execute the migration</li>
            </ol>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-white">Migration SQL:</h3>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>

            <pre className="bg-[#1a1f2e] border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
              <code>{migrationSQL}</code>
            </pre>

            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Warning:</strong> This migration will drop and recreate the talent_network table, 
                which will delete any existing data. If you have important data, back it up first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

