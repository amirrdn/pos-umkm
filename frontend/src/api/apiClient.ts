import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';
import { usePlatformStore } from '../store/usePlatformStore';
import { isPlatformAdmin } from '../utils/roles';
import { ApiError } from './types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout for reliability
});

// Request Interceptor: Automatically inject auth token and tenant headers
apiClient.interceptors.request.use((config) => {
  const { token, user, activeOutletId } = useAuthStore.getState();
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Resolve tenant ID context
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

  // Inject active outlet ID if present and not overridden by custom header
  if (activeOutletId && config.headers && !config.headers['x-outlet-id']) {
    config.headers['x-outlet-id'] = activeOutletId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Global handler for auth failures or clean error unwrapping
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
        status: error.response?.status,
        data: payload,
      })
    );
  }
);
