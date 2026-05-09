-- Create talent_network table to track creators in the talent network
CREATE TABLE IF NOT EXISTS public.talent_network (
  id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price INTEGER DEFAULT NULL,
  status TEXT DEFAULT 'No reply',
  channel TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

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
COMMENT ON COLUMN public.talent_network.creator_id IS 'References creator from healthwellness table';
COMMENT ON COLUMN public.talent_network.price IS 'User-defined price value in dollars. NULL represents N/A (no price set). Displayed with $ prefix in UI.';
COMMENT ON COLUMN public.talent_network.status IS 'Status of the creator in the network (No reply, Form filled, Not interested, etc.)';
COMMENT ON COLUMN public.talent_network.channel IS 'Channel through which the creator was contacted (Email w/o brand, Inbound, etc.)';

