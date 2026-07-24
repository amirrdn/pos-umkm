import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface SalesReturnItem {
  id: string;
  productId: string;
  quantity: number;
  refundPrice: number;
  subtotal: number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  transactionId: string;
  reason: string;
  totalRefundAmount: number;
  createdAt: string;
  user: {
    name: string;
  };
  transaction: {
    invoiceNumber: string;
    grandTotal: number;
  };
  outlet?: {
    name: string;
  } | null;
  items: SalesReturnItem[];
}

export interface CreateSalesReturnPayload {
  transactionId: string;
  reason: string;
  items: {
    productId: string;
    quantity: number;
    refundPrice: number;
  }[];
}

export async function getSalesReturnsApi(): Promise<SalesReturn[]> {
  const response = await apiClient.get<ApiSuccessResponse<SalesReturn[]>>('/api/sales-returns');
  return response.data.data ?? [];
}

export async function createSalesReturnApi(payload: CreateSalesReturnPayload): Promise<SalesReturn> {
  const response = await apiClient.post<ApiSuccessResponse<SalesReturn>>('/api/sales-returns', payload);
  return response.data.data!;
}
