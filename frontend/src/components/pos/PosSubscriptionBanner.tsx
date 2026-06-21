import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { SubscriptionDetails } from '../../store/useSubscriptionStore';

interface PosSubscriptionBannerProps {
  subscription: SubscriptionDetails | null;
  subscriptionBypass: boolean;
  managesSubscription: boolean;
  navigate: (path: string) => void;
}

export const PosSubscriptionBanner: React.FC<PosSubscriptionBannerProps> = ({
  subscription,
  subscriptionBypass,
  managesSubscription,
  navigate,
}) => {
  if (!subscription || subscriptionBypass) return null;

  const isExpired = subscription.status === 'EXPIRED';
  const isFull = subscription.usage?.transactions?.isFull;
  const isNearLimit = subscription.usage?.transactions?.isNearLimit;
  const currentUsage = subscription.usage?.transactions?.current;
  const limitUsage = subscription.usage?.transactions?.limit;

  if (isExpired) {
    return (
      <div className="bg-rose-600 text-white px-3 sm:px-5 py-3 text-xs font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 animate-bounce" />
          <span>Masa aktif langganan Anda telah kedaluwarsa. Aplikasi saat ini terkunci (Mode Read-Only). Aksi kasir diblokir hingga pembayaran diperbarui.</span>
        </div>
        {managesSubscription && (
          <button
            onClick={() => navigate('/admin/billing')}
            className="cursor-pointer bg-white text-rose-650 px-3.5 py-1.5 rounded-lg font-black hover:bg-slate-100 transition-all text-[10px] uppercase shadow-sm active:scale-97"
          >
            Bayar Sekarang
          </button>
        )}
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="bg-rose-600 text-white px-3 sm:px-5 py-3 text-xs font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 animate-bounce" />
          <span>Kuota transaksi bulanan Anda telah penuh ({currentUsage} / {limitUsage} trxs). Checkout POS ditangguhkan.</span>
        </div>
        {managesSubscription && (
          <button
            onClick={() => navigate('/admin/billing')}
            className="cursor-pointer bg-white text-rose-600 px-3.5 py-1.5 rounded-lg font-black hover:bg-slate-100 transition-all text-[10px] uppercase shadow-sm active:scale-97"
          >
            Upgrade Sekarang
          </button>
        )}
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="bg-amber-500 text-slate-900 px-3 sm:px-5 py-2.5 text-xs font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Kuota transaksi bulanan Anda hampir habis ({currentUsage} / {limitUsage} trxs). Harap lakukan upgrade paket untuk kelancaran kasir.</span>
        </div>
        {managesSubscription && (
          <button
            onClick={() => navigate('/admin/billing')}
            className="cursor-pointer bg-slate-900 text-white px-3.5 py-1.5 rounded-lg font-black hover:bg-slate-800 transition-all text-[10px] uppercase shadow-sm active:scale-97"
          >
            Upgrade Paket
          </button>
        )}
      </div>
    );
  }

  return null;
};
