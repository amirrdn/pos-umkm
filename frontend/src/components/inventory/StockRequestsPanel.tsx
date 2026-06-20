import { Package, Loader2, Check, Ban } from 'lucide-react';
import { getMutationTypeBadgeClass } from '../../utils/inventoryHelpers';
import type { StockRequest } from '../../types/inventory';

export interface StockRequestsPanelProps {
  stockRequests: StockRequest[];
  requestsLoading: boolean;
  onProcessRequest: (id: string, action: 'approve' | 'reject') => void;
}

export function StockRequestsPanel({
  stockRequests,
  requestsLoading,
  onProcessRequest,
}: StockRequestsPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
      {requestsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat permintaan persetujuan stok...</p>
        </div>
      ) : stockRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Package className="w-16 h-16 text-slate-700" />
          <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Antrean Bersih</h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-md">Tidak ada permintaan persetujuan stok pending saat ini.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Pengaju</th>
                <th className="px-6 py-4">Tipe Mutasi</th>
                <th className="px-6 py-4 text-center">Jumlah</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
              {stockRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{req.product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">{req.product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {req.user.name}
                  </td>
                  <td className="px-6 py-4 text-slate-650 dark:text-slate-405">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getMutationTypeBadgeClass(req.type)}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {req.quantity} unit
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate" title={req.note || ''}>
                    {req.note || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onProcessRequest(req.id, 'approve')}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-150"
                        title="Setujui Mutasi"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Setujui
                      </button>
                      <button
                        onClick={() => onProcessRequest(req.id, 'reject')}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-150"
                        title="Tolak Mutasi"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
