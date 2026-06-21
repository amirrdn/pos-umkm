import { apiClient } from './apiClient';
import type { ApiSuccessResponse } from './types';

export interface OutletListItem {
  id: string;
  name: string;
  type?: 'MAIN' | 'BRANCH';
  isActive?: boolean;
}

export async function listOutletsApi(options?: { operationalOnly?: boolean }): Promise<OutletListItem[]> {
  const response = await apiClient.get<ApiSuccessResponse<OutletListItem[]>>('/api/outlets', {
    params: options?.operationalOnly ? { operationalOnly: 'true' } : undefined,
  });
  return response.data.data ?? [];
}
