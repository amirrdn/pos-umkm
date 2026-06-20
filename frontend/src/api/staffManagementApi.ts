import { apiClient } from './apiClient';
import type {
  OutletHierarchy,
  StaffFormState,
  StaffRole,
  StaffUser,
} from '../types/staffManagement';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getStaffListApi(): Promise<StaffUser[]> {
  const response = await apiClient.get<ApiResponse<StaffUser[]>>('/api/staff');
  return response.data.data;
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
