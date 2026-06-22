import { AlertCircle, ChevronRight } from 'lucide-react';

export interface StaffPendingBannerProps {
  pendingApprovalCount: number;
  onViewPendingRequests: () => void;
}

export function StaffPendingBanner({
  pendingApprovalCount,
  onViewPendingRequests,
}: StaffPendingBannerProps) {
  if (pendingApprovalCount <= 0) {
    return null;
  }

  const requestLabel = 'permintaan';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/20 shadow-sm">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            {pendingApprovalCount} {requestLabel} menunggu persetujuan Anda
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
            Tinjau pendaftaran staf baru agar mereka bisa mulai bekerja.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewPendingRequests}
        className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0 self-start sm:self-auto"
      >
        Lihat Permintaan
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
