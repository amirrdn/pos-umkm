import { Package, ArrowUpDown, History, Loader2 } from 'lucide-react';
import type { Product } from '../../types/inventory';

export interface InventoryOverviewPanelProps {
  products: Product[];
  loading: boolean;
  canMutate: boolean | undefined;
  isBelowMinStock: (prod: Product) => boolean;
  onOpenLedger: (product: Product) => void;
  onOpenMutation: (product: Product) => void;
}

export function InventoryOverviewPanel({
  products,
  loading,
  canMutate,
  isBelowMinStock,
  onOpenLedger,
  onOpenMutation,
}: InventoryOverviewPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat inventaris produk...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Package className="w-16 h-16 text-slate-700" />
          <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Produk Kosong</h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-md">Katalog produk belum terdaftar. Silakan tambahkan produk baru di menu Kelola Produk terlebih dahulu.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Nama Produk / SKU</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-right">Harga Beli (HPP)</th>
                <th className="px-6 py-4 text-right">Harga Jual</th>
                <th className="px-6 py-4 text-center">Stok Saat Ini</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
              {products.map((prod) => {
                const belowMin = isBelowMinStock(prod);
                const stockStatus = belowMin
                  ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                  : prod.stock <= 5
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : prod.stock <= 15
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{prod.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 font-mono tracking-wider">{prod.sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {prod.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      Rp {Number(prod.purchasePrice).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      Rp {Number(prod.sellingPrice).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${stockStatus}`}>
                        {prod.stock} unit
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenLedger(prod)}
                          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-150 active:scale-95"
                          title="Riwayat Kartu Stok"
                        >
                          <History className="w-3.5 h-3.5" />
                          Kartu Stok
                        </button>

                        {canMutate && (
                          <button
                            onClick={() => onOpenMutation(prod)}
                            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 transition-all duration-150 active:scale-95"
                            title="Mutasi Stok Manual"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Mutasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
