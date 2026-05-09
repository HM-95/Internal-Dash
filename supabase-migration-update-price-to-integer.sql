-- Migration to update existing price column from TEXT to INTEGER
-- Run this if you already have the price column as TEXT and need to convert it

-- First, update any existing 'N/A' text values to NULL
UPDATE public.list_items 
SET price = NULL 
WHERE price = 'N/A' OR price IS NULL OR price = '';

-- For any numeric text values, we'll handle them in the type conversion
-- Drop the old column and recreate it as INTEGER
-- This is safer than ALTER COLUMN TYPE which can fail with incompatible data

-- Store existing data temporarily
CREATE TEMP TABLE temp_price_data AS 
SELECT 
  id, 
  CASE 
    WHEN price ~ '^\d+$' THEN price::INTEGER  -- If it's a plain number
    WHEN price ~ '^\$\d+$' THEN SUBSTRING(price FROM 2)::INTEGER  -- If it starts with $
    ELSE NULL  -- Any other format becomes NULL
  END as price_int
FROM public.list_items 
WHERE price IS NOT NULL;

-- Drop the old column
ALTER TABLE public.list_items DROP COLUMN IF EXISTS price;

-- Add new INTEGER column
ALTER TABLE public.list_items ADD COLUMN price INTEGER DEFAULT NULL;

-- Restore data
UPDATE public.list_items li
SET price = tpd.price_int
FROM temp_price_data tpd
WHERE li.id = tpd.id;

-- Drop temp table
DROP TABLE temp_price_data;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_list_items_price ON public.list_items(price);

-- Add comment
COMMENT ON COLUMN public.list_items.price IS 'User-defined price value in dollars for the creator in this list. NULL represents N/A (no price set). Displayed with $ prefix in UI.';

