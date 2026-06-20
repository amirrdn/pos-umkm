import { Package } from 'lucide-react';
import type { BestSellerProduct } from '../../types/dashboardAdmin';

export interface DashboardBestSellersTableProps {
  loading: boolean;
  bestSellers: BestSellerProduct[];
}

export function DashboardBestSellersTable({ loading, bestSellers }: DashboardBestSellersTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-lg flex flex-col backdrop-blur-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider">
        Tabel Produk Terlaris
      </h3>

      {loading ? (
        <div className="space-y-4 flex-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-slate-200 dark:bg-slate-850 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : bestSellers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <Package className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-xs">Data kosong</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {bestSellers.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-2xl transition-all"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-350 text-xs">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">SKU: {product.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-indigo-650 dark:text-indigo-400 font-mono">
                  {product.totalQuantity}
                </p>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Unit</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
