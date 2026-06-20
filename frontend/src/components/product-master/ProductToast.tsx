import { AlertCircle, CheckCircle } from 'lucide-react';
import type { ProductNotification } from '../../types/productMaster';

export interface ProductToastProps {
  notification: ProductNotification;
  onDismiss: () => void;
}

export function ProductToast({ notification, onDismiss }: ProductToastProps) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-350 transform translate-y-0 ${notification.type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}>
      {notification.type === 'success' ? (
        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
      )}
      <span className="text-sm font-medium">{notification.message}</span>
      <button onClick={onDismiss} className="cursor-pointer ml-2 hover:opacity-75 text-xs font-bold">✕</button>
    </div>
  );
}
