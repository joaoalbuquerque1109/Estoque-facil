-- ============================================================================
-- SUPABASE MIGRATION: Initial Schema Setup
-- ============================================================================
-- This migration creates the complete database schema for Gerenciamento de Estoque
-- Includes: users, products, movements, and storage configuration

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- 2. CREATE ENUM TYPES
-- ============================================================================
CREATE TYPE product_type AS ENUM ('consumo', 'permanente');
CREATE TYPE movement_type AS ENUM ('Entrada', 'Saída', 'Devolução', 'Auditoria');
CREATE TYPE entry_type AS ENUM ('Oficial', 'Não Oficial');
CREATE TYPE user_role AS ENUM ('Admin', 'Operator');


-- ============================================================================
-- 3. CREATE TABLES
-- ============================================================================

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'Operator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_lowercase TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  patrimony TEXT NOT NULL,
  type product_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Movements table
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type movement_type NOT NULL,
  entry_type entry_type,
  quantity INTEGER NOT NULL,
  responsible TEXT NOT NULL,
  department TEXT,
  supplier TEXT,
  invoice TEXT,
  product_type product_type,
  changes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);


-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_name_lowercase ON public.products(name_lowercase);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Movements indexes
CREATE INDEX IF NOT EXISTS idx_movements_product_id ON public.movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.movements(date DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_department ON public.movements(department);
CREATE INDEX IF NOT EXISTS idx_movements_responsible ON public.movements(responsible);

-- Full-text search indexes (commented out - not required)
-- CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING GIN(to_tsvector('portuguese', name));
-- CREATE INDEX IF NOT EXISTS idx_products_code_search ON public.products USING GIN(to_tsvector('simple', code));


-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for products
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for movements
CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON public.movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 7. CREATE RLS POLICIES
-- ============================================================================

-- PROFILES POLICIES
-- Profiles: Users can read their own profile or admins can read all
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

-- Profiles: Only admins can update roles
CREATE POLICY "Only admins can update user roles"
  ON public.profiles
  FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

-- Profiles: Admins can insert
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

-- PRODUCTS POLICIES
-- Products: All authenticated users can read
CREATE POLICY "Authenticated users can read products"
  ON public.products
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Products: Only admins can insert
CREATE POLICY "Only admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

-- Products: Only admins can update products
CREATE POLICY "Only admins can update products"
  ON public.products
  FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

-- Products: Only admins can delete products
CREATE POLICY "Only admins can delete products"
  ON public.products
  FOR DELETE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

-- MOVEMENTS POLICIES
-- Movements: All authenticated users can read
CREATE POLICY "Authenticated users can read movements"
  ON public.movements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Movements: All authenticated users can insert (record their movements)
CREATE POLICY "Authenticated users can insert movements"
  ON public.movements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Movements: Admins can update/delete movements
CREATE POLICY "Only admins can update movements"
  ON public.movements
  FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);

CREATE POLICY "Only admins can delete movements"
  ON public.movements
  FOR DELETE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'Admin'::user_role);


-- ============================================================================
-- 8. INSERT SAMPLE DATA (OPTIONAL - for development)
-- ============================================================================

-- Note: Comment out these INSERT statements in production
-- They are included for rapid development/testing

INSERT INTO public.products (name, name_lowercase, code, patrimony, type, quantity, unit, category, image)
VALUES
  ('Caneta Azul', 'caneta azul', '001-25', 'N/A', 'consumo'::product_type, 92, 'und', 'Escritório', 'https://placehold.co/40x40.png'),
  ('Caneta Preta', 'caneta preta', '002-25', 'N/A', 'consumo'::product_type, 63, 'und', 'Escritório', 'https://placehold.co/40x40.png'),
  ('Caneta Vermelha', 'caneta vermelha', '003-25', 'N/A', 'consumo'::product_type, 19, 'und', 'Escritório', 'https://placehold.co/40x40.png'),
  ('Papel A4', 'papel a4', '005-25', 'N/A', 'consumo'::product_type, 11, 'Resma', 'Escritório', 'https://placehold.co/40x40.png'),
  ('Monitor Dell 24''', 'monitor dell 24''''', '004-25', '123456', 'permanente'::product_type, 1, 'und', 'Informática', 'https://placehold.co/40x40.png'),
  ('Mouse Logitech', 'mouse logitech', '006-25', '123457', 'permanente'::product_type, 5, 'und', 'Informática', 'https://placehold.co/40x40.png'),
  ('Teclado ABNT2', 'teclado abnt2', '007-25', 'N/A', 'consumo'::product_type, 8, 'und', 'Informática', 'https://placehold.co/40x40.png'),
  ('Cadeira de Escritório', 'cadeira de escritório', '008-25', '123458', 'permanente'::product_type, 3, 'und', 'Mobiliário', 'https://placehold.co/40x40.png'),
  ('Grampeador', 'grampeador', '009-25', 'N/A', 'consumo'::product_type, 25, 'und', 'Escritório', 'https://placehold.co/40x40.png'),
  ('Clips de Papel', 'clips de papel', '010-25', 'N/A', 'consumo'::product_type, 10, 'caixa', 'Escritório', 'https://placehold.co/40x40.png')
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate next item code
CREATE OR REPLACE FUNCTION public.generate_next_item_code(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  last_code TEXT;
  last_number INTEGER;
  next_number INTEGER;
BEGIN
  SELECT code INTO last_code
  FROM public.products
  WHERE code LIKE prefix || '%'
  ORDER BY code DESC
  LIMIT 1;

  IF last_code IS NULL THEN
    RETURN prefix || '-001';
  ELSE
    last_number := CAST(SUBSTRING(last_code, LENGTH(prefix) + 2) AS INTEGER);
    next_number := last_number + 1;
    RETURN prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 10. STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage bucket for product images (must be done via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- Note: Create the 'products' bucket in Supabase dashboard and set it to public

-- ============================================================================
-- 11. NOTES FOR COMPLETION
-- ============================================================================

/*
REMAINING SETUP STEPS (via Supabase Dashboard):

1. Create Storage Bucket:
   - Go to Storage > Buckets
   - Create a new bucket called "products"
   - Set it as Public
   - Optional: Add CORS rules if needed

2. Configure Email Templates (in Authentication > Email Templates):
   - Customize welcome emails
   - Configure password reset emails

3. Set up Additional Auth Providers (if needed):
   - Go to Authentication > Providers
   - Enable Google OAuth
   - Add your credentials

4. Add Custom Domains (optional):
   - Configure custom domain in Project Settings

5. Test RLS Policies:
   - Verify user permissions work correctly
   - Test admin-only operations

6. Set up Backups:
   - Go to Project Settings > Backups
   - Configure backup schedule
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
