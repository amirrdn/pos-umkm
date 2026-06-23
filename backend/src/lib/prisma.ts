import { PrismaClient, Prisma } from '@prisma/client';
import { tenantStorage, getSystemContext, tenantRlsTxStorage } from './tenantContext';

const globalForPrisma = globalThis as unknown as { prisma?: TenantScopedPrismaClient };

const APP_POOL_LIMIT = Number(process.env.PRISMA_APP_CONNECTION_LIMIT ?? 7);
const SYSTEM_POOL_LIMIT = Number(process.env.PRISMA_SYSTEM_CONNECTION_LIMIT ?? 3);

function datasourceWithPoolLimit(url: string | undefined, limit: number): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('connection_limit', String(limit));
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '10');
    }
    return parsed.toString();
  } catch {
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}connection_limit=${limit}&pool_timeout=10`;
  }
}

let systemPrismaInstance: PrismaClient | undefined;

/** Lazy — hindari dua Prisma engine di cold start (penting di Render 512MB). */
function getSystemPrisma(): PrismaClient {
  if (!systemPrismaInstance) {
    systemPrismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      datasourceUrl: datasourceWithPoolLimit(
        process.env.DIRECT_URL || process.env.DATABASE_URL,
        SYSTEM_POOL_LIMIT
      ),
    });
  }
  return systemPrismaInstance;
}

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasourceUrl: datasourceWithPoolLimit(process.env.DATABASE_URL, APP_POOL_LIMIT),
});

type TenantTransactionOptions = {
  maxWait?: number;
  timeout?: number;
};

type PrismaModelDelegate = {
  [operation: string]: (operationArgs: unknown) => Promise<unknown>;
};

function modelClientKey(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function runOnTenantRlsClient<T>(
  model: string,
  operation: string,
  args: unknown,
  tenantId: string
): Promise<T> {
  const pinnedTx = tenantRlsTxStorage.getStore();
  if (pinnedTx && tenantStorage.getStore() === tenantId) {
    const clientKey = modelClientKey(model);
    const delegate = (pinnedTx as unknown as Record<string, PrismaModelDelegate>)[clientKey];
    return delegate[operation](args) as Promise<T>;
  }
  return runWithTenantRlsSession(model, operation, args, tenantId) as Promise<T>;
}

/** set_config + query harus satu koneksi/tx — batch [raw, query(args)] tidak menjamin itu (PgBouncer/RLS). */
async function runWithTenantRlsSession(
  model: string,
  operation: string,
  args: unknown,
  tenantId: string
): Promise<unknown> {
  const clientKey = modelClientKey(model);
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_tenant_id', $1, true)`,
      tenantId
    );
    const delegate = (tx as unknown as Record<string, PrismaModelDelegate>)[clientKey];
    return delegate[operation](args);
  });
}

const TENANT_SCOPED_MODELS = new Set(
  Prisma.dmmf.datamodel.models
    .filter((entry) => entry.fields.some((field) => field.name === 'tenantId'))
    .map((entry) => entry.name)
);

function isTenantScopedModel(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model);
}

const tenantScopedPrisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (getSystemContext()) {
          return query(args);
        }

        const activeTenantId = tenantStorage.getStore();

        const queryArgs = args as Record<string, unknown>;
        const where = queryArgs.where as Record<string, unknown> | undefined;

        if (model === 'Tenant') {
          const tenantId =
            activeTenantId ?? (typeof where?.id === 'string' ? where.id : undefined);

          if (tenantId) {
            return runOnTenantRlsClient(model, operation, args, tenantId);
          }

          return query(args);
        }

        if (isTenantScopedModel(model)) {
          const dataObj = queryArgs.data as
            | Record<string, unknown>
            | Record<string, unknown>[]
            | { data: Record<string, unknown>[] }
            | undefined;
          const createObj = queryArgs.create as Record<string, unknown> | undefined;

          const hasExplicitTenantFilter = where?.tenantId !== undefined;
          let hasExplicitTenantData = false;
          if (dataObj && !Array.isArray(dataObj) && !('data' in dataObj)) {
            hasExplicitTenantData = dataObj.tenantId !== undefined;
          }

          const effectiveTenantId =
            activeTenantId ??
            (typeof where?.tenantId === 'string' ? where.tenantId : undefined) ??
            (hasExplicitTenantData && dataObj && !Array.isArray(dataObj) && !('data' in dataObj)
              ? (dataObj.tenantId as string | undefined)
              : undefined);

          if (!effectiveTenantId && !hasExplicitTenantFilter && !hasExplicitTenantData) {
            throw new Error(`Akses Ditolak: Konteks tenant tidak terdefinisi untuk model ${model}`);
          }

          if (effectiveTenantId) {
            if (activeTenantId) {
              if (where) {
                queryArgs.where = { ...where, tenantId: activeTenantId };
              } else {
                queryArgs.where = { tenantId: activeTenantId };
              }

              if (operation === 'create' && dataObj && !Array.isArray(dataObj) && !('data' in dataObj)) {
                dataObj.tenantId = activeTenantId;
              } else if (operation === 'createMany' && dataObj) {
                if (Array.isArray(dataObj)) {
                  dataObj.forEach((item) => {
                    item.tenantId = activeTenantId;
                  });
                } else if ('data' in dataObj && Array.isArray(dataObj.data)) {
                  dataObj.data.forEach((item) => {
                    item.tenantId = activeTenantId;
                  });
                }
              } else if (operation === 'upsert' && createObj) {
                createObj.tenantId = activeTenantId;
              }
            }

            return runOnTenantRlsClient(model, operation, args, effectiveTenantId);
          }
        }

        return query(args);
      },
    },
  },
});

export type PrismaTx = Parameters<Parameters<typeof tenantScopedPrisma['$transaction']>[0]>[0];

export type TenantScopedPrismaClient = typeof tenantScopedPrisma & {
  $executeRawWithTenant: <T>(
    tenantId: string,
    callback: (transaction: PrismaTx) => Promise<T>,
    options?: TenantTransactionOptions
  ) => Promise<T>;
};

async function executeRawWithTenant<T>(
  tenantId: string,
  callback: (transaction: PrismaTx) => Promise<T>,
  options?: TenantTransactionOptions
): Promise<T> {
  const pinnedTx = tenantRlsTxStorage.getStore();
  if (pinnedTx && tenantStorage.getStore() === tenantId) {
    return callback(pinnedTx as PrismaTx);
  }

  return tenantScopedPrisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return callback(transaction);
  }, options);
}

export const prisma = new Proxy(
  Object.assign(tenantScopedPrisma, {
    $executeRawWithTenant: executeRawWithTenant,
  }),
  {
    get(target, prop, receiver) {
      if (getSystemContext() && typeof prop === 'string') {
        const systemPrisma = getSystemPrisma();
        if (prop in systemPrisma) {
          const value = Reflect.get(systemPrisma, prop, systemPrisma);
          if (typeof value === 'function') {
            return value.bind(systemPrisma);
          }
          return value;
        }
      }
      return Reflect.get(target, prop, receiver);
    },
  }
) as unknown as TenantScopedPrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
