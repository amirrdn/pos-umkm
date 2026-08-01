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

export interface POQueryParams {
  search?: string;
  status?: string;
  supplierId?: string;
  outletId?: string;
  page?: number;
  limit?: number;
}

export interface POPaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
  summary: {
    totalOrders: number;
    pendingCount: number;
    receivedCount: number;
    cancelledCount: number;
    totalAmount: number;
  };
}

export interface POPaginatedResponse {
  orders: PurchaseOrder[];
  pagination?: POPaginationMeta;
}

export async function getPurchaseOrdersApi(params?: POQueryParams): Promise<POPaginatedResponse> {
  const response = await apiClient.get<
    ApiSuccessResponse<PurchaseOrder[]> & { pagination?: POPaginationMeta }
  >('/api/purchase-orders', { params });
  return {
    orders: response.data.data ?? [],
    pagination: response.data.pagination,
  };
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
