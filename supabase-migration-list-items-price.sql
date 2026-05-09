-- Migration to add price column to list_items table
-- This allows users to set custom price values for each creator in their lists

-- Add price column to list_items table as INTEGER (stores dollar amounts)
-- NULL represents 'N/A' - no price set
ALTER TABLE public.list_items 
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT NULL;

-- Create index for better query performance when filtering/sorting by price
CREATE INDEX IF NOT EXISTS idx_list_items_price ON public.list_items(price);

-- Update RLS policy to allow users to update items in their own lists (including price)
DROP POLICY IF EXISTS "Users can update items in their own lists" ON public.list_items;

CREATE POLICY "Users can update items in their own lists" ON public.list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lists l 
      WHERE l.id = list_items.list_id AND l.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN public.list_items.price IS 'User-defined price value in dollars for the creator in this list. NULL represents N/A (no price set). Displayed with $ prefix in UI.';
