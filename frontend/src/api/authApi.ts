import { apiClient } from './apiClient';
import type { AuthUser } from '../store/useAuthStore';
import type { ApiSuccessResponse } from './types';

export type LoginErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'APPROVAL_PENDING'
  | 'ACCOUNT_REJECTED'
  | 'ACCOUNT_DISABLED'
  | 'INVALID_CREDENTIALS';

export interface LoginResult {
  user: AuthUser;
}

export async function loginApi(payload: { email: string; password: string }): Promise<ApiSuccessResponse<LoginResult>> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResult>>('/api/auth/login', payload);
  return response.data;
}

export async function resendVerificationApi(email: string): Promise<ApiSuccessResponse<null>> {
  const response = await apiClient.post<ApiSuccessResponse<null>>('/api/auth/resend-verification', { email });
  return response.data;
}

export async function verifyEmailApi(token: string): Promise<ApiSuccessResponse<{ email?: string }>> {
  const response = await apiClient.post<ApiSuccessResponse<{ email?: string }>>('/api/auth/verify-email', { token });
  return response.data;
}

export async function fetchRegisterTenantsApi(): Promise<Array<{ id: string; name: string }>> {
  const response = await apiClient.get<ApiSuccessResponse<Array<{ id: string; name: string }>>>('/api/auth/tenants');
  return response.data.data ?? [];
}

export async function fetchRegisterOutletsApi(tenantId: string): Promise<Array<{ id: string; name: string }>> {
  const response = await apiClient.get<ApiSuccessResponse<Array<{ id: string; name: string }>>>(
    `/api/auth/tenants/${tenantId}/outlets`
  );
  return response.data.data ?? [];
}

export async function registerOwnerApi(payload: {
  tenantName: string;
  ownerName: string;
  email: string;
  password: string;
}): Promise<ApiSuccessResponse<unknown>> {
  const response = await apiClient.post<ApiSuccessResponse<unknown>>('/api/auth/register', payload);
  return response.data;
}

export async function registerStaffApi(payload: {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  outletIds: string[];
}): Promise<ApiSuccessResponse<unknown>> {
  const response = await apiClient.post<ApiSuccessResponse<unknown>>('/api/auth/register-staff', payload);
  return response.data;
}

export async function googleLoginApi(payload: { idToken: string; role?: 'owner' | 'staff' }): Promise<ApiSuccessResponse<LoginResult>> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResult>>('/api/auth/google', payload);
  return response.data;
}

export async function logoutApi(): Promise<ApiSuccessResponse<null>> {
  const response = await apiClient.post<ApiSuccessResponse<null>>('/api/auth/logout');
  return response.data;
}
