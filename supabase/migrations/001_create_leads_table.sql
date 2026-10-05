-- ============================================================================
-- Migration: 001_create_leads_table.sql
-- Project: AI Event Lead Manager
-- Description: Creates the leads table with constraints, indexes, RLS, and trigger
-- ============================================================================

-- Ensure uuid generator extension is enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    event VARCHAR(120) NOT NULL,
    notes TEXT NOT NULL,
    follow_up_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (follow_up_status IN ('pending', 'contacted', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comments on table and columns
COMMENT ON TABLE public.leads IS 'Stores leads captured by sales/business teams at conferences and events';
COMMENT ON COLUMN public.leads.follow_up_status IS 'Follow-up status pipeline: pending, contacted, completed';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_status ON public.leads (follow_up_status);
CREATE INDEX IF NOT EXISTS idx_leads_event ON public.leads (event);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads (company);
CREATE INDEX IF NOT EXISTS idx_leads_name ON public.leads (name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- ============================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Clean up any previous permissive policies
DROP POLICY IF EXISTS "Allow anon all on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow service role full access" ON public.leads;
DROP POLICY IF EXISTS "Allow anon read only" ON public.leads;

-- 1. Privileged Service Role Access:
-- Next.js Server / API Route Handlers connect using the SUPABASE_SERVICE_ROLE_KEY to perform
-- authoritative CRUD mutations (INSERT, UPDATE, DELETE, SELECT).
CREATE POLICY "Allow service role full access"
    ON public.leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Restrict Anonymous Browser Access:
-- Direct write, update, and delete operations via the public anonymous key are STRICTLY PROHIBITED.
-- Anonymous clients cannot perform direct mutations against the PostgreSQL database.
-- Optional: Read-only access is permitted for SELECT, while all mutations MUST pass through
-- the Next.js API layer (/api/leads).
CREATE POLICY "Allow anon read only"
    ON public.leads
    FOR SELECT
    TO anon, authenticated
    USING (true);
