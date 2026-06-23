import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config';
import { useAuthStore } from '../store/useAuthStore';
import { usePlatformStore } from '../store/usePlatformStore';
import { isPlatformAdmin } from '../utils/roles';
import { ApiError } from './types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const { user, activeOutletId } = useAuthStore.getState();

  let tenantId = user?.tenantId ?? '';
  if (user && isPlatformAdmin(user.roles)) {
    const activeTenantId = usePlatformStore.getState().activeTenantId;
    if (activeTenantId) {
      tenantId = activeTenantId;
    }
  }

  if (tenantId && config.headers) {
    config.headers['x-tenant-id'] = tenantId;
  }

  if (activeOutletId && config.headers && !config.headers['x-outlet-id']) {
    config.headers['x-outlet-id'] = activeOutletId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data = error.response?.data;
    const message =
      (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : undefined) ||
      error.message ||
      'Terjadi kesalahan pada server.';

    const payload = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : undefined;

    return Promise.reject(
      new ApiError(message, {
        status,
        data: payload,
      })
    );
  }
);
