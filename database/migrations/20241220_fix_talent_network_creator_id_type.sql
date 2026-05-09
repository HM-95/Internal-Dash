-- Fix talent_network table to use UUID for creator_id instead of BIGINT
-- This matches the healthwellness.id field which is UUID
-- Also removes foreign key constraint on user_id to support internal_users

-- Check if the table exists and if creator_id is BIGINT, then alter it
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_network') THEN
    -- Check if creator_id is BIGINT
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'talent_network' 
      AND column_name = 'creator_id' 
      AND data_type = 'bigint'
    ) THEN
      -- Drop the table and recreate with UUID (loses data, but table is likely new/empty)
      DROP TABLE public.talent_network CASCADE;
      
      -- Recreate the table with UUID creator_id and no foreign key on user_id
      CREATE TABLE public.talent_network (
        id BIGSERIAL PRIMARY KEY,
        creator_id UUID NOT NULL, -- Changed from BIGINT to UUID to match healthwellness.id
        user_id UUID NOT NULL, -- No foreign key to support internal_users
        price INTEGER DEFAULT NULL,
        status TEXT DEFAULT 'No reply',
        channel TEXT DEFAULT NULL,
        what_do_you_post TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, creator_id)
      );
    ELSE
      -- Table exists but creator_id is already UUID, just remove foreign key if it exists
      ALTER TABLE public.talent_network
      DROP CONSTRAINT IF EXISTS talent_network_user_id_fkey;
    END IF;
  ELSE
    -- Table doesn't exist, create it with UUID
    CREATE TABLE public.talent_network (
      id BIGSERIAL PRIMARY KEY,
      creator_id UUID NOT NULL,
      user_id UUID NOT NULL, -- No foreign key to support internal_users
      price INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'No reply',
      channel TEXT DEFAULT NULL,
      what_do_you_post TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, creator_id)
    );
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_talent_network_user_id ON public.talent_network(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_network_creator_id ON public.talent_network(creator_id);
CREATE INDEX IF NOT EXISTS idx_talent_network_status ON public.talent_network(status);
CREATE INDEX IF NOT EXISTS idx_talent_network_channel ON public.talent_network(channel);

-- Enable RLS
ALTER TABLE public.talent_network ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own talent network entries
CREATE POLICY "Users can view their own talent network entries" ON public.talent_network
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own talent network entries
CREATE POLICY "Users can insert their own talent network entries" ON public.talent_network
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own talent network entries
CREATE POLICY "Users can update their own talent network entries" ON public.talent_network
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own talent network entries
CREATE POLICY "Users can delete their own talent network entries" ON public.talent_network
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.talent_network IS 'Tracks creators in the talent network with status, channel, and pricing information';
COMMENT ON COLUMN public.talent_network.creator_id IS 'References creator from healthwellness table (UUID)';
COMMENT ON COLUMN public.talent_network.price IS 'User-defined price value in dollars. NULL represents N/A (no price set). Displayed with $ prefix in UI.';
COMMENT ON COLUMN public.talent_network.status IS 'Status of the creator in the network (No reply, Form filled, Not interested, etc.)';
COMMENT ON COLUMN public.talent_network.channel IS 'Channel through which the creator was contacted (Email w/o brand, Inbound, etc.)';
COMMENT ON COLUMN public.talent_network.what_do_you_post IS 'User-defined description of what the creator posts.';

