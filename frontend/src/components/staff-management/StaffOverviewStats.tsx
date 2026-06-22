import { Clock, UserCheck, UserMinus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StaffOverviewMetrics } from '../../types/staffManagement';
import type { UsageDetail } from '../../store/useSubscriptionStore';
import { isUnlimitedUsageLimit } from '../../store/useSubscriptionStore';

import { StaffOverviewStatsSkeleton } from './StaffOverviewStatsSkeleton';

export interface StaffOverviewStatsProps {
  loading?: boolean;
  metrics: StaffOverviewMetrics;
  staffQuota: UsageDetail | null;
  onSelectPendingTab: () => void;
  onUpgradePlan?: () => void;
}

interface StatCardConfig {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  colorClass: string;
  onClick?: () => void;
  highlight?: boolean;
}

function formatStaffQuotaLabel(staffQuota: UsageDetail | null): string {
  if (!staffQuota) {
    return '—';
  }
  if (isUnlimitedUsageLimit(staffQuota.limit)) {
    return `${staffQuota.current}`;
  }
  return `${staffQuota.current} / ${staffQuota.limit}`;
}

function buildStaffQuotaSubtext(staffQuota: UsageDetail | null): string {
  if (!staffQuota) {
    return 'Memuat kuota paket';
  }
  if (isUnlimitedUsageLimit(staffQuota.limit)) {
    return 'Tanpa batas staf';
  }
  if (staffQuota.isFull) {
    return 'Kuota penuh — upgrade paket';
  }
  if (staffQuota.isNearLimit) {
    return 'Kuota hampir penuh';
  }
  return 'Sisa kuota staf paket';
}

export function StaffOverviewStats({
  loading = false,
  metrics,
  staffQuota,
  onSelectPendingTab,
  onUpgradePlan,
}: StaffOverviewStatsProps) {
  if (loading) {
    return <StaffOverviewStatsSkeleton />;
  }

  const { activeStaffCount, inactiveStaffCount, pendingApprovalCount } = metrics;

  const statCards: StatCardConfig[] = [
    {
      id: 'active',
      title: 'Staf Aktif',
      value: activeStaffCount.toString(),
      subtext: 'Bisa login & operasional',
      icon: UserCheck,
      colorClass:
        'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      id: 'inactive',
      title: 'Nonaktif',
      value: inactiveStaffCount.toString(),
      subtext: 'Akun dinonaktifkan',
      icon: UserMinus,
      colorClass:
        'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
    },
    {
      id: 'pending',
      title: 'Menunggu',
      value: pendingApprovalCount.toString(),
      subtext: pendingApprovalCount > 0 ? 'Perlu persetujuan Anda' : 'Tidak ada permintaan',
      icon: Clock,
      colorClass:
        'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
      onClick: pendingApprovalCount > 0 ? onSelectPendingTab : undefined,
      highlight: pendingApprovalCount > 0,
    },
    {
      id: 'quota',
      title: 'Kuota Paket',
      value: formatStaffQuotaLabel(staffQuota),
      subtext: buildStaffQuotaSubtext(staffQuota),
      icon: Users,
      colorClass: staffQuota?.isFull
        ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50'
        : staffQuota?.isNearLimit
          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
          : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
      onClick: staffQuota?.isFull ? onUpgradePlan : undefined,
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 shrink-0 px-1 -mx-1">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        const isInteractive = Boolean(card.onClick);

        return (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            disabled={!isInteractive}
            className={`w-[260px] lg:w-auto shrink-0 snap-start bg-white dark:bg-slate-900 p-4.5 rounded-2xl border text-left shadow-sm flex items-center justify-between gap-4 transition-all duration-200 ${
              card.highlight
                ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200/60 dark:ring-amber-800/40'
                : 'border-slate-200/60 dark:border-slate-800'
            } ${
              isInteractive
                ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
                : 'cursor-default'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {card.title}
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 block truncate">
                {card.value}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                {card.subtext}
              </span>
            </div>
            <div
              className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${card.colorClass}`}
            >
              <IconComponent className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
