import { API_BASE_URL } from '../config';
import { buildApiHeaders } from '../utils/apiHeaders';

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
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'GET',
    headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengambil data produk dari server.');
  }
  return data;
}

/**
 * Resolves outlet operasional secara otomatis untuk platform admin.
 */
export async function resolveSilentOutletApi(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/outlets?operationalOnly=true`, {
    headers: buildApiHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal menyiapkan outlet operasional.');
  }
  return data;
}

/**
 * Mengecek status transaksi QRIS ke server.
 */
export async function getTransactionStatusApi(invoiceNumber: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/status/${invoiceNumber}`, {
    method: 'GET',
    headers: buildApiHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengecek status transaksi.');
  }
  return data;
}

/**
 * Memproses checkout transaksi POS.
 */
export async function checkoutApi(payload: CheckoutPayload): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/transactions/checkout`, {
    method: 'POST',
    headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal memproses transaksi.');
  }
  return data;
}
