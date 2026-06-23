-- Skrip ini dijalankan satu kali oleh SUPERUSER (misal: postgres) di Supabase SQL Editor
-- Tujuannya adalah membuat role khusus aplikasi yang terisolasi dan tunduk pada Row-Level Security (RLS)

-- 1. Buat role app_user dengan password yang kuat
CREATE ROLE app_user WITH LOGIN PASSWORD 'ADFHSKAJFAGGDA732834728!';

-- 2. Berikan izin koneksi ke database Anda (ganti nama_database jika berbeda)
GRANT CONNECT ON DATABASE postgres TO app_user;

-- 3. Berikan izin penggunaan skema public
GRANT USAGE ON SCHEMA public TO app_user;

-- 4. Berikan izin CRUD pada semua tabel saat ini di skema public
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- 5. Berikan izin pada semua sequence (penting untuk auto-increment / serial)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 6. (PENTING) Otomatiskan pemberian izin untuk tabel yang akan dibuat di masa depan oleh Prisma
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- PERHATIAN:
-- Jangan pernah memberikan role SUPERUSER atau BYPASSRLS kepada app_user.
-- Jika app_user memiliki BYPASSRLS, maka semua RLS yang ada di tabel akan diabaikan!
