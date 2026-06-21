import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface Category {
  id: string;
  name: string;
  slug: string;
  prefix: string;
}

export interface CategoryPayload {
  name: string;
  prefix: string;
}

export async function getCategoriesApi(): Promise<Category[]> {
  const response = await apiClient.get<ApiSuccessResponse<Category[]>>('/api/categories');
  return response.data.data ?? [];
}

export async function createCategoryApi(payload: CategoryPayload): Promise<void> {
  await apiClient.post('/api/categories', payload);
}

export async function updateCategoryApi(id: string, payload: CategoryPayload): Promise<void> {
  await apiClient.put(`/api/categories/${id}`, payload);
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await apiClient.delete(`/api/categories/${id}`);
}
