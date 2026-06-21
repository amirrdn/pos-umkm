import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  canReceiveDraftTransferNotifications,
  useNotificationStore,
} from '../store/useNotificationStore';

/** Poll / SSE transfer DRAFT untuk Owner/Manager — mount sekali di App. */
export function NotificationPoller() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const startRealtime = useNotificationStore((state) => state.startRealtime);
  const stopRealtime = useNotificationStore((state) => state.stopRealtime);

  const roleKey = user?.roles.join(',') ?? '';

  useEffect(() => {
    if (token && user && canReceiveDraftTransferNotifications(user.roles)) {
      startRealtime();
      return () => stopRealtime();
    }
    stopRealtime();
  }, [token, user, roleKey, startRealtime, stopRealtime]);

  return null;
}
