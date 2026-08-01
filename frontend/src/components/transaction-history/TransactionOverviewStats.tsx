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
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'success',
      title: 'Transaksi Sukses',
      value: `${successCount} Transaksi`,
      subtext: 'Lunas & terbayar',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'pending',
      title: 'Menunggu Pembayaran',
      value: `${pendingCount} Transaksi`,
      subtext: `Nominal: ${formatTransactionRupiah(pendingAmount)}`,
      icon: Clock,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'void',
      title: 'Transaksi Batal (Void)',
      value: `${voidCount} Transaksi`,
      subtext: 'Dibatalkan / Void',
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
      {stats.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            className="w-[270px] sm:w-auto shrink-0 snap-start bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md dark:shadow-none flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {item.title}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-50 block truncate font-mono tracking-tight">
                {item.value}
              </span>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 truncate">
                {item.subtext}
              </span>
            </div>
            <div className={`p-3 rounded-2xl border shrink-0 ${item.iconBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
