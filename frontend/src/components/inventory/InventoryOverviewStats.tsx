import { AlertTriangle, Package, XCircle, Wallet } from 'lucide-react';

export interface InventoryOverviewStatsProps {
  summaryStats: {
    totalItems: number;
    criticalItems: number;
    emptyItems: number;
    totalAssetValue: number;
  };
}

export function InventoryOverviewStats({ summaryStats }: InventoryOverviewStatsProps) {
  const { totalItems, criticalItems, emptyItems, totalAssetValue } = summaryStats;

  const stats = [
    {
      id: 'total',
      title: 'Total Item Stok',
      value: totalItems.toString(),
      subtext: 'Jenis barang terdaftar',
      icon: Package,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'critical',
      title: 'Stok Kritis',
      value: criticalItems.toString(),
      subtext: 'Segera lakukan restock',
      icon: AlertTriangle,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'empty',
      title: 'Stok Habis',
      value: emptyItems.toString(),
      subtext: 'Stok kosong (0 unit)',
      icon: XCircle,
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'assets',
      title: 'Estimasi Nilai Aset',
      value: `Rp ${totalAssetValue.toLocaleString('id-ID')}`,
      subtext: 'Valuasi HPP x stok unit',
      icon: Wallet,
      colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 shrink-0">
      {stats.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-md"
          >
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {item.title}
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block truncate">
                {item.value}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
                {item.subtext}
              </span>
            </div>
            <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-center shrink-0 ${item.colorClass}`}>
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
