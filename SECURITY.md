# Kebijakan Keamanan (Security Policy)

## Versi yang Didukung (Supported Versions)

Kami secara aktif mendukung dan menambal kerentanan keamanan pada versi-versi berikut:

| Versi | Didukung |
|-------|----------|
| main  | :white_check_mark: Ya |
| < main| :x: Tidak |

## Praktik Keamanan Produksi

### Database Row-Level Security (RLS)
- Gunakan user database non-superuser (misalnya `app_user`) agar kebijakan RLS PostgreSQL diterapkan.
- Migrasi `20260623120000_enable_rls` mengaktifkan `FORCE ROW LEVEL SECURITY` pada 15 tabel ber-`tenantId`.

### Autentikasi
- JWT disimpan di cookie `auth_token` dengan flag `httpOnly`, `sameSite: strict`, dan `secure` di produksi.
- Endpoint `POST /api/auth/logout` menghapus cookie sesi.

### Rate Limiting
- `/api/auth/*`: 20 request / 15 menit per IP.
- `/api/*` (non-auth): 300 request / 15 menit per IP.
- `POST /api/transactions/checkout`: 60 request / 15 menit per IP.

### Pengujian RLS di CI (opsional)
- Set `RLS_TEST_ROLE` ke role PostgreSQL non-superuser untuk menjalankan tes isolasi lintas tenant di `prismaRls.test.ts`.

### Audit Trail Platform Admin
- Inspeksi tenant admin platform dicatat sebagai `IMPERSONATE_START` / `IMPERSONATE_END` di `platform_audit_logs`.
- Aksi tulis tenant oleh admin platform dicatat sebagai `TENANT_SCOPED_WRITE`.
- Sesi inspeksi aktif disimpan di `platform_admin_sessions`.

## Melaporkan Kerentanan (Reporting a Vulnerability)

Jika Anda menemukan kerentanan keamanan dalam proyek ini, mohon laporkan secara privat kepada tim kami di **security@example.com**. 

Laporan Anda diharapkan menyertakan:
- Deskripsi detail mengenai kerentanan yang ditemukan.
- Langkah-langkah untuk mereproduksi masalah tersebut (termasuk script proof-of-concept atau tangkapan layar jika ada).
- Potensi dampak dari kerentanan tersebut.

Kami meminta Anda untuk tidak melaporkan kerentanan keamanan melalui GitHub Issues publik demi keamanan data pengguna.

## SLA (Service Level Agreement)

- **SLA Respons**: Kami akan meninjau dan merespons laporan Anda dalam waktu **48 jam**.
- **SLA Pembaruan/Perbaikan**: Kami berkomitmen untuk merilis patch atau mitigasi untuk kerentanan yang terverifikasi dalam waktu **7 hari** setelah laporan awal diterima.
