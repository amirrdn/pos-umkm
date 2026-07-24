import type { CheckoutPayload, CheckoutApiResponse } from '../api/posApi';

const CATALOG_CACHE_KEY = 'saas_pos_offline_catalog';
const QUEUE_CACHE_KEY = 'saas_pos_offline_tx_queue';

export interface OfflineTransactionItem extends CheckoutPayload {
  offlineId: string;
  createdAt: string;
}

/**
 * Menyimpan katalog produk ke penyimpanan lokal untuk akses offline.
 */
export function saveCatalogOffline(products: unknown[]): void {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(products));
  } catch {
    console.warn('Gagal menyimpan katalog produk ke penyimpanan lokal.');
  }
}

/**
 * Mengambil katalog produk lokal jika offline.
 */
export function getCatalogOffline<T>(): T[] {
  try {
    const data = localStorage.getItem(CATALOG_CACHE_KEY);
    return data ? (JSON.parse(data) as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Memasukkan transaksi baru ke antrean transaksi offline.
 */
export function enqueueOfflineTransaction(payload: CheckoutPayload): OfflineTransactionItem {
  const offlineItem: OfflineTransactionItem = {
    ...payload,
    offlineId: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
  };

  const queue = getOfflineQueue();
  queue.push(offlineItem);
  try {
    localStorage.setItem(QUEUE_CACHE_KEY, JSON.stringify(queue));
  } catch {
    console.warn('Gagal menyimpan transaksi ke antrean offline.');
  }
  return offlineItem;
}

/**
 * Mengambil daftar transaksi offline yang belum disinkronkan.
 */
export function getOfflineQueue(): OfflineTransactionItem[] {
  try {
    const data = localStorage.getItem(QUEUE_CACHE_KEY);
    return data ? (JSON.parse(data) as OfflineTransactionItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Mengosongkan antrean transaksi offline setelah sinkronisasi berhasil.
 */
export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_CACHE_KEY);
}

/**
 * Memproses sinkronisasi transaksi offline ke server backend.
 */
export async function syncOfflineQueue(
  checkoutApi: (payload: CheckoutPayload) => Promise<CheckoutApiResponse>
): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remainingQueue: OfflineTransactionItem[] = [];

  for (const item of queue) {
    try {
      await checkoutApi(item);
      synced++;
    } catch (err) {
      console.error(`[OfflineSync] Gagal mengunggah transaksi ${item.offlineId}:`, err);
      failed++;
      remainingQueue.push(item);
    }
  }

  if (remainingQueue.length > 0) {
    localStorage.setItem(QUEUE_CACHE_KEY, JSON.stringify(remainingQueue));
  } else {
    clearOfflineQueue();
  }

  return { synced, failed };
}
