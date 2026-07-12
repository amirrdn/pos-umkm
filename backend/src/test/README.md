# Backend tests

Semua unit/integration test backend ada di folder ini, terpisah dari source code.

## Struktur

Mirror `src/` — letakkan test di subfolder yang sama dengan modul yang diuji:

```
src/test/
├── helpers/          # shared mocks & fixtures
├── controllers/
├── domain/
├── lib/
├── middlewares/
└── services/
```

Contoh: `src/services/transferService.ts` → `src/test/services/transferService.test.ts`

## Menjalankan test

```bash
cd backend
npm test              # sekali jalan
npm run test:watch    # watch mode
npm run test:coverage # dengan coverage
```

Vitest memuat file dari `src/test/**/*.test.ts` (lihat `vitest.config.ts`).

## Import path

Dari test, import source dengan path relatif ke `src/`:

```typescript
// src/test/services/foo.test.ts
import { FooService } from '../../services/foo';
import { prisma } from '../../lib/prisma';
import { tenantId } from '../helpers/http';
```

| Dari folder test | Ke helpers | Ke modul di `src/` |
|------------------|------------|---------------------|
| `services/` | `../helpers/http` | `../../services/...` |
| `domain/transaction/` | `../../helpers/http` | `../../../domain/transaction/...` |
| `lib/` | `../helpers/http` | `../../lib/...` |

## Helpers

`helpers/http.ts` — mock Express `req`/`res` dan UUID fixture umum (`tenantId`, `productId`, `outletId`, dll.).

Tambah helper baru di `helpers/` jika dipakai oleh lebih dari satu file test.

## Mocking

- Mock modul dengan `vi.mock('../../path/to/module', ...)`.
- Pakai `vi.hoisted()` jika mock perlu direferensikan sebelum `vi.mock`.
- Dynamic import (`await import(...)`) berguna saat perlu reset module setelah `vi.resetModules()`.

## Menambah test baru

1. Buat file `*.test.ts` di subfolder yang mirror lokasi source.
2. Import modul dari `../../...` (sesuaikan depth).
3. Jalankan `npm test` untuk verifikasi.

File kosong akan gagal di Vitest — minimal isi `describe.skip(...)` atau hapus file sampai siap.
