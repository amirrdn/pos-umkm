-- Pivot user_roles / user_outlets: RLS aktif tanpa policy = app_user tidak bisa baca (0 baris).
-- Jalankan sebagai postgres di Supabase SQL Editor setelah enable_rls migration.

ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_outlets DISABLE ROW LEVEL SECURITY;

-- Pastikan app_user tetap punya akses DML (biasanya sudah dari setup_app_user.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_outlets TO app_user;
