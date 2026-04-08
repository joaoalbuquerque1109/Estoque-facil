-- ============================================================================
-- SUPABASE MIGRATION: Exit Requests Workflow
-- ============================================================================
-- Operators can submit exit requests and admins can approve/reject them.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exit_request_type') THEN
    CREATE TYPE exit_request_type AS ENUM ('consumption', 'responsibility');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exit_request_status') THEN
    CREATE TYPE exit_request_status AS ENUM ('pending', 'approved', 'completed', 'rejected');
  END IF;
END $$;

ALTER TYPE exit_request_status ADD VALUE IF NOT EXISTS 'completed';

CREATE TABLE IF NOT EXISTS public.exit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type exit_request_type NOT NULL,
  status exit_request_status NOT NULL DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_document TEXT NOT NULL,
  responsible_name TEXT,
  responsible_document TEXT,
  department TEXT NOT NULL,
  purpose TEXT,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by_email TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  finalized_by_email TEXT,
  finalized_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.exit_requests
  ADD COLUMN IF NOT EXISTS responsible_name TEXT,
  ADD COLUMN IF NOT EXISTS responsible_document TEXT,
  ADD COLUMN IF NOT EXISTS finalized_by_email TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_exit_requests_status ON public.exit_requests(status);
CREATE INDEX IF NOT EXISTS idx_exit_requests_type ON public.exit_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_exit_requests_submitted_by ON public.exit_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_exit_requests_created_at ON public.exit_requests(created_at DESC);

DROP TRIGGER IF EXISTS update_exit_requests_updated_at ON public.exit_requests;
CREATE TRIGGER update_exit_requests_updated_at
  BEFORE UPDATE ON public.exit_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.exit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own exit requests" ON public.exit_requests;
CREATE POLICY "Users can read their own exit requests"
  ON public.exit_requests
  FOR SELECT
  USING (submitted_by = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert exit requests" ON public.exit_requests;
CREATE POLICY "Authenticated users can insert exit requests"
  ON public.exit_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND submitted_by = auth.uid()
    AND status = 'pending'::exit_request_status
  );

DROP POLICY IF EXISTS "Only admins can update exit requests" ON public.exit_requests;
CREATE POLICY "Only admins can update exit requests"
  ON public.exit_requests
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
