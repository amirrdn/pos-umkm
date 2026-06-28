import {
  ArrowUpDown,
  AlertCircle,
  Info,
  Store,
  X,
  Loader2,
} from 'lucide-react';
import { AppSelect } from '../AppSelect';
import type { AppSelectGroup } from '../AppSelect';
import type { MutationForm, Product } from '../../types/inventory';
import type { Outlet } from '../../store/useOutletStore';

export interface MutationModalProps {
  selectedProduct: Product;
  mutationSubmitting: boolean;
  mutationError: string | null;
  mutationForm: MutationForm;
  setMutationForm: React.Dispatch<React.SetStateAction<MutationForm>>;
  mutationOutletStock: number | null;
  mutationStockLoading: boolean;
  selectedMutationOutlet: Outlet | undefined;
  accessibleOutlets: Outlet[];
  mutationEligibleOutlets: Outlet[];
  mutationOutletGroups: AppSelectGroup[];
  handleMutationTypeChange: (type: string) => void;
  handleMutationSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function MutationModal({
  selectedProduct,
  mutationSubmitting,
  mutationError,
  mutationForm,
  setMutationForm,
  mutationOutletStock,
  mutationStockLoading,
  selectedMutationOutlet,
  accessibleOutlets,
  mutationEligibleOutlets,
  mutationOutletGroups,
  handleMutationTypeChange,
  handleMutationSubmit,
  onClose,
}: MutationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !mutationSubmitting && onClose()}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Mutasi Stok Manual</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedProduct.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={mutationSubmitting}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleMutationSubmit}>
          <div className="p-6 space-y-4">
            {mutationError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{mutationError}</p>
              </div>
            )}

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 text-xs">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <p>
                Stok di{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedMutationOutlet?.name ?? 'outlet terpilih'}
                </span>
                :{' '}
                {mutationStockLoading ? (
                  <span className="inline-block h-3.5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse align-middle" />
                ) : (
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {mutationOutletStock ?? selectedProduct.stock} unit
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipe Penyesuaian</label>
              <AppSelect
                value={mutationForm.type}
                onChange={handleMutationTypeChange}
                searchable={false}
                options={[
                  { value: 'RESTOCK', label: 'RESTOCK', description: '+ Tambah Stok / Pasokan' },
                  { value: 'ADJUSTMENT_PLUS', label: 'ADJUSTMENT_PLUS', description: '+ Penyesuaian / Temuan Barang' },
                  { value: 'ADJUSTMENT_MINUS', label: 'ADJUSTMENT_MINUS', description: '- Penyesuaian / Rusak / Hilang' },
                  { value: 'RETURN', label: 'RETURN', description: '+ Retur dari Pelanggan' },
                ]}
              />
              {mutationForm.type === 'RESTOCK' && accessibleOutlets.length > 1 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">
                  RESTOCK supplier hanya ke Outlet Utama. Untuk mutasi stok di cabang, pilih ADJUSTMENT atau RETURN.
                </p>
              )}
            </div>

            {mutationEligibleOutlets.length > 1 ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outlet</label>
                <AppSelect
                  value={mutationForm.outletId}
                  onChange={(outletId) =>
                    setMutationForm({ ...mutationForm, outletId })
                  }
                  placeholder="-- Pilih Outlet --"
                  groups={mutationOutletGroups}
                  searchable={mutationEligibleOutlets.length > 4}
                />
              </div>
            ) : mutationEligibleOutlets.length === 1 ? (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
                <Store className="w-4 h-4 shrink-0" />
                <span>
                  Outlet: <span className="font-bold">{mutationEligibleOutlets[0].name}</span>
                  {mutationEligibleOutlets[0].type === 'MAIN' ? ' (Pusat)' : ' (Cabang)'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tidak ada outlet aktif yang dapat dipilih untuk mutasi ini.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Jumlah Penyesuaian (Unit)</label>
              <input
                type="number"
                required
                min={1}
                value={mutationForm.quantity}
                onChange={(e) => setMutationForm({ ...mutationForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Catatan / Alasan Mutasi</label>
              <textarea
                required
                placeholder="Contoh: Barang rusak saat pengiriman, Restock mingguan dari supplier X"
                value={mutationForm.note}
                onChange={(e) => setMutationForm({ ...mutationForm, note: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-800 dark:text-slate-100 h-20 placeholder-slate-400 dark:placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutationSubmitting}
              className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutationSubmitting || !mutationForm.outletId}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/30 transition-all"
            >
              {mutationSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Mutasi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
