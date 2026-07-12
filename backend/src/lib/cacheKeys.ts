import { cacheKey, cacheDel, cacheDelByPattern } from './cache';

export const CACHE_TTL = {
    POS_CATALOG: 30,
} as const;

export function posCatalogCacheKey(tenantId: string, outletId: string): string {
    return cacheKey('tenant', tenantId, 'outlet', outletId, 'pos', 'catalog', 'v1');
}

export function tenantPosCatalogPattern(tenantId: string): string {
    return cacheKey('tenant', tenantId, 'outlet', '*', 'pos', 'catalog', '*');
}

export async function invalidatePosCatalogForOutlet(
    tenantId: string, 
    outletId: string
): Promise<void> {
    await cacheDel(posCatalogCacheKey(tenantId, outletId));
}

export async function invalidatePosCatalogForTenant(tenantId: string): Promise<void> {
    await cacheDelByPattern(tenantPosCatalogPattern(tenantId));
}