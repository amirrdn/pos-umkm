import { useAuthStore } from '../store/useAuthStore';
import { usePlatformStore } from '../store/usePlatformStore';
import { isPlatformAdmin } from './roles';

/**
 * Membangun header HTTP standar untuk request API yang membutuhkan autentikasi tenant.
 * Admin platform memakai activeTenantId dari Tenant Switcher sebagai x-tenant-id.
 */
export function buildApiHeaders(extra?: Record<string, string>): HeadersInit {
  const { token, user, activeOutletId } = useAuthStore.getState();

  let tenantId = user?.tenantId ?? '';
  if (user && isPlatformAdmin(user.roles)) {
    const activeTenantId = usePlatformStore.getState().activeTenantId;
    if (activeTenantId) {
      tenantId = activeTenantId;
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token ?? ''}`,
    'x-tenant-id': tenantId,
    ...extra,
  };

  if (activeOutletId) {
    headers['x-outlet-id'] = activeOutletId;
  }

  return headers;
}
