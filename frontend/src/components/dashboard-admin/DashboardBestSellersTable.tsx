import { Crown, Package, Trophy } from 'lucide-react';
import type { BestSellerProduct } from '../../types/dashboardAdmin';

export interface DashboardBestSellersTableProps {
  loading: boolean;
  bestSellers: BestSellerProduct[];
}

function getRankBadge(index: number) {
  if (index === 0) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400',
      label: '#1 Gold',
    };
  }
  if (index === 1) {
    return {
      bg: 'bg-slate-300/30 dark:bg-slate-700/40 border-slate-400/30 text-slate-700 dark:text-slate-200',
      label: '#2 Silver',
    };
  }
  if (index === 2) {
    return {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400',
      label: '#3 Bronze',
    };
  }
  return {
    bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400',
    label: `#${index + 1}`,
  };
}

export function DashboardBestSellersTable({ loading, bestSellers }: DashboardBestSellersTableProps) {
  const maxQty = bestSellers.length > 0 ? Math.max(...bestSellers.map((p) => p.totalQuantity)) : 1;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none flex flex-col backdrop-blur-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Trophy className="w-4 h-4" />
          </div>
          Peringkat Penjualan
        </h3>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Volume</span>
      </div>

      {loading ? (
        <div className="space-y-3.5 flex-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : bestSellers.length === 0 ? (
        <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Package className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-semibold">Belum ada transaksi terekam.</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {bestSellers.map((product, index) => {
            const badge = getRankBadge(index);
            const percent = Math.round((product.totalQuantity / maxQty) * 100);

            return (
              <div
                key={product.productId}
                className="group relative overflow-hidden flex items-center gap-3.5 p-3.5 bg-slate-50/80 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl transition-all shadow-2xs hover:shadow-xs hover:border-indigo-500/30"
              >
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border font-black text-xs shadow-2xs ${badge.bg}`}
                >
                  {index === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : badge.label}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {product.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                      {product.sku || 'N/A'}
                    </span>
                    <div className="flex-1 bg-slate-200/60 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {product.totalQuantity}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    Unit
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
