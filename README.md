# SaaSPOS UMKM - Platform Kasir Multi-Tenant & Inventaris

[![CI Quality Gate](https://github.com/amirrdn/pos-umkm/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/amirrdn/pos-umkm/actions/workflows/ci.yml)

[![SaaS POS](https://img.shields.io/badge/SaaS-POS_UMKM-6366f1?style=for-the-badge&logo=react)](https://github.com/amirrdn/pos-umkm)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

SaaSPOS UMKM adalah platform Point of Sale (POS) multi-tenant modern yang dirancang khusus untuk memfasilitasi kebutuhan operasional toko ritel berskala kecil dan menengah. Dengan arsitektur yang aman dan modular, sistem ini memisahkan data setiap toko secara aman menggunakan *Row-Level Isolation* berbasis tenant.

---

## 🚀 Fitur Utama

Sistem ini telah dilengkapi dengan fitur-fitur esensial tingkat produksi:

1. **Multi-Tenancy & Isolasi Data**: Isolasi data yang aman antar-tenant/toko menggunakan middleware dinamis (`x-tenant-id`) untuk keamanan operasional.
2. **Sistem Multi-Outlet (Multi-Store/Branch)**: Dukungan multi-cabang terisolasi per lokasi. Stok produk, riwayat transaksi, kartu stok/mutasi barang, shift kasir, dan staf terisolasi secara dinamis berdasarkan outlet aktif kasir/karyawan. Owner dan Manager memiliki dashboard global untuk pengawasan seluruh outlet.
3. **Role-Based Access Control (RBAC)**: Hak akses ketat yang memisahkan peran **Owner** (akses penuh laporan keuangan, inventaris, outlet, staf) dan **Kasir** (akses transaksi & riwayat dasar).
4. **Point of Sale (POS) & Checkout ACID**: Pengurangan stok real-time yang aman menggunakan Prisma Interactive Transaction untuk menjamin integritas data penjualan.
5. **E-Wallet & QRIS Dinamis (Midtrans)**: Integrasi dengan Midtrans Sandbox untuk generator QRIS dinamis otomatis, status polling pembayaran real-time, status lunas, dan auto-rollback/restock jika transaksi kedaluwarsa atau dibatalkan.
6. **QRIS Customer Display & Layanan Layar Kedua**: Mode fullscreen QRIS untuk display ke customer, serta pembukaan window layar kedua (`/customer-display`) untuk monitor eksternal.
7. **Manajemen Shift Kerja & Laci Kas**: Kasir wajib mencatat modal awal sebelum transaksi dan melakukan rekonsiliasi uang fisik (kas aktual) saat tutup shift beserta deteksi selisih.
8. **Laporan Penjualan per Kasir & Shift**: Grafik, tabel, dan rekapitulasi data penjualan real-time terpilah berdasarkan kasir dan shift kerja aktif.
9. **Perhitungan HPP (COGS) & Laba Bersih**: Pencatatan otomatis harga beli (*snapshot* HPP) saat transaksi untuk menyajikan laporan Laba Bersih yang akurat, di samping Omset kotor.
10. **Kartu Stok & Mutasi Barang (Stock Ledger)**: Log terperinci dari setiap perubahan stok barang (SALE, RESTOCK, ADJUSTMENT, RETURN) untuk pemantauan rantai pasok.
11. **Diskon Global & Pajak PPN**: Dukungan fleksibilitas promosi nominal/persen serta kalkulasi wajib pajak (PPN 11%).
12. **Cetak Struk Thermal & Integrasi WhatsApp**: Template struk belanja thermal format 58mm untuk printer thermal fisik dan fitur kirim struk belanja digital otomatis via WhatsApp.
13. **Dashboard Analitik & Laba Rugi**: Visualisasi tren harian Omset vs Laba Bersih selama 30 hari menggunakan Recharts AreaChart serta pemeringkat 5 produk terlaris.
14. **Sistem Langganan SaaS (Subscription Flow & Billing)**: Pembagian paket layanan (**FREE**, **GROWTH**, dan **ENTERPRISE**) dengan limitasi kuota data yang ketat di backend (jumlah produk, outlet, staf, dan transaksi bulanan). Terintegrasi dengan **Midtrans Snap & Webhook** untuk proses pembayaran tagihan langganan otomatis, serta mendukung alur *graceful downgrade* (menonaktifkan outlet cabang tambahan dan membekukan staf berlebih di atas kuota secara aman tanpa menghapus data).

---

## 🛠️ Stack Teknologi

### Frontend
- **Framework & Build Tools**: React 19, Vite, TypeScript
- **State Management**: Zustand (dengan persistence untuk sesi login)
- **Styling**: Tailwind CSS
- **Visualisasi Data**: Recharts (Line/Area/Bar charts)
- **Icon**: Lucide React
- **Pencetakan**: React-to-Print

### Backend
- **Runtime & Web Framework**: Node.js, Express, TypeScript
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Validasi Schema**: Zod (type-safe validation)
- **Keamanan**: Bcrypt (hashing sandi), JSON Web Token / JWT (otentikasi sesi)
- **Media Upload**: Cloudinary (upload foto produk via `uploadMiddleware`)

---

## 📁 Struktur Monorepo

```text
SaaSPOS/
├── backend/                  # REST API Service (Node.js/Express)
│   ├── prisma/               # Schema Database, Seeder, dan Migrasi
│   └── src/
│       ├── controllers/      # Layer Controller (Request/Response)
│       ├── domain/           # Logic domain terisolasi (auth, inventory, outlet, dll.)
│       ├── middlewares/      # Auth, Tenant, Role, dan Subscription Middlewares
│       ├── routes/           # Endpoint Routing API
│       ├── schemas/          # Validasi Skema Payload (Zod)
│       └── services/         # Layer Logic Bisnis (Prisma transactions)
├── frontend/                 # Client SPA Application (React/Vite)
│   ├── src/
│   │   ├── api/              # Axios apiClient & modul pemanggilan API
│   │   ├── components/       # Komponen UI Halaman (POS, Dashboard, dll)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand Stores (Cart, Auth, Shift, Outlet)
│   │   └── config.ts         # Konfigurasi Endpoint Client
└── README.md
```

---

## ⚙️ Panduan Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js versi 18 atau lebih tinggi
- Docker (Opsional, untuk container PostgreSQL)

### 1. Kloning Repositori
```bash
git clone git@github.com:amirrdn/pos-umkm.git
cd pos-umkm
```

### 2. Setup Database (PostgreSQL)
Jika Anda menggunakan Docker, Anda dapat menjalankan database PostgreSQL secara otomatis menggunakan berkas docker-compose yang tersedia di folder backend:
```bash
cd backend
docker-compose up -d
```

### 3. Konfigurasi Backend
Buat berkas `.env` di dalam folder `backend/` dengan konfigurasi berikut:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:pos_secure_pwd_2026@localhost:5432/saas_pos?schema=public"
JWT_SECRET="rahasia_jwt_sangat_aman_2026"
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
APP_PUBLIC_URL="http://localhost:5173"
```

> **Penting:** `JWT_SECRET` wajib diset — server akan gagal start jika variabel ini kosong. Lihat `backend/.env.example` untuk daftar lengkap variabel (Midtrans, email, Cloudinary, dll.).

Instal dependensi, lakukan migrasi database, jalankan seeder data, dan jalankan server pengembangan:
```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```
Server backend akan berjalan di: `http://localhost:3000`

### 4. Konfigurasi Frontend
Masuk ke folder `frontend/`, instal dependensi, dan jalankan aplikasi:
```bash
cd ../frontend
npm install
npm run dev
```
Aplikasi frontend akan berjalan di: `http://localhost:5173`

---

## 🔐 Akun Demo Bawaan (Hasil Seeder)
Gunakan akun uji coba berikut setelah database berhasil di-seed:

| Email | Kata Sandi | Peran |
|---|---|---|
| **owner@tokoutama.com** | `password123` | Owner (Akses penuh seluruh sistem & outlet) |
| **kasir@tokoutama.com** | `password123` | Kasir (Akses POS cabang pusat / Toko Utama Pusat) |

---

## 📝 Lisensi
Proyek ini dilindungi di bawah Lisensi [MIT](LICENSE).
