-- ============================================================================
-- SUPABASE MIGRATION: Restrict Product Categories
-- ============================================================================
-- Normalizes existing products and keeps future categories aligned with the
-- medication/supplies spreadsheet structure.

UPDATE public.products
SET category = CASE
  WHEN LOWER(BTRIM(category)) IN (
    'medicação',
    'medicações',
    'medicacao',
    'medicacoes',
    'medicamento',
    'medicamentos'
  ) THEN 'Medicação'
  ELSE 'Insumos'
END;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_allowed;

ALTER TABLE public.products
  ADD CONSTRAINT products_category_allowed
  CHECK (category IN ('Medicação', 'Insumos'));
