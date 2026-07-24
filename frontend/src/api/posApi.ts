import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface CheckoutPayload {
  paymentMethod?: string;
  payments?: {
    paymentMethod: string;
    amount: number;
    referenceNumber?: string;
  }[];
  discountType?: 'PERCENT' | 'NOMINAL';
  discountValue?: number;
  applyTax?: boolean;
  customerId?: string | null;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface PosProductImage {
  url: string;
  isMain?: boolean;
}

export interface PosCatalogProduct {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number | string;
  stock: number;
  minStock?: number;
  category?: { name?: string };
  images?: PosProductImage[];
}

export interface PosOutletOption {
  id: string;
  name: string;
  type?: 'MAIN' | 'BRANCH';
  isActive?: boolean;
}

export interface PosTransactionStatus {
  id: string;
  invoiceNumber: string;
  status: string;
  grandTotal: number | string;
  paymentMethod?: string;
  qrisUrl?: string | null;
  customer?: {
    id: string;
    name: string;
    points?: number;
  } | null;
  items?: Array<{
    quantity: number;
    subtotal?: number;
    priceAtTransaction?: number;
    product?: { name: string; sku?: string };
  }>;
  createdAt?: string;
}

export interface PosCheckoutResult extends PosTransactionStatus {
  qrString?: string;
}

export type ProductsApiResponse = ApiSuccessResponse<PosCatalogProduct[]>;
export type OutletsApiResponse = ApiSuccessResponse<PosOutletOption[]>;
export type TransactionStatusApiResponse = ApiSuccessResponse<PosTransactionStatus>;
export type CheckoutApiResponse = ApiSuccessResponse<PosCheckoutResult>;

/**
 * Mengambil daftar produk aktif untuk tenant dari server.
 */
export async function getProductsApi(): Promise<ProductsApiResponse> {
  const response = await apiClient.get<ProductsApiResponse>('/api/products');
  return response.data;
}

/**
 * Resolves outlet operasional secara otomatis untuk platform admin.
 */
export async function resolveSilentOutletApi(): Promise<OutletsApiResponse> {
  const response = await apiClient.get<OutletsApiResponse>('/api/outlets', {
    params: { operationalOnly: 'true' },
  });
  return response.data;
}

/**
 * Mengecek status transaksi QRIS ke server.
 */
export async function getTransactionStatusApi(invoiceNumber: string): Promise<TransactionStatusApiResponse> {
  const response = await apiClient.get<TransactionStatusApiResponse>(
    `/api/transactions/status/${invoiceNumber}`
  );
  return response.data;
}

/**
 * Memproses checkout transaksi POS.
 */
export async function checkoutApi(payload: CheckoutPayload): Promise<CheckoutApiResponse> {
  const response = await apiClient.post<CheckoutApiResponse>('/api/transactions/checkout', payload);
  return response.data;
}
