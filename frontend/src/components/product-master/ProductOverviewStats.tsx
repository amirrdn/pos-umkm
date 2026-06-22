import { AlertTriangle, Package, Tag, XCircle } from 'lucide-react';

export interface ProductOverviewStatsProps {
  summaryStats: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalCategoriesCount: number;
  };
}

export function ProductOverviewStats({ summaryStats }: ProductOverviewStatsProps) {
  const { totalProducts, lowStockCount, outOfStockCount, totalCategoriesCount } = summaryStats;

  const stats = [
    {
      id: 'total',
      title: 'Total Produk',
      value: totalProducts.toString(),
      subtext: 'Varian terdaftar',
      icon: Package,
      colorClass: 'text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    },
    {
      id: 'low',
      title: 'Stok Menipis',
      value: lowStockCount.toString(),
      subtext: 'Segera restock',
      icon: AlertTriangle,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
    },
    {
      id: 'empty',
      title: 'Stok Habis',
      value: outOfStockCount.toString(),
      subtext: 'Stok kosong (0)',
      icon: XCircle,
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
    },
    {
      id: 'categories',
      title: 'Total Kategori',
      value: totalCategoriesCount.toString(),
      subtext: 'Kategori produk',
      icon: Tag,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-4 shrink-0 px-1 -mx-1">
      {stats.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.id}
            className="w-[260px] lg:w-auto shrink-0 snap-start bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
