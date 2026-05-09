-- Create lists and list_items tables if they don't exist
-- This migration ensures the correct table structure for the import functionality

-- Create lists table
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  avg_followers NUMERIC DEFAULT 0,
  avg_views NUMERIC DEFAULT 0,
  avg_engagement NUMERIC DEFAULT 0,
  avg_buzz_score NUMERIC DEFAULT 0,
  creator_count INTEGER DEFAULT 0
);

-- Create list_items table (junction table)
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL, -- This references creatordata.id as TEXT
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, creator_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON public.lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_creator_id ON public.list_items(creator_id);

-- Enable RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lists
CREATE POLICY IF NOT EXISTS "Users can view their own lists" ON public.lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own lists" ON public.lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own lists" ON public.lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own lists" ON public.lists
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for list_items
CREATE POLICY IF NOT EXISTS "Users can view items in their own lists" ON public.list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists l 
      WHERE l.id = list_items.list_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert items in their own lists" ON public.list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists l 
      WHERE l.id = list_items.list_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete items in their own lists" ON public.list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lists l 
      WHERE l.id = list_items.list_id AND l.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.lists IS 'User-created lists for organizing creators';
COMMENT ON TABLE public.list_items IS 'Junction table linking lists to creators';
COMMENT ON COLUMN public.list_items.creator_id IS 'References creatordata.id as TEXT';
