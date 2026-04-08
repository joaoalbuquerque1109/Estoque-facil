-- ============================================================================
-- SUPABASE MIGRATION: Add Product Reference Column
-- ============================================================================
-- Aligns the database schema with the product forms that already collect
-- the storage/location reference for each item.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reference TEXT NOT NULL DEFAULT 'N/A';

UPDATE public.products
SET reference = 'N/A'
WHERE reference IS NULL OR BTRIM(reference) = '';
