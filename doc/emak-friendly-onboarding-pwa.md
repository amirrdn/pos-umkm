# Emak-Friendly Onboarding & Zero-Cost PWA

Dokumen konteks untuk chat baru AI. Baca ini sebelum mulai implementasi fase onboarding + PWA + Google Auth.

**Branch aktif:** `refactor/subscription-services-and-lint`  
**PR terkait refactor sebelumnya:** https://github.com/amirrdn/pos-umkm/pull/13

---

## 1. Context Codebase

SaaSPOS UMKM — multi-tenant POS monorepo (`backend/` + `frontend/`).

| Area | Stack |
|------|-------|
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod, Vitest |
| Frontend | React 19, Vite, TypeScript, Zustand, Tailwind CSS, Recharts, Axios |
| Auth | JWT (`jsonwebtoken`), email verification (Resend), bcrypt |

**Tidak ada root `package.json`** — `backend/` dan `frontend/` independen.

### Rules Wajib

- **Axios only** — jangan pakai raw `fetch()` untuk API calls di frontend
- **Jangan introduce** state library baru, ORM baru, CSS framework baru, atau npm package baru kecuali diminta eksplisit
- **Ikuti folder structure** yang ada — jangan buat pola paralel
- **Controllers** = `export async function` (BUKAN class)
- **Error handling** = `catch (error: unknown)` + `getErrorMessage()` dari `backend/src/lib/errors.ts`
- **Commit** — jangan tambah `Co-authored-by: Cursor` atau attribution Cursor

---

## 2. Arsitektur Backend

### Middleware Chain (`backend/src/index.ts`)

```
helmet → cors → json → checkSubscriptionStatus → route handlers → errorHandler
```

Auth routes juga pakai `authLimiter` (express-rate-limit).

### Layer Pattern

| Layer | Lokasi | Pola |
|-------|--------|------|
| Routes | `backend/src/routes/*.ts` | Express Router, mount controller functions |
| Controllers | `backend/src/controllers/*.ts` | Zod validation → service → map error → HTTP status |
| Services | `backend/src/services/*.ts` | Business logic + Prisma |
| Schemas | `backend/src/schemas/*.ts` | Zod validation |

### Response Envelope

Semua API mengikuti format:

```json
{ "success": true, "message": "...", "data": { ... } }
```

### Route Bases Penting

| Base | Fungsi |
|------|--------|
| `/api/auth` | login, register, register-staff, verify-email, tenants |
| `/api/products` | CRUD produk |
| `/api/transactions` | checkout, history |
| `/api/analytics` | laporan tenant |
| `/api/subscriptions` | billing, Midtrans |
| `/api/platform` | platform admin |

---

## 3. Arsitektur Frontend

### Routing (`frontend/src/App.tsx`)

- `react-router-dom` v7
- Semua halaman lazy-loaded via `frontend/src/routes/lazyPages.ts`
- Helper `lazyNamed()` untuk named exports (mis. `LoginView`)
- `<Suspense fallback={<RouteFallback />}>` membungkus `<Routes>`

### Zustand Stores (`frontend/src/store/`)

| Store | Fungsi |
|-------|--------|
| `useAuthStore` | JWT, user, active outlet — persist `pos-auth-session` |
| `useCartStore` | POS cart |
| `useThemeStore` | light/dark — persist |
| `useOutletStore` | outlet context |
| `useSubscriptionStore` | tier/status langganan |
| (+ 5 store lain) | shift, notification, platform, customer, transfer |

### API Client (`frontend/src/api/apiClient.ts`)

Axios dengan 3 interceptor:

1. **Request:** `Authorization: Bearer {token}`, `x-tenant-id`, `x-outlet-id`
2. **Response:** unwrap `response.data.message` → `ApiError`
3. **401:** auto-logout → redirect `/login`

12 API modules: `authApi`, `categoryApi`, `outletApi`, `posApi`, `productMasterApi`, dll.

### Code Splitting (sudah selesai)

- Entry bundle turun dari ~1.1 MB → ~289 KB
- Semua route page di `lazyPages.ts`
- `RouteFallback.tsx` = spinner "Memuat halaman..."

---

## 4. Auth Flow Saat Ini

```
Register (email+password)
  → email verification (Resend)
  → Login (email+password)
  → JWT (15m, JWT_EXPIRES_IN)
  → protected routes
```

### Detail Penting

- `User.password` di Prisma = **non-nullable** (`String`)
- Staff registration = `approvalStatus: PENDING` → tunggu admin approve
- Email normalization via `normalizeAuthEmail` di semua auth flows
- JWT payload: `{ id, tenantId, name, email, roles, permissions, outletIds }`
- `tenantId` bisa `null` (platform admin) — sudah di `express.d.ts`
- **Tidak ada** Google Auth, **tidak ada** forgot password

### File Auth Kunci

| File | Peran |
|------|-------|
| `frontend/src/components/LoginView.tsx` | Form login |
| `frontend/src/components/RegisterView.tsx` | Form register owner/staff |
| `frontend/src/api/authApi.ts` | API calls auth |
| `frontend/src/store/useAuthStore.ts` | Auth state |
| `backend/src/controllers/authController.ts` | Auth endpoints |
| `backend/src/routes/authRoutes.ts` | Auth routes |
| `backend/src/schemas/authSchema.ts` | Zod schemas |
| `backend/src/services/authService.ts` | Login, register, JWT |
| `backend/prisma/schema.prisma` | User, Tenant models |

---

## 5. Komponen yang Akan Direfaktor

### LandingPage.tsx (~213 baris)

- **Export:** `export default LandingPage`
- **Theme:** dark only (`bg-slate-950`)
- **Sections:**
  - Header: Logo "UMKM POS", Dokumentasi, Masuk, CTA "Mulai Gratis"
  - Hero: Badge "Sistem Kasir Cloud Terpercaya & Canggih", H1 "Kelola Transaksi Toko Anda..."
  - Feature Grid: 3 kartu (Multi-Cabang, Laporan Real-time, Manajemen Stok)
  - Footer: copyright 2026
- **Belum ada:** testimonial, pricing, screenshots

### LoginView.tsx (~229 baris)

- **Export:** `export const LoginView` (named)
- Form: email, password (toggle show/hide)
- Error spesifik: `EMAIL_NOT_VERIFIED`, `APPROVAL_PENDING`, `INVALID_CREDENTIALS`
- Theme toggle (Sun/Moon)
- **Belum ada:** Google Auth button, forgot password

### RegisterView.tsx (~329 baris)

- **Export:** `export default RegisterView`
- Tab: Owner/Toko Baru vs Staf Outlet
- Owner: tenant name, owner name, email, password
- Staff: tenant selector (AppSelect), outlet checkboxes, name, email, password
- Auto-redirect ke `/login` setelah 8 detik
- **Belum ada:** Google Auth button

---

## 6. PWA Readiness

**Status: TIDAK ADA sama sekali.**

| Item | Status |
|------|--------|
| `vite-plugin-pwa` | ❌ belum install |
| `manifest.json` / `manifest.webmanifest` | ❌ |
| Service Worker | ❌ |
| `<meta name="theme-color">` | ❌ |
| Apple touch icon | ❌ |
| Icons PWA | Hanya `favicon.svg`, `icons.svg` di `public/` |

### Vite Config Saat Ini (`frontend/vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
})
```

Minimal — no aliases, no PWA.

### index.html Saat Ini

- `<link rel="icon" href="/favicon.svg">`
- Theme detection script di `<head>`
- Title: "UMKM POS"
- **Tidak ada** PWA meta tags

---

## 7. Refactor Sebelumnya (Sudah Selesai)

PR #13 mencakup:

1. **Frontend API layer** — `outletApi.ts`, `categoryApi.ts`; refactor `OutletSwitcher`, `CategoryMaster`
2. **Backend controllers** — semua class → `export async function`; `any` → `unknown` + `getErrorMessage()`
3. **Frontend deps cleanup** — hapus `bcrypt`, `jsonwebtoken` dari frontend
4. **Code splitting** — `React.lazy` + `lazyPages.ts`; bundle ~289 KB

Commits:
- `ee991b2` fix(billing): show unlimited Enterprise quota and tidy frontend API layer
- `1279b6d` refactor(backend): unify controllers as functions and tighten error typing
- `6ec2471` perf(frontend): lazy-load route pages to shrink initial bundle

---

## 8. Tugas: Emak-Friendly Onboarding & Zero-Cost PWA

### Bagian 1 — Copywriting & UI Refactor

**LandingPage.tsx:**
- Ganti copy teknis → bahasa sehari-hari ("emak-friendly")
- Badge: "Kasir Toko Online — Gratis, Gampang, Bisa dari HP"
- H1 lebih simpel
- Feature card copy lebih friendly
- Opsional: section testimonial/social proof (placeholder OK)
- Pertimbangkan light mode default

**LoginView.tsx:**
- Judul: "Masuk ke Kasir"
- Placeholder email: "Email yang dipakai daftar"
- Tambah tombol "Masuk dengan Google"
- Form email/password tetap sebagai fallback (kecuali user bilang hapus)

**RegisterView.tsx:**
- Judul: "Daftarkan Toko Kamu — Gratis"
- Simplify form labels
- Tambah tombol "Daftar dengan Google"
- Pertimbangkan staff tab — tetap atau pindah halaman terpisah?

### Bagian 2 — PWA Integration

1. Install `vite-plugin-pwa` di `frontend/package.json`
2. Konfigurasi `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'UMKM POS',
    short_name: 'UMKM POS',
    description: 'Kasir Toko Online untuk UMKM',
    theme_color: '#6366f1',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [/* placeholder 192x192, 512x512 */],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
})
```

3. Meta tags di `index.html`:
   - `<meta name="theme-color" content="#6366f1">`
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - Apple touch icon meta

4. Generate placeholder icons (192x192, 512x512) — user ganti nanti dengan logo resmi
5. Opsional: update prompt/notification untuk PWA

### Bagian 3 — Google Auth Backend

1. Install `firebase-admin` di `backend/package.json`
2. Env vars di `backend/.env.example`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   FIREBASE_PROJECT_ID=...
   FIREBASE_PRIVATE_KEY=...
   FIREBASE_CLIENT_EMAIL=...
   ```
   Atau: `FIREBASE_SERVICE_ACCOUNT_JSON_PATH`

3. Endpoint baru: `POST /api/auth/google`
   - Body: `{ idToken: string, role?: 'owner' | 'staff' }`
   - Validasi via `firebase-admin` `getAuth().verifyIdToken()`
   - User belum ada → auto-create Tenant + User (owner) atau User saja (staff)
   - Skip email verification (Google sudah verified)
   - Generate JWT sama seperti login biasa
   - Return `{ token, user }`

4. Zod schema `googleAuthSchema` di `schemas/authSchema.ts`
5. Route di `routes/authRoutes.ts`

**Hambatan schema:**
- `User.password` non-nullable — perlu nullable atau placeholder hash untuk user Google
- Staff flow: `approvalStatus: PENDING` masih berlaku

### Bagian 4 — Google Auth Frontend

1. Component reusable: `components/GoogleAuthButton.tsx`
2. Integrasi ke `LoginView` dan `RegisterView`
3. Flow:
   - Klik "Masuk dengan Google" → Google popup/One Tap → `idToken`
   - `POST /api/auth/google` via `authApi`
   - `useAuthStore.login(token, user)` → redirect `/pos`
4. Error handling: user not found, token expired, network error

**Dependency frontend untuk Google:** biasanya `@react-oauth/google` atau Firebase JS SDK — **tanyakan user** sebelum install (rule: jangan introduce package tanpa diminta).

---

## 9. Open Questions (Tanyakan User Dulu)

1. **Firebase Project** — sudah punya project + Service Account key, atau perlu bantuan setup?
2. **Email/Password Fallback** — tetap dipertahankan atau 100% Google?
3. **PWA Icons** — placeholder dulu (generate SVG) atau user sudah punya logo PNG 192/512?
4. **Staff Registration** — tab "Daftar sebagai Staf" tetap prominent atau pindah halaman terpisah?
5. **Light Mode Default** — LandingPage + auth pages pakai light mode default?
6. **Google One Tap vs Popup** — preferensi UX?

---

## 10. Instruksi untuk AI di Chat Baru

1. **Baca dokumen ini** + file kunci sebelum coding
2. **Kerjakan per bagian** — mulai dari copywriting + PWA (low-risk, tidak butuh Firebase)
3. **Tanyakan open questions** sebelum Bagian 3 (Google Auth backend)
4. **Commit per bagian** — jangan satu commit besar
5. **Test lokal** setelah tiap bagian: `npm run lint && npm run build` (frontend), `npm test` (backend)
6. **Jangan ubah pola** yang sudah mapan
7. **Package baru** hanya: `vite-plugin-pwa`, `firebase-admin` (+ frontend Google SDK jika user setuju)

### Urutan Rekomendasi

```
1. Copywriting (LandingPage, LoginView, RegisterView) — no new deps
2. PWA (vite-plugin-pwa, manifest, meta tags, icons placeholder)
3. Google Auth backend (firebase-admin, /api/auth/google) — butuh Firebase credentials
4. Google Auth frontend (button + authApi + store integration)
```

---

## 11. File Kunci (Quick Reference)

```
frontend/
  src/components/LandingPage.tsx
  src/components/LoginView.tsx
  src/components/RegisterView.tsx
  src/routes/lazyPages.ts
  src/store/useAuthStore.ts
  src/api/authApi.ts
  src/api/apiClient.ts
  vite.config.ts
  index.html
  package.json

backend/
  src/controllers/authController.ts
  src/routes/authRoutes.ts
  src/schemas/authSchema.ts
  src/services/authService.ts
  src/lib/errors.ts
  prisma/schema.prisma
  .env.example
  package.json
```

---

## 12. Inkonsistensi yang Diketahui

- `LandingPage` / `RegisterView` = default export; `LoginView` = named export → `lazyNamed()` handle ini
- `vite.config.ts` minimal — no path aliases
- LandingPage dark-only; app lain support light/dark via `useThemeStore`
- Tidak ada forgot-password flow

---

*Terakhir diperbarui: 22 Juni 2026*
