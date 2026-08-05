import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AsyncLocalStorage } from 'async_hooks';
import type { SystemContextReason } from '../../lib/tenantContext';

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

/** Captures the extension object injected by prisma.ts when imported. */
let capturedExtension: CapturedExtension | null = null;

/**
 * Mocks @prisma/client before importing prisma.ts.
 * Captures the $extends call to expose the allOperations interceptor under test.
 */
vi.mock('@prisma/client', () => {
  const makeDelegate = () =>
    new Proxy(
      {},
      {
        get: (_target, operation: string) => (operationArgs: unknown) =>
          Promise.resolve(operationArgs),
      }
    );

  return {
    PrismaClient: class {
      $extends(ext: CapturedExtension) {
        capturedExtension = ext;
        return this;
      }
      $transaction(input: unknown) {
        if (typeof input === 'function') {
          const tx = {
            $executeRawUnsafe: vi.fn().mockResolvedValue(1),
            product: makeDelegate(),
            user: makeDelegate(),
            tenant: makeDelegate(),
          };
          return input(tx);
        }
        return Promise.resolve([undefined, (input as unknown[])[1]]);
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
  let runInSystemContext: (reason: SystemContextReason, fn: () => unknown) => unknown;

  beforeEach(async () => {
    vi.resetModules();
    capturedExtension = null;
    const contextModule = await import('../../lib/tenantContext');
    activeStorage = contextModule.tenantStorage;
    runInSystemContext = contextModule.runInSystemContext;
    await import('../../lib/prisma');
    const ext = capturedExtension as CapturedExtension | null;
    const ops = ext?.query?.$allModels?.$allOperations;
    expect(ops).toBeDefined();
    allOperations = ops!;
  });

  it('injects tenantId into query filter when activeTenantId is set for tenant-scoped model', async () => {
    await activeStorage.run('tenant-abc', async () => {
      const mockQuery = vi.fn().mockImplementation((args) => args);
      const args = { where: { name: 'Spoon' } };

      const resultArgs = await allOperations({
        model: 'Product',
        operation: 'findMany',
        args,
        query: mockQuery,
      });

      expect(resultArgs.where).toEqual({
        name: 'Spoon',
        tenantId: 'tenant-abc',
      });
    });
  });

  it('fails closed and throws error when activeTenantId is undefined for tenant-scoped model (safety guard)', async () => {
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
    const mockQuery = vi.fn().mockImplementation((args) => args);
    const args = { where: { tenantId: 'tenant-manual-123', name: 'Spoon' } };

    const resultArgs = await allOperations({
      model: 'Product',
      operation: 'findMany',
      args,
      query: mockQuery,
    });

    expect(resultArgs.where!.tenantId).toBe('tenant-manual-123');
  });

  it('allows query to proceed without tenantId for global models (not tenant-scoped)', async () => {
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
      expect(resultArgs.where).toBeUndefined();
    });
  });

  it('binds tenant RLS session for Tenant lookup by id before ALS is set', async () => {
    const mockQuery = vi.fn();
    const args = { where: { id: 'tenant-bootstrap' } };

    const resultArgs = await allOperations({
      model: 'Tenant',
      operation: 'findUnique',
      args,
      query: mockQuery,
    });

    expect(resultArgs.where).toEqual({ id: 'tenant-bootstrap' });
    expect(mockQuery).not.toHaveBeenCalled();
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
