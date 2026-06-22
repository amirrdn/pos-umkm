import { Users } from 'lucide-react';
import type { UsageDetail } from '../../store/useSubscriptionStore';
import { isUnlimitedUsageLimit } from '../../store/useSubscriptionStore';

export interface StaffQuotaNoticeProps {
  staffQuota: UsageDetail | null;
  onUpgradePlan?: () => void;
}

function buildQuotaMessage(staffQuota: UsageDetail): string {
  if (isUnlimitedUsageLimit(staffQuota.limit)) {
    return `Paket Anda memiliki ${staffQuota.current} staf terdaftar tanpa batas kuota.`;
  }

  const remainingSlots = Math.max(staffQuota.limit! - staffQuota.current, 0);

  if (staffQuota.isFull) {
    return 'Kuota staf paket sudah penuh. Upgrade paket untuk menambah karyawan baru.';
  }

  if (staffQuota.isNearLimit) {
    return `Kuota hampir penuh. Tersisa ${remainingSlots} slot staf dari ${staffQuota.limit}.`;
  }

  return `Tersisa ${remainingSlots} slot staf dari kuota paket (${staffQuota.limit}).`;
}

export function StaffQuotaNotice({ staffQuota, onUpgradePlan }: StaffQuotaNoticeProps) {
  if (!staffQuota) {
    return null;
  }

  const isFull = staffQuota.isFull;
  const isWarning = staffQuota.isNearLimit || isFull;

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${
        isFull
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          : isWarning
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300'
      }`}
    >
      <Users className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold leading-relaxed">{buildQuotaMessage(staffQuota)}</p>
        {isFull && onUpgradePlan && (
          <button
            type="button"
            onClick={onUpgradePlan}
            className="cursor-pointer font-bold underline underline-offset-2 hover:opacity-80"
          >
            Lihat paket upgrade
          </button>
        )}
      </div>
    </div>
  );
}
