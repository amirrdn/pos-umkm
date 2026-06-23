import { PrismaClient, Prisma } from '@prisma/client';
import { tenantStorage, getSystemContext } from './tenantContext';

const globalForPrisma = globalThis as unknown as { prisma?: TenantScopedPrismaClient };

export const systemPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

type TenantTransactionOptions = {
  maxWait?: number;
  timeout?: number;
};

const tenantScopedPrisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (getSystemContext()) {
          return query(args);
        }

        const activeTenantId = tenantStorage.getStore();

        const modelFields =
          Prisma.dmmf.datamodel.models.find((entry: Prisma.DMMF.Model) => entry.name === model)?.fields ?? [];
        const isTenantScopedModel = modelFields.some((field: Prisma.DMMF.Field) => field.name === 'tenantId');

        const queryArgs = args as Record<string, unknown>;
        const where = queryArgs.where as Record<string, unknown> | undefined;

        if (model === 'Tenant') {
          const tenantId =
            activeTenantId ?? (typeof where?.id === 'string' ? where.id : undefined);

          if (tenantId) {
            const [, result] = await basePrisma.$transaction([
              basePrisma.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', $1, true)`, tenantId),
              query(args),
            ]);
            return result;
          }

          return query(args);
        }

        if (isTenantScopedModel) {
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

            const [, result] = await basePrisma.$transaction([
              basePrisma.$executeRawUnsafe(
                `SELECT set_config('app.current_tenant_id', $1, true)`,
                effectiveTenantId
              ),
              query(args),
            ]);
            return result;
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
      if (getSystemContext() && typeof prop === 'string' && prop in systemPrisma) {
        return Reflect.get(systemPrisma, prop);
      }
      return Reflect.get(target, prop, receiver);
    },
  }
) as unknown as TenantScopedPrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
