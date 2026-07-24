import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SupplierPayload {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export async function getSuppliersApi(): Promise<Supplier[]> {
  const response = await apiClient.get<ApiSuccessResponse<Supplier[]>>('/api/suppliers');
  return response.data.data ?? [];
}

export async function createSupplierApi(payload: SupplierPayload): Promise<Supplier> {
  const response = await apiClient.post<ApiSuccessResponse<Supplier>>('/api/suppliers', payload);
  return response.data.data!;
}

export async function updateSupplierApi(id: string, payload: SupplierPayload): Promise<Supplier> {
  const response = await apiClient.put<ApiSuccessResponse<Supplier>>(`/api/suppliers/${id}`, payload);
  return response.data.data!;
}

export async function deleteSupplierApi(id: string): Promise<void> {
  await apiClient.delete(`/api/suppliers/${id}`);
}
