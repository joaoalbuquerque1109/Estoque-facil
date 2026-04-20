-- ============================================================================
-- SUPABASE MIGRATION: Import Control Sheet Data
-- ============================================================================
-- Imports all inventory rows from controle_insumos_medicacoes.xlsx.
-- The source spreadsheet stores expiration as month/year text, so this migration
-- keeps it as text instead of coercing values like "09/31" into a date.
-- Withdrawal dates in the spreadsheet do not include a year; this migration
-- assumes 2026 based on the current project data.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS expiration TEXT;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_allowed;

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
END
WHERE category NOT IN ('Medicação', 'Insumos');

ALTER TABLE public.products
  ADD CONSTRAINT products_category_allowed
  CHECK (category IN ('Medicação', 'Insumos'));

WITH product_rows (code, name, quantity, category, expiration) AS (
  VALUES
    ('INS-MIC-001', 'Micropore 5cm', 1, 'Insumos', '07/30'),
    ('INS-MIC-002', 'Micropore 5cm x 4,5', 1, 'Insumos', '04/26'),
    ('INS-FIO-001', 'Fio Vicryl 2-0', 1, 'Insumos', '06/29'),
    ('INS-ALG-001', 'Algodão rolo', 2, 'Insumos', NULL),
    ('INS-COM-001', 'Compressa de gazes', 2, 'Insumos', '08/30'),
    ('INS-POR-001', 'Porta lâminas', 4, 'Insumos', NULL),
    ('INS-FIO-002', 'Fio Nylon 2-0', 4, 'Insumos', '09/30'),
    ('INS-SWA-001', 'Swab cultura', 4, 'Insumos', NULL),
    ('INS-MIC-003', 'Micropore 10cm', 5, 'Insumos', '08/30'),
    ('INS-ATA-001', 'Atadura 10cm', 6, 'Insumos', '29/12'),
    ('INS-ATA-002', 'Atadura 30cm', 6, 'Insumos', '02/30'),
    ('INS-SON-001', 'Sonda uretral 4', 10, 'Insumos', NULL),
    ('INS-SON-002', 'Sonda uretral 6', 16, 'Insumos', NULL),
    ('INS-AVE-001', 'Avental', 10, 'Insumos', NULL),
    ('INS-CAM-001', 'Campo cirúrgico', 17, 'Insumos', NULL),
    ('INS-SER-001', 'Seringa 1ml', 93, 'Insumos', NULL),
    ('INS-SER-002', 'Seringa 3ml', 152, 'Insumos', NULL),
    ('INS-SER-003', 'Seringa 5ml', 53, 'Insumos', NULL),
    ('INS-SER-004', 'Seringa 10ml', 46, 'Insumos', NULL),
    ('INS-SER-005', 'Seringa 20ml', 20, 'Insumos', NULL),
    ('INS-CAT-002', 'Cateter periférico verde 18', 97, 'Insumos', '01/27'),
    ('INS-CAT-003', 'Cateter periférico azul 22', 6, 'Insumos', '11/29'),
    ('INS-CAT-004', 'Cateter periférico amarelo 24', 19, 'Insumos', '10/29'),
    ('INS-SCA-001', 'Scalp 21G', 56, 'Insumos', NULL),
    ('INS-SCA-002', 'Scalp 23G', 100, 'Insumos', NULL),
    ('MED-DIP-001', 'Dipirona', 5, 'Medicação', '04/26'),
    ('MED-MEL-001', 'Meloxicam', 0, 'Medicação', NULL),
    ('MED-DEX-001', 'Dexametasona', 12, 'Medicação', '09/27'),
    ('MED-ESC-001', 'Escopolamina', 7, 'Medicação', '09/28'),
    ('MED-TRA-001', 'Tramadol', 0, 'Medicação', '09/29'),
    ('MED-CLI-001', 'Clindamicina', 9, 'Medicação', '09/31'),
    ('MED-CEF-001', 'Ceftriaxona', 9, 'Medicação', '09/32'),
    ('MED-OME-001', 'Omeprazol', 1, 'Medicação', '09/38'),
    ('MED-OME-002', 'Omeprazol sódio', 5, 'Medicação', '02/27'),
    ('MED-AGU-001', 'Água p/ injetáveis', 50, 'Medicação', '02/28'),
    ('MED-SUC-001', 'Sucralfim', 18, 'Medicação', '06/26'),
    ('MED-VIT-001', 'Vitamina K', 3, 'Medicação', '02/31'),
    ('MED-MET-001', 'Metoclopramida', 33, 'Medicação', '12/26'),
    ('MED-FUR-001', 'Furosemida', 2, 'Medicação', '06/26'),
    ('MED-ACI-001', 'Ácido tranexâmico', 6, 'Medicação', '29/04'),
    ('MED-EPI-001', 'Epinefrina', 10, 'Medicação', '10/26'),
    ('MED-MOR-001', 'Morfina', 3, 'Medicação', '07/07'),
    ('MED-MET-002', 'Metadona', 3, 'Medicação', '07/27'),
    ('MED-CLO-001', 'Cloreto de potássio', 32, 'Medicação', '04/26'),
    ('MED-GLI-001', 'Glicose 50%', 45, 'Medicação', '11/26'),
    ('MED-GLI-002', 'Gliconato de cálcio', 2, 'Medicação', '07/26'),
    ('MED-SF0-001', 'SF 0,9% 250ml', 52, 'Medicação', '08/27'),
    ('MED-SF0-002', 'SF 0,9% 500ml', 1, 'Medicação', '06/27'),
    ('MED-SF0-003', 'SF 0,9% 1000ml', 3, 'Medicação', '12/27'),
    ('MED-ATR-001', 'Atropina', 6, 'Medicação', '04/27'),
    ('MED-FLU-001', 'Flumazenil', 5, 'Medicação', '09/26')
)
INSERT INTO public.products (
  name,
  name_lowercase,
  code,
  patrimony,
  type,
  quantity,
  unit,
  category,
  reference,
  expiration,
  image
)
SELECT
  name,
  LOWER(name),
  code,
  'N/A',
  'consumo'::product_type,
  quantity,
  'und',
  category,
  'Importado da planilha controle_insumos_medicacoes.xlsx',
  expiration,
  'https://placehold.co/40x40.png'
FROM product_rows
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  name_lowercase = EXCLUDED.name_lowercase,
  patrimony = EXCLUDED.patrimony,
  type = EXCLUDED.type,
  quantity = EXCLUDED.quantity,
  unit = EXCLUDED.unit,
  category = EXCLUDED.category,
  reference = EXCLUDED.reference,
  expiration = EXCLUDED.expiration,
  image = COALESCE(public.products.image, EXCLUDED.image);

WITH withdrawal_products (code, name, category) AS (
  VALUES
    ('MED-MET-003', 'Metronidazol', 'Medicação'),
    ('INS-CAT-001', 'Cateter 16G (verde)', 'Insumos'),
    ('INS-CAT-005', 'Cateter 14G (verde)', 'Insumos'),
    ('INS-CAT-006', 'Cateter 20G (rosa)', 'Insumos'),
    ('INS-EQU-001', 'Equipo', 'Insumos'),
    ('MED-SOR-001', 'Soro NaCl', 'Medicação'),
    ('MED-SOR-002', 'Soro Lactato', 'Medicação'),
    ('INS-INF-001', 'Infusão multivias', 'Insumos'),
    ('INS-EQU-002', 'Equipo microgotas', 'Insumos'),
    ('INS-EQU-003', 'Equipo macrogotas', 'Insumos'),
    ('INS-SWA-002', 'Swab p/ coleta', 'Insumos'),
    ('INS-MAS-001', 'Máscara descartável', 'Insumos'),
    ('MED-MAN-001', 'Manitol 20%', 'Medicação'),
    ('INS-AGU-001', 'Agulha 30x8', 'Insumos'),
    ('INS-AGU-002', 'Agulha 30x10', 'Insumos'),
    ('INS-SCA-003', 'Scalp 25G', 'Insumos'),
    ('MED-PRO-001', 'Prometazina', 'Medicação'),
    ('MED-COM-001', 'Complexo B', 'Medicação'),
    ('MED-DIA-001', 'Diazepam', 'Medicação'),
    ('INS-ALG-002', 'Algema hipoalergênica', 'Insumos'),
    ('INS-FIT-001', 'Fita microporosa', 'Insumos'),
    ('INS-ESP-001', 'Esparadrapo', 'Insumos'),
    ('INS-ATA-003', 'Atadura 20 cm', 'Insumos'),
    ('INS-LUV-001', 'Luva P', 'Insumos'),
    ('MED-CLO-002', 'Cloreto 0,9%', 'Medicação'),
    ('MED-RIN-001', 'Ringer Lactato', 'Medicação')
)
INSERT INTO public.products (
  name,
  name_lowercase,
  code,
  patrimony,
  type,
  quantity,
  unit,
  category,
  reference,
  expiration,
  image
)
SELECT
  name,
  LOWER(name),
  code,
  'N/A',
  'consumo'::product_type,
  0,
  'und',
  category,
  'Importado da aba Retiradas de materiais',
  NULL,
  'https://placehold.co/40x40.png'
FROM withdrawal_products
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  name_lowercase = EXCLUDED.name_lowercase,
  patrimony = COALESCE(NULLIF(public.products.patrimony, ''), EXCLUDED.patrimony),
  type = EXCLUDED.type,
  unit = COALESCE(NULLIF(public.products.unit, ''), EXCLUDED.unit),
  category = EXCLUDED.category,
  reference = EXCLUDED.reference,
  expiration = COALESCE(public.products.expiration, EXCLUDED.expiration),
  image = COALESCE(public.products.image, EXCLUDED.image);

WITH movement_rows (import_key, movement_date, quantity, product_code, measure, department) AS (
  VALUES
    ('controle_insumos_medicacoes:retirada:001', '2026-03-16T12:00:00+00', 5, 'MED-MET-003', '100 ml', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:002', '2026-03-16T12:00:00+00', 5, 'INS-CAT-001', '5 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:003', '2026-03-16T12:00:00+00', 3, 'INS-CAT-005', '3 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:004', '2026-03-16T12:00:00+00', 3, 'INS-CAT-004', '3 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:005', '2026-03-16T12:00:00+00', 2, 'INS-CAT-003', '2 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:006', '2026-03-16T12:00:00+00', 2, 'INS-CAT-006', '2 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:007', '2026-03-16T12:00:00+00', 1, 'INS-EQU-001', '1 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:008', '2026-03-16T12:00:00+00', 1, 'INS-SER-004', '1 und', 'Internamento'),
    ('controle_insumos_medicacoes:retirada:009', '2026-03-24T12:00:00+00', 10, 'MED-SOR-001', '10 und', 'Clínico'),
    ('controle_insumos_medicacoes:retirada:010', '2026-03-24T12:00:00+00', 10, 'MED-SOR-002', '10 und', 'Clínico'),
    ('controle_insumos_medicacoes:retirada:011', '2026-03-24T12:00:00+00', 15, 'INS-SER-003', '15 und', 'Clínico'),
    ('controle_insumos_medicacoes:retirada:012', '2026-03-25T12:00:00+00', 10, 'INS-SER-004', '10 und', 'Clínico'),
    ('controle_insumos_medicacoes:retirada:013', '2026-03-25T12:00:00+00', 8, 'INS-INF-001', '8 und', 'Clínico'),
    ('controle_insumos_medicacoes:retirada:014', '2026-03-25T12:00:00+00', 5, 'MED-AGU-001', '10 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:015', '2026-03-25T12:00:00+00', 3, 'INS-EQU-002', '3 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:016', '2026-03-25T12:00:00+00', 3, 'INS-EQU-003', '3 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:017', '2026-03-25T12:00:00+00', 2, 'INS-SWA-002', '2 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:018', '2026-03-25T12:00:00+00', 50, 'INS-MAS-001', '50 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:019', '2026-03-25T12:00:00+00', 1, 'MED-MAN-001', '250 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:020', '2026-03-25T12:00:00+00', 8, 'INS-AGU-001', '8 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:021', '2026-03-25T12:00:00+00', 8, 'INS-AGU-002', '8 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:022', '2026-03-25T12:00:00+00', 5, 'INS-SCA-002', '5 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:023', '2026-03-25T12:00:00+00', 8, 'INS-SCA-003', '8 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:024', '2026-03-25T12:00:00+00', 2, 'MED-DIP-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:025', '2026-03-25T12:00:00+00', 1, 'MED-FUR-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:026', '2026-03-25T12:00:00+00', 2, 'MED-VIT-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:027', '2026-03-25T12:00:00+00', 1, 'MED-PRO-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:028', '2026-03-25T12:00:00+00', 2, 'MED-COM-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:029', '2026-03-25T12:00:00+00', 1, 'MED-ACI-001', '5 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:030', '2026-03-25T12:00:00+00', 1, 'MED-CLI-001', '4 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:031', '2026-03-25T12:00:00+00', 1, 'MED-DIA-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:032', '2026-03-25T12:00:00+00', 2, 'MED-MET-001', '2 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:033', '2026-03-25T12:00:00+00', 1, 'MED-MET-002', '1 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:034', '2026-03-25T12:00:00+00', 1, 'MED-MOR-001', '1 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:035', '2026-03-25T12:00:00+00', 2, 'MED-DEX-001', '2.5 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:036', '2026-03-25T12:00:00+00', 1, 'MED-FLU-001', '5 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:037', '2026-03-25T12:00:00+00', 10, 'INS-SER-002', '10 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:038', '2026-03-25T12:00:00+00', 8, 'INS-SER-003', '8 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:039', '2026-03-25T12:00:00+00', 10, 'INS-SER-001', '10 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:040', '2026-03-25T12:00:00+00', 7, 'INS-ALG-002', '7 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:041', '2026-03-25T12:00:00+00', 1, 'INS-FIT-001', '1 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:042', '2026-03-25T12:00:00+00', 1, 'INS-ESP-001', '1 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:043', '2026-03-25T12:00:00+00', 1, 'INS-ATA-001', '1 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:044', '2026-03-25T12:00:00+00', 1, 'INS-ATA-003', '1 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:045', '2026-03-25T12:00:00+00', 1, 'INS-CAT-004', '1 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:046', '2026-03-25T12:00:00+00', 5, 'INS-CAT-006', '5 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:047', '2026-03-25T12:00:00+00', 1, 'INS-LUV-001', '100 und', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:048', '2026-03-25T12:00:00+00', 1, 'MED-CLO-002', '250 ml', 'Infecciosas'),
    ('controle_insumos_medicacoes:retirada:049', '2026-03-25T12:00:00+00', 1, 'MED-RIN-001', '500 ml', 'Infecciosas')
)
INSERT INTO public.movements (
  id,
  product_id,
  date,
  type,
  quantity,
  responsible,
  department,
  product_type,
  changes
)
SELECT
  uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, movement_rows.import_key),
  products.id,
  movement_rows.movement_date::TIMESTAMP WITH TIME ZONE,
  'Saída'::movement_type,
  movement_rows.quantity,
  'Planilha controle_insumos_medicacoes.xlsx',
  movement_rows.department,
  'consumo'::product_type,
  'Importado da aba Retiradas de materiais. Medida registrada: ' || movement_rows.measure
FROM movement_rows
JOIN public.products ON products.code = movement_rows.product_code
ON CONFLICT (id) DO UPDATE
SET
  product_id = EXCLUDED.product_id,
  date = EXCLUDED.date,
  type = EXCLUDED.type,
  quantity = EXCLUDED.quantity,
  responsible = EXCLUDED.responsible,
  department = EXCLUDED.department,
  product_type = EXCLUDED.product_type,
  changes = EXCLUDED.changes;
