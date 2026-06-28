import { History, X, CornerDownRight } from 'lucide-react';
import {
  getLedgerQuantitySignAndColor,
  getLedgerTypeBadgeClass,
} from '../../utils/inventoryHelpers';
import type { LedgerEntry, Product } from '../../types/inventory';

export interface StockLedgerDrawerProps {
  ledgerProduct: Product;
  ledgerEntries: LedgerEntry[];
  ledgerLoading: boolean;
  onClose: () => void;
}

export function StockLedgerDrawer({
  ledgerProduct,
  ledgerEntries,
  ledgerLoading,
  onClose,
}: StockLedgerDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Kartu Stok Produk</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ledgerProduct.name} (SKU: {ledgerProduct.sku})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {ledgerLoading ? (
            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="relative group animate-pulse">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-800" />
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-8 w-full bg-slate-100 dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-800/80" />
                    <div className="flex justify-end">
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ledgerEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <History className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada mutasi stok tercatat untuk produk ini.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-6">
              {ledgerEntries.map((entry) => {
                const { sign, colorClass } = getLedgerQuantitySignAndColor(entry.quantity);
                const isPositive = entry.quantity > 0;

                return (
                  <div key={entry.id} className="relative group">
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />

                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getLedgerTypeBadgeClass(entry.type)}`}>
                          {entry.type}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                          {new Date(entry.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Mutasi:</span>
                          <span className={`font-bold font-mono px-2 py-0.5 rounded ${colorClass}`}>
                            {sign}{entry.quantity} unit
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {entry.stockBefore} → <span className="text-slate-700 dark:text-slate-200 font-bold">{entry.stockAfter} unit</span>
                        </div>
                      </div>

                      {entry.note && (
                        <div className="flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-550 flex-shrink-0 mt-0.5" />
                          <p className="italic">"{entry.note}"</p>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 text-right">
                        Oleh: <span className="font-semibold text-slate-600 dark:text-slate-400">{entry.user?.name || 'Sistem'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Total Entri: {ledgerEntries.length}</span>
          <span>Stok saat ini: {ledgerProduct.stock} unit</span>
        </div>
      </div>
    </div>
  );
}
