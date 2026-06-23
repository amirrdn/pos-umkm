import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AsyncLocalStorage } from 'async_hooks';

type AllOperationsFn = (params: {
  model: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: Record<string, unknown>) => unknown;
}) => Promise<{
  where?: { tenantId?: string; [key: string]: unknown };
  data?: { tenantId?: string; [key: string]: unknown };
  [key: string]: unknown;
}>;

interface CapturedExtension {
  query?: {
    $allModels?: {
      $allOperations?: AllOperationsFn;
    };
  };
}

// Variabel penampung objek ekstensi yang diinjeksi saat modul prisma di-import
let capturedExtension: CapturedExtension | null = null;

// Mocking @prisma/client sebelum meng-import prisma.ts
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      $extends(ext: CapturedExtension) {
        capturedExtension = ext;
        return this;
      }
      $transaction(args: unknown[]) {
        return Promise.resolve([undefined, args[1]]);
      }
      $executeRawUnsafe = vi.fn().mockResolvedValue(1);
      $queryRawUnsafe = vi.fn().mockResolvedValue([{ count: 1 }]);
    },
    Prisma: {
      dmmf: {
        datamodel: {
          models: [
            {
              name: 'Product',
              fields: [{ name: 'id' }, { name: 'tenantId' }, { name: 'name' }],
            },
            {
              name: 'Permission',
              fields: [{ name: 'id' }, { name: 'name' }],
            },
            {
              name: 'Tenant',
              fields: [{ name: 'id' }, { name: 'name' }],
            },
            {
              name: 'User',
              fields: [{ name: 'id' }, { name: 'tenantId' }, { name: 'email' }],
            },
          ],
        },
      },
    },
  };
});

describe('Prisma Extension - Tenant Isolation', () => {
  let allOperations: AllOperationsFn;
  let activeStorage: AsyncLocalStorage<string | undefined>;
  let runInSystemContext: (reason: string, fn: () => unknown) => unknown;

  beforeEach(async () => {
    vi.resetModules();
    capturedExtension = null;
    const contextModule = await import('./tenantContext');
    activeStorage = contextModule.tenantStorage;
    runInSystemContext = contextModule.runInSystemContext;
    await import('./prisma');
    const ext = capturedExtension as CapturedExtension | null;
    const ops = ext?.query?.$allModels?.$allOperations;
    expect(ops).toBeDefined();
    allOperations = ops!;
  });

  it('injects tenantId into query filter when activeTenantId is set for tenant-scoped model', async () => {
    // 1. Set konteks tenantId ke 'tenant-abc'
    await activeStorage.run('tenant-abc', async () => {
      const mockQuery = vi.fn().mockImplementation((args) => args);
      const args = { where: { name: 'Spoon' } };

      const resultArgs = await allOperations({
        model: 'Product',
        operation: 'findMany',
        args,
        query: mockQuery,
      });

      // Verifikasi: tenantId 'tenant-abc' diinjeksi secara otomatis ke args.where
      expect(resultArgs.where).toEqual({
        name: 'Spoon',
        tenantId: 'tenant-abc',
      });
      expect(mockQuery).toHaveBeenCalledWith(resultArgs);
    });
  });

  it('fails closed and throws error when activeTenantId is undefined for tenant-scoped model (safety guard)', async () => {
    // 2. Konteks tenantId tidak di-set (undefined)
    const mockQuery = vi.fn();
    const args = { where: { name: 'Spoon' } };

    await expect(
      allOperations({
        model: 'Product',
        operation: 'findMany',
        args,
        query: mockQuery,
      })
    ).rejects.toThrow('Akses Ditolak: Konteks tenant tidak terdefinisi untuk model Product');

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('allows query to proceed when activeTenantId is undefined but tenantId is explicitly specified in where', async () => {
    // 3. Konteks tenantId undefined, tapi kueri menyertakan tenantId secara manual (misal di seeder)
    const mockQuery = vi.fn().mockImplementation((args) => args);
    const args = { where: { tenantId: 'tenant-manual-123', name: 'Spoon' } };

    const resultArgs = await allOperations({
      model: 'Product',
      operation: 'findMany',
      args,
      query: mockQuery,
    });

    expect(resultArgs.where!.tenantId).toBe('tenant-manual-123');
    expect(mockQuery).toHaveBeenCalledOnce();
  });

  it('allows query to proceed without tenantId for global models (not tenant-scoped)', async () => {
    // 4. Model 'Permission' tidak memiliki field tenantId, kueri harus lolos tanpa filter tambahan
    const mockQuery = vi.fn().mockImplementation((args) => args);
    const args = { where: { name: 'create:products' } };

    const resultArgs = await allOperations({
      model: 'Permission',
      operation: 'findMany',
      args,
      query: mockQuery,
    });

    expect(resultArgs.where).toEqual({ name: 'create:products' });
    expect(resultArgs.where!.tenantId).toBeUndefined();
    expect(mockQuery).toHaveBeenCalledOnce();
  });

  it('auto-injects tenantId into create operation data', async () => {
    // 5. Autoinjeksi tenantId saat menyimpan data baru ('create')
    await activeStorage.run('tenant-abc', async () => {
      const mockQuery = vi.fn().mockImplementation((args) => args);
      const args = { data: { name: 'New Product' } };

      const resultArgs = await allOperations({
        model: 'Product',
        operation: 'create',
        args,
        query: mockQuery,
      });

      expect(resultArgs.data!.tenantId).toBe('tenant-abc');
      expect(mockQuery).toHaveBeenCalledOnce();
    });
  });

  it('allows tenant-scoped query without ALS tenant when system context is active', async () => {
    const mockQuery = vi.fn().mockImplementation((args) => args);
    const args = { where: { email: 'user@example.com' } };

    await runInSystemContext('auth', async () => {
      const resultArgs = await allOperations({
        model: 'User',
        operation: 'findFirst',
        args,
        query: mockQuery,
      });

      expect(resultArgs.where).toEqual({ email: 'user@example.com' });
      expect(resultArgs.where!.tenantId).toBeUndefined();
      expect(mockQuery).toHaveBeenCalledOnce();
    });
  });

  it('still fails closed for tenant-scoped model when system context is not active', async () => {
    const mockQuery = vi.fn();
    const args = { where: { email: 'user@example.com' } };

    await expect(
      allOperations({
        model: 'User',
        operation: 'findFirst',
        args,
        query: mockQuery,
      })
    ).rejects.toThrow('Akses Ditolak: Konteks tenant tidak terdefinisi untuk model User');

    expect(mockQuery).not.toHaveBeenCalled();
  });
});
