import { AlertCircle, CheckCircle } from 'lucide-react';
import type { CustomerNotification } from '../../types/customerManagement';

export interface CustomerToastProps {
  notification: CustomerNotification;
}

export function CustomerToast({ notification }: CustomerToastProps) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3.5 rounded-xl shadow-xl text-xs font-bold border animate-in slide-in-from-bottom duration-200 ${
        notification.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-250 text-rose-800'
      }`}
    >
      {notification.type === 'success' ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{notification.message}</span>
    </div>
  );
}
