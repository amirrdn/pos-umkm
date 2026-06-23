import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<string>();

/** Satu koneksi DB per HTTP request (set_config + query) — di-set oleh tenantMiddleware. */
export const tenantRlsTxStorage = new AsyncLocalStorage<object>();

export type SystemContextReason = 'auth' | 'seed' | 'platform' | 'migration' | 'script';

const systemContextStorage = new AsyncLocalStorage<SystemContextReason>();

export function getSystemContext(): SystemContextReason | undefined {
  return systemContextStorage.getStore();
}

export function runInSystemContext<T>(reason: SystemContextReason, fn: () => T): T {
  return systemContextStorage.run(reason, fn);
}
