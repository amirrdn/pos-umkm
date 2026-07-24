import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface POItem {
  id: string;
  productId: string;
  quantity: number;
  costPrice: number;
  subTotal: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  outletId?: string | null;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  expectedDate?: string | null;
  recievedDate?: string | null;
  createdAt: string;
  supplier: {
    name: string;
    phone?: string | null;
  };
  createdBy: {
    name: string;
  };
  outlet?: {
    name: string;
  } | null;
  items: POItem[];
}

export interface CreatePOPayload {
  supplierId: string;
  outletId?: string;
  expectedDate?: string;
  items: {
    productId: string;
    quantity: number;
    costPrice: number;
  }[];
}

export async function getPurchaseOrdersApi(): Promise<PurchaseOrder[]> {
  const response = await apiClient.get<ApiSuccessResponse<PurchaseOrder[]>>('/api/purchase-orders');
  return response.data.data ?? [];
}

export async function getPurchaseOrderByIdApi(id: string): Promise<PurchaseOrder> {
  const response = await apiClient.get<ApiSuccessResponse<PurchaseOrder>>(`/api/purchase-orders/${id}`);
  return response.data.data!;
}

export async function createPurchaseOrderApi(payload: CreatePOPayload): Promise<PurchaseOrder> {
  const response = await apiClient.post<ApiSuccessResponse<PurchaseOrder>>('/api/purchase-orders', payload);
  return response.data.data!;
}

export async function receivePurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const response = await apiClient.patch<ApiSuccessResponse<PurchaseOrder>>(`/api/purchase-orders/${id}/receive`);
  return response.data.data!;
}

export async function cancelPurchaseOrderApi(id: string): Promise<PurchaseOrder> {
  const response = await apiClient.patch<ApiSuccessResponse<PurchaseOrder>>(`/api/purchase-orders/${id}/cancel`);
  return response.data.data!;
}
