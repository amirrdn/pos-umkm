import { Crown, Medal, Package, Star } from 'lucide-react';
import type { BestSellerProduct } from '../../types/dashboardAdmin';

export interface DashboardBestSellersTableProps {
  loading: boolean;
  bestSellers: BestSellerProduct[];
}

const RANK_CONFIG = [
  {
    gradient: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500',
    shadow: 'shadow-amber-400/40',
    ring: 'ring-2 ring-amber-300/60',
    barColor: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    rowBg: 'bg-amber-50/60 dark:bg-amber-900/10',
    rowBorder: 'border-amber-200/60 dark:border-amber-700/30',
    rowHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300/60',
    icon: <Crown className="w-3.5 h-3.5 text-white drop-shadow" />,
    rank: '1',
  },
  {
    gradient: 'bg-gradient-to-br from-slate-400 via-slate-300 to-slate-500',
    shadow: 'shadow-slate-400/40',
    ring: 'ring-2 ring-slate-300/60',
    barColor: 'bg-gradient-to-r from-slate-400 to-slate-500',
    rowBg: 'bg-slate-50/80 dark:bg-slate-950/50',
    rowBorder: 'border-slate-200/80 dark:border-slate-800',
    rowHover: 'hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300',
    icon: <Medal className="w-3.5 h-3.5 text-white drop-shadow" />,
    rank: '2',
  },
  {
    gradient: 'bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600',
    shadow: 'shadow-orange-400/40',
    ring: 'ring-2 ring-orange-300/60',
    barColor: 'bg-gradient-to-r from-orange-400 to-amber-500',
    rowBg: 'bg-orange-50/40 dark:bg-orange-900/10',
    rowBorder: 'border-orange-200/50 dark:border-orange-800/30',
    rowHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300/60',
    icon: <Medal className="w-3.5 h-3.5 text-white drop-shadow" />,
    rank: '3',
  },
];

function DefaultRankBadge({ rank }: { rank: number }) {
  return (
    <div className="flex-shrink-0 flex flex-col items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
      <Star className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 mb-0.5" />
      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 leading-none">
        #{rank}
      </span>
    </div>
  );
}

export function DashboardBestSellersTable({ loading, bestSellers }: DashboardBestSellersTableProps) {
  const maxQty = bestSellers.length > 0 ? Math.max(...bestSellers.map((p) => p.totalQuantity)) : 1;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md dark:shadow-none flex flex-col backdrop-blur-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow shadow-amber-400/30">
            <Crown className="w-4 h-4 text-white" />
          </div>
          Peringkat Penjualan
        </h3>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Total Volume
        </span>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>

      ) : bestSellers.length === 0 ? (
        <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl gap-2">
          <Package className="w-10 h-10 opacity-30 text-slate-400" />
          <p className="text-xs font-semibold text-slate-400">Belum ada transaksi terekam.</p>
        </div>

      ) : (
        <div className="space-y-2.5 flex-1">
          {bestSellers.map((product, index) => {
            const percent = Math.round((product.totalQuantity / maxQty) * 100);
            const isTop3 = index < 3;
            const cfg = isTop3 ? RANK_CONFIG[index] : null;

            return (
              <div
                key={product.productId}
                className={`group relative flex items-center gap-3 p-3 border rounded-2xl transition-all duration-200 ${
                  isTop3
                    ? `${cfg!.rowBg} ${cfg!.rowBorder} ${cfg!.rowHover}`
                    : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50 hover:border-indigo-300/40 dark:hover:border-indigo-700/40'
                }`}
              >
                {/* Rank Badge */}
                {isTop3 ? (
                  <div
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl ${cfg!.gradient} ${cfg!.shadow} ${cfg!.ring} shadow-md`}
                  >
                    {cfg!.icon}
                    <span className="text-[10px] font-black text-white/90 leading-none mt-0.5">
                      #{cfg!.rank}
                    </span>
                  </div>
                ) : (
                  <DefaultRankBadge rank={index + 1} />
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate transition-colors ${
                    index === 0
                      ? 'text-amber-700 dark:text-amber-300 group-hover:text-amber-600'
                      : index === 1
                      ? 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                      : index === 2
                      ? 'text-orange-700 dark:text-orange-300 group-hover:text-orange-600'
                      : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}>
                    {product.name}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md flex-shrink-0">
                      {product.sku || 'N/A'}
                    </span>
                    {/* Progress bar */}
                    <div className="flex-1 bg-slate-200/60 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isTop3 ? cfg!.barColor : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="text-right flex-shrink-0 min-w-[42px]">
                  <p className={`text-sm font-black font-mono ${
                    index === 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : index === 1
                      ? 'text-slate-600 dark:text-slate-300'
                      : index === 2
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
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
