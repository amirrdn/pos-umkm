import { apiClient } from './apiClient';
import type {
  OutletHierarchy,
  StaffBulkApproveResult,
  StaffDetail,
  StaffFormState,
  StaffListQuery,
  StaffListResult,
  StaffRole,
  StaffUser,
} from '../types/staffManagement';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface StaffListApiResponse extends ApiResponse<StaffUser[]> {
  summary: StaffListResult['summary'];
}

export async function getStaffListApi(query: StaffListQuery = {}): Promise<StaffListResult> {
  const response = await apiClient.get<StaffListApiResponse>('/api/staff', { params: query });
  return {
    staff: response.data.data,
    summary: response.data.summary,
  };
}

export async function getStaffRolesApi(): Promise<StaffRole[]> {
  const response = await apiClient.get<ApiResponse<StaffRole[]>>('/api/staff/roles');
  return response.data.data;
}

export async function getOutletHierarchyApi(): Promise<OutletHierarchy> {
  const response = await apiClient.get<ApiResponse<OutletHierarchy>>('/api/outlets/hierarchy');
  return {
    main: response.data.data?.main ?? null,
    branches: response.data.data?.branches ?? [],
  };
}

export async function createStaffApi(payload: StaffFormState): Promise<StaffUser> {
  const response = await apiClient.post<ApiResponse<StaffUser>>('/api/staff', payload);
  return response.data.data;
}

export async function updateStaffApi(
  id: string,
  payload: Pick<StaffFormState, 'name' | 'roleId' | 'outletIds'>
): Promise<StaffUser> {
  const response = await apiClient.patch<ApiResponse<StaffUser>>(`/api/staff/${id}`, payload);
  return response.data.data;
}

export async function toggleStaffStatusApi(id: string, isActive: boolean): Promise<StaffUser> {
  const response = await apiClient.patch<ApiResponse<StaffUser>>(`/api/staff/${id}`, { isActive });
  return response.data.data;
}

export async function deleteStaffApi(id: string): Promise<void> {
  await apiClient.delete(`/api/staff/${id}`);
}

export async function approveStaffApi(id: string): Promise<StaffUser> {
  const response = await apiClient.patch<ApiResponse<StaffUser>>(`/api/staff/${id}/approve`);
  return response.data.data;
}

export async function rejectStaffApi(id: string): Promise<StaffUser> {
  const response = await apiClient.patch<ApiResponse<StaffUser>>(`/api/staff/${id}/reject`);
  return response.data.data;
}

export async function getStaffDetailApi(id: string): Promise<StaffDetail> {
  const response = await apiClient.get<ApiResponse<StaffDetail>>(`/api/staff/${id}`);
  return response.data.data;
}

export async function bulkApproveStaffApi(staffIds: string[]): Promise<StaffBulkApproveResult> {
  const response = await apiClient.patch<ApiResponse<StaffBulkApproveResult>>('/api/staff/bulk-approve', {
    staffIds,
  });
  return response.data.data;
}
