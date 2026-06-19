import { useAuthStore } from '../store/useAuthStore';
import {
  canReceiveDraftTransferNotifications,
  useNotificationStore,
} from '../store/useNotificationStore';

interface DraftTransferNavBadgeProps {
  className?: string;
}

/** Badge count transfer DRAFT — hanya Owner/Manager dengan count > 0. */
export function DraftTransferNavBadge({ className = '' }: DraftTransferNavBadgeProps) {
  const user = useAuthStore((state) => state.user);
  const count = useNotificationStore((state) => state.draftTransferCount);

  if (!user || !canReceiveDraftTransferNotifications(user.roles) || count <= 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.125rem] px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full font-black leading-none ${className}`}
      aria-label={`${count} transfer menunggu persetujuan`}
    >
      {count}
    </span>
  );
}
