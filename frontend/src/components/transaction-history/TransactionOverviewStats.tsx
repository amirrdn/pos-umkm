import { AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { formatTransactionRupiah } from '../../utils/transactionHistoryHelpers';

export interface TransactionOverviewStatsProps {
  summaryStats: {
    totalRevenue: number;
    successCount: number;
    pendingCount: number;
    pendingAmount: number;
    voidCount: number;
  };
}

export function TransactionOverviewStats({ summaryStats }: TransactionOverviewStatsProps) {
  const { totalRevenue, successCount, pendingCount, pendingAmount, voidCount } = summaryStats;

  const stats = [
    {
      id: 'revenue',
      title: 'Total Pendapatan',
      value: formatTransactionRupiah(totalRevenue),
      subtext: `${successCount} Transaksi Selesai`,
      icon: DollarSign,
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    },
    {
      id: 'success',
      title: 'Transaksi Sukses',
      value: successCount.toString(),
      subtext: 'Selesai & terbayar',
      icon: CheckCircle2,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      id: 'pending',
      title: 'Menunggu Pembayaran',
      value: pendingCount.toString(),
      subtext: `Nominal: ${formatTransactionRupiah(pendingAmount)}`,
      icon: Clock,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
    },
    {
      id: 'void',
      title: 'Transaksi Batal (Void)',
      value: voidCount.toString(),
      subtext: 'Batal atau dihapus',
      icon: AlertTriangle,
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
      {stats.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            className="w-[260px] sm:w-auto shrink-0 snap-start bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {item.title}
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 block truncate">
                {item.value}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                {item.subtext}
              </span>
            </div>
            <div className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${item.colorClass}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
