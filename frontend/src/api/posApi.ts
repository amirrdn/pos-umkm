import { apiClient } from './apiClient';

export interface CheckoutPayload {
  paymentMethod: string;
  discountType?: 'PERCENT' | 'NOMINAL';
  discountValue?: number;
  applyTax?: boolean;
  customerId?: string | null;
  items: {
    productId: string;
    quantity: number;
  }[];
}

/**
 * Mengambil daftar produk aktif untuk tenant dari server.
 */
export async function getProductsApi(): Promise<any> {
  const response = await apiClient.get('/api/products');
  return response.data;
}

/**
 * Resolves outlet operasional secara otomatis untuk platform admin.
 */
export async function resolveSilentOutletApi(): Promise<any> {
  const response = await apiClient.get('/api/outlets', {
    params: { operationalOnly: 'true' }
  });
  return response.data;
}

/**
 * Mengecek status transaksi QRIS ke server.
 */
export async function getTransactionStatusApi(invoiceNumber: string): Promise<any> {
  const response = await apiClient.get(`/api/transactions/status/${invoiceNumber}`);
  return response.data;
}

/**
 * Memproses checkout transaksi POS.
 */
export async function checkoutApi(payload: CheckoutPayload): Promise<any> {
  const response = await apiClient.post('/api/transactions/checkout', payload);
  return response.data;
}
