import { describe, it, expect, vi } from 'vitest';

vi.mock('./redis', () => ({
    isredisEnabled: () => false,
    getRedis: () => null,
}));

describe('cacheGetOrSet', () => {
    it('calls fetcher when redis disabled', async () => {
        const { cacheGetOrSet } = await import('./cache');
        const fetcher = vi.fn().mockResolvedValue({ ok: true });
        const result = await cacheGetOrSet('k', 60, fetcher);
        expect(result).toEqual({ ok: true });
        expect(fetcher).toHaveBeenCalled();
    })
})