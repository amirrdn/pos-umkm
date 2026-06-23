import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  canReceiveDraftTransferNotifications,
  useNotificationStore,
} from '../store/useNotificationStore';

/** Poll / SSE transfer DRAFT untuk Owner/Manager — mount sekali di App. */
export function NotificationPoller() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const startRealtime = useNotificationStore((state) => state.startRealtime);
  const stopRealtime = useNotificationStore((state) => state.stopRealtime);

  const roleKey = user?.roles.join(',') ?? '';

  useEffect(() => {
    if (isAuthenticated && user && canReceiveDraftTransferNotifications(user.roles)) {
      startRealtime();
      return () => stopRealtime();
    }
    stopRealtime();
  }, [isAuthenticated, user, roleKey, startRealtime, stopRealtime]);

  return null;
}
