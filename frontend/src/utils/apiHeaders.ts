import { useAuthStore } from '../store/useAuthStore';

/**
 * Membangun header HTTP standar untuk request API yang membutuhkan autentikasi tenant.
 * Menyertakan x-outlet-id jika outlet aktif dipilih.
 */
export function buildApiHeaders(extra?: Record<string, string>): HeadersInit {
  const { token, user, activeOutletId } = useAuthStore.getState();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token ?? ''}`,
    'x-tenant-id': user?.tenantId ?? '',
    ...extra,
  };

  if (activeOutletId) {
    headers['x-outlet-id'] = activeOutletId;
  }

  return headers;
}
