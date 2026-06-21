import { apiClient } from './apiClient';
import type { Product, LedgerEntry, LowStockItem, StockRequest } from '../types/inventory';

export interface LowStockResponse {
  success: boolean;
  message?: string;
  data: {
    items: LowStockItem[];
  };
}

export interface InventoryResponse {
  success: boolean;
  message?: string;
  data: Product[];
}

export interface SettingsResponse {
  success: boolean;
  message?: string;
  data: {
    requireStockApproval: boolean;
  };
}

export interface StockRequestResponse {
  success: boolean;
  message?: string;
  data: StockRequest[];
}

export interface MutatePayload {
  productId: string;
  type: string;
  quantity: number;
  note: string;
}

export interface MutateResponse {
  success: boolean;
  message?: string;
  data?: {
    isPendingApproval?: boolean;
  };
}

export interface LedgerResponse {
  success: boolean;
  data: {
    ledger: LedgerEntry[];
    product?: {
      stock: number;
    };
  };
}

export async function getLowStockApi(): Promise<LowStockResponse> {
  const response = await apiClient.get<LowStockResponse>('/api/inventory/low-stock');
  return response.data;
}

export async function getInventoryApi(): Promise<InventoryResponse> {
  const response = await apiClient.get<InventoryResponse>('/api/inventory');
  return response.data;
}

export async function getSettingsApi(): Promise<SettingsResponse> {
  const response = await apiClient.get<SettingsResponse>('/api/inventory/settings');
  return response.data;
}

export interface ProcessStockRequestResponse {
  success: boolean;
  message?: string;
  data?: StockRequest;
}

export async function updateSettingsApi(requireStockApproval: boolean): Promise<SettingsResponse> {
  const response = await apiClient.put<SettingsResponse>('/api/inventory/settings', {
    requireStockApproval,
  });
  return response.data;
}

export async function getStockRequestsApi(): Promise<StockRequestResponse> {
  const response = await apiClient.get<StockRequestResponse>('/api/inventory/requests');
  return response.data;
}

export async function processStockRequestApi(
  id: string,
  action: 'approve' | 'reject'
): Promise<ProcessStockRequestResponse> {
  const response = await apiClient.post<ProcessStockRequestResponse>(
    `/api/inventory/requests/${id}/${action}`
  );
  return response.data;
}

export async function getSourceOutletInventoryApi(fromOutletId: string): Promise<InventoryResponse> {
  const response = await apiClient.get<InventoryResponse>('/api/inventory', {
    headers: { 'x-outlet-id': fromOutletId }
  });
  return response.data;
}

export async function getOutletStockApi(productId: string, outletId: string): Promise<LedgerResponse> {
  const response = await apiClient.get<LedgerResponse>(`/api/inventory/${productId}/ledger`, {
    headers: { 'x-outlet-id': outletId }
  });
  return response.data;
}

export async function mutateStockApi(payload: MutatePayload, outletId: string): Promise<MutateResponse> {
  const response = await apiClient.post<MutateResponse>('/api/inventory/mutate', payload, {
    headers: { 'x-outlet-id': outletId }
  });
  return response.data;
}

export async function getProductLedgerApi(productId: string): Promise<LedgerResponse> {
  const response = await apiClient.get<LedgerResponse>(`/api/inventory/${productId}/ledger`);
  return response.data;
}
