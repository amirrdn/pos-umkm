-- =============================================================================
-- RLS tabel tenants — jalankan sebagai postgres di Supabase SQL Editor
-- Setelah setup_app_user.sql. Jalankan per blok jika editor error.
-- =============================================================================

-- Blok 1: izin + aktifkan RLS
GRANT SELECT, UPDATE ON TABLE public.tenants TO app_user;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;

-- Blok 2: policy baca (self)
DROP POLICY IF EXISTS tenant_self_read ON public.tenants;

CREATE POLICY tenant_self_read
  ON public.tenants
  AS PERMISSIVE
  FOR SELECT
  TO app_user
  USING (
    id::text = current_setting('app.current_tenant_id', true)
    AND "deletedAt" IS NULL
  );

-- Blok 3: policy update (self)
DROP POLICY IF EXISTS tenant_self_update ON public.tenants;

CREATE POLICY tenant_self_update
  ON public.tenants
  AS PERMISSIVE
  FOR UPDATE
  TO app_user
  USING (id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (id::text = current_setting('app.current_tenant_id', true));
