# Price Column Migration Guide

This guide explains how to add the Price column feature to the creator lists.

## Database Migration

### For New Installations

To add the price column to your database, run the SQL migration in `supabase-migration-list-items-price.sql`:

```sql
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
```

### For Existing Installations (Upgrading from TEXT to INTEGER)

If you already have the price column as TEXT, run the migration in `supabase-migration-update-price-to-integer.sql` to convert it to INTEGER format.

## Features

1. **Price Column**: A new column appears after the "Influencers" column and before the "Followers" column in the creator list table.

2. **Default Value**: All creators have 'N/A' as their default price value (stored as NULL in database).

3. **Dollar Formatting**: Prices are automatically formatted with a '$' prefix:
   - User enters: `400`
   - Display shows: `$400`
   - 'N/A' is shown when no price is set

4. **Inline Editing**: Users can click on any price value to edit it inline:
   - Click on the price to start editing
   - Type the numeric value (numbers only)
   - Press Enter to save or Escape to cancel
   - Click outside to save
   - The '$' sign is automatically added on save

5. **Sorting**: Price column supports ascending/descending sorting just like Followers column
   - Click the sort icon to toggle between ascending/descending
   - NULL values (N/A) appear at the end when sorting descending

6. **Persistence**: Price values are stored in the `list_items` table in Supabase as integers and are associated with each creator in each specific list.

## Implementation Details

- The price is stored as INTEGER in the database (dollars only, no cents)
- NULL in database represents 'N/A' in the UI
- Each list can have different price values for the same creator
- The price column is fully sortable with visual indicators
- Values in Influencers, Price, and Followers columns are aligned 2px to the left for better visual consistency
- The visual styling matches other columns for consistency

## Testing

After applying the migration:

1. Open the My Lists page
2. Open any list to view the creator table
3. Verify the Price column appears between Influencers and Followers with a sort icon
4. Click on any price value (shows 'N/A' by default)
5. Enter a numeric value (e.g., 400) and press Enter
6. Verify it displays as '$400'
7. Click the sort icon to test sorting functionality
8. Refresh the page to confirm the value persisted

## Notes

- Migration files:
  - `supabase-migration-list-items-price.sql` - For new installations
  - `supabase-migration-update-price-to-integer.sql` - For upgrading existing TEXT column
- Price values are specific to each list-creator combination
- Users can only edit prices in their own lists (enforced by RLS policies)
- Only positive integers are allowed (enforced by frontend validation)
