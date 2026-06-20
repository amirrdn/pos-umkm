import { Truck, X, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { AppSelect } from '../AppSelect';
import type { AppSelectOption } from '../AppSelect';
import type { Product, TransferForm } from '../../types/inventory';

export interface CreateTransferModalProps {
  transferForm: TransferForm;
  setTransferForm: React.Dispatch<React.SetStateAction<TransferForm>>;
  transferSubmitting: boolean;
  transferFormError: string | null;
  transferFromOutletOptions: AppSelectOption[];
  transferToOutletOptions: AppSelectOption[];
  sourceProductSelectOptions: AppSelectOption[];
  sourceOutletProducts: Product[];
  sourceOutletLoading: boolean;
  handleTransferSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CreateTransferModal({
  transferForm,
  setTransferForm,
  transferSubmitting,
  transferFormError,
  transferFromOutletOptions,
  transferToOutletOptions,
  sourceProductSelectOptions,
  sourceOutletProducts,
  sourceOutletLoading,
  handleTransferSubmit,
  onClose,
}: CreateTransferModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !transferSubmitting && onClose()}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Buat Pengiriman / Transfer Stok</h3>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Kirim stok antar outlet utama dan cabang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={transferSubmitting}
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleTransferSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {transferFormError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-550/10 border border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-305 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{transferFormError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outlet Asal (Pengirim)</label>
                <AppSelect
                  value={transferForm.fromOutletId}
                  onChange={(fromOutletId) => {
                    setTransferForm({
                      ...transferForm,
                      fromOutletId,
                      toOutletId: '',
                      items: [{ productId: '', quantity: 1 }],
                    });
                  }}
                  placeholder="-- Pilih Outlet Asal --"
                  searchable={transferFromOutletOptions.length > 4}
                  options={transferFromOutletOptions}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outlet Tujuan (Penerima)</label>
                <AppSelect
                  value={transferForm.toOutletId}
                  onChange={(toOutletId) => setTransferForm({ ...transferForm, toOutletId })}
                  placeholder="-- Pilih Outlet Tujuan --"
                  disabled={!transferForm.fromOutletId}
                  searchable={transferToOutletOptions.length > 4}
                  options={transferToOutletOptions}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Catatan Transfer (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Pemindahan stok sisa, Restock bulanan cabang"
                value={transferForm.note}
                onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-555 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:border-indigo-550 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Daftar Item Barang</label>
                <button
                  type="button"
                  disabled={!transferForm.fromOutletId}
                  onClick={() => {
                    setTransferForm({
                      ...transferForm,
                      items: [...transferForm.items, { productId: '', quantity: 1 }]
                    });
                  }}
                  className="cursor-pointer flex items-center gap-1 text-xs text-indigo-500 font-bold hover:text-indigo-400 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Baris
                </button>
              </div>

              {sourceOutletLoading && (
                <p className="text-xs text-slate-500 italic animate-pulse">Memuat data produk dan stok dari outlet pengirim...</p>
              )}

              {!transferForm.fromOutletId && (
                <div className="text-center p-6 bg-slate-555 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  Pilih outlet asal terlebih dahulu untuk mulai memilih produk.
                </div>
              )}

              {transferForm.fromOutletId && !sourceOutletLoading && transferForm.items.map((item, index) => {
                const selectedSourceProd = sourceOutletProducts.find(p => p.id === item.productId);
                const availableStock = selectedSourceProd ? selectedSourceProd.stock : 0;

                return (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-555 dark:bg-slate-955/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 relative group">
                    <div className="flex-1 w-full space-y-1">
                      <AppSelect
                        size="sm"
                        value={item.productId}
                        onChange={(val) => {
                          const alreadyExists = transferForm.items.some(
                            (it, i) => it.productId === val && i !== index
                          );
                          if (alreadyExists) {
                            alert('Produk ini sudah dipilih di baris lain.');
                            return;
                          }
                          const cleanItems = [...transferForm.items];
                          cleanItems[index] = { ...cleanItems[index], productId: val };
                          setTransferForm({ ...transferForm, items: cleanItems });
                        }}
                        placeholder="-- Pilih Produk --"
                        searchable
                        searchPlaceholder="Cari produk..."
                        options={sourceProductSelectOptions}
                      />
                    </div>

                    <div className="w-full sm:w-32 flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          const cleanItems = [...transferForm.items];
                          cleanItems[index] = { ...cleanItems[index], quantity: val };
                          setTransferForm({ ...transferForm, items: cleanItems });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        / max {availableStock}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const cleanItems = [...transferForm.items];
                        cleanItems.splice(index, 1);
                        setTransferForm({
                          ...transferForm,
                          items: cleanItems.length === 0 ? [{ productId: '', quantity: 1 }] : cleanItems
                        });
                      }}
                      className="cursor-pointer p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors absolute top-2 right-2 sm:static self-end sm:self-auto"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={transferSubmitting}
              className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={transferSubmitting || !transferForm.fromOutletId || !transferForm.toOutletId}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-950/30 transition-all disabled:opacity-50"
            >
              {transferSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim Transfer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
