import { apiClient } from './apiClient';
import type {
  MasterProduct,
  ProductCategory,
  OutletSummary,
  ProductFormPayload,
  OutletSettingsData,
} from '../types/productMaster';
import { mapApiProductToMasterProduct } from '../utils/productMasterHelpers';

interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getProductsApi(outletId?: string): Promise<MasterProduct[]> {
  const response = await apiClient.get<ApiSuccessResponse<Parameters<typeof mapApiProductToMasterProduct>[0][]>>(
    '/api/products',
    { params: outletId ? { outletId } : {} }
  );
  return (response.data.data || []).map(mapApiProductToMasterProduct);
}

export async function getCategoriesApi(): Promise<ProductCategory[]> {
  const response = await apiClient.get<ApiSuccessResponse<ProductCategory[]>>('/api/categories');
  return response.data.success ? response.data.data || [] : [];
}

export async function getOutletsApi(): Promise<OutletSummary[]> {
  const response = await apiClient.get<ApiSuccessResponse<OutletSummary[]>>('/api/outlets');
  return response.data.success ? response.data.data || [] : [];
}

export async function getNextSkuApi(categoryId: string): Promise<string | null> {
  const response = await apiClient.get<ApiSuccessResponse<{ nextSku: string }>>(
    `/api/categories/${categoryId}/next-sku`
  );
  return response.data.success ? response.data.data.nextSku : null;
}

export async function getProductOutletSettingsApi(productId: string): Promise<OutletSettingsData | null> {
  const response = await apiClient.get<ApiSuccessResponse<OutletSettingsData>>(
    `/api/products/${productId}/outlet-settings`
  );
  return response.data.success ? response.data.data : null;
}

export async function createProductApi(payload: ProductFormPayload): Promise<void> {
  await apiClient.post('/api/products', payload);
}

export async function updateProductApi(productId: string, payload: ProductFormPayload): Promise<void> {
  await apiClient.put(`/api/products/${productId}`, payload);
}

export async function deleteProductApi(productId: string): Promise<void> {
  await apiClient.delete(`/api/products/${productId}`);
}

export async function uploadProductImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiClient.post<{ success: boolean; url?: string; message?: string }>(
    '/api/products/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  if (!response.data.success || !response.data.url) {
    throw new Error(response.data.message || 'Gagal mengunggah gambar.');
  }
  return response.data.url;
}

export async function savePriceOverrideApi(
  outletId: string,
  productId: string,
  price: number
): Promise<void> {
  await apiClient.post('/api/products/price-override', { outletId, productId, price });
}

export async function deletePriceOverrideApi(outletId: string, productId: string): Promise<void> {
  await apiClient.delete('/api/products/price-override', {
    data: { outletId, productId },
  });
}

export async function saveMinStockApi(
  outletId: string,
  productId: string,
  minStock: number
): Promise<void> {
  await apiClient.post('/api/products/min-stock', { outletId, productId, minStock });
}
