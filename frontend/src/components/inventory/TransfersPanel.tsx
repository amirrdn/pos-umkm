import {
  Loader2, ClipboardList, Plus, Check, Ban, Inbox, Truck, FileText,
} from 'lucide-react';
import { getTransferStatusBadgeClass } from '../../utils/inventoryHelpers';
import { getAssignedOutletIds } from '../../utils/outletAccess';
import type { AuthUser } from '../../store/useAuthStore';
import type { StockTransfer } from '../../store/useTransferStore';
import type { ConfirmModalState, TransferForm } from '../../types/inventory';

export interface TransfersPanelProps {
  transfers: StockTransfer[];
  transfersLoading: boolean;
  currentUser: AuthUser | null;
  setTransferForm: React.Dispatch<React.SetStateAction<TransferForm>>;
  setTransferFormError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsTransferModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  approveTransfer: (id: string) => Promise<{ success: boolean; message?: string }>;
  completeTransfer: (id: string) => Promise<{ success: boolean; message?: string }>;
  cancelTransfer: (id: string) => Promise<{ success: boolean; message?: string }>;
  showSuccess: (msg: string) => void;
  fetchInventory: () => void;
  refreshDraftCount: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function TransfersPanel({
  transfers,
  transfersLoading,
  currentUser,
  setTransferForm,
  setTransferFormError,
  setIsTransferModalOpen,
  setConfirmModal,
  approveTransfer,
  completeTransfer,
  cancelTransfer,
  showSuccess,
  fetchInventory,
  refreshDraftCount,
  setError,
}: TransfersPanelProps) {
  const openCreateTransferModal = () => {
    setTransferForm({
      fromOutletId: '',
      toOutletId: '',
      note: '',
      items: [{ productId: '', quantity: 1 }],
    });
    setTransferFormError(null);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Riwayat & Pengiriman Transfer Stok</h3>
          <p className="text-xs text-slate-500 mt-1">Kelola pergerakan stok antar outlet utama dan cabang secara terpusat.</p>
        </div>
        <button
          onClick={openCreateTransferModal}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Transfer Stok
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
        {transfersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Memuat riwayat transfer stok...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <ClipboardList className="w-16 h-16 text-slate-700" />
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum Ada Transfer Stok</h3>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-md">Tidak ada data transfer stok yang tercatat dalam sistem.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">ID / Tanggal</th>
                  <th className="px-6 py-4">Rute Transfer</th>
                  <th className="px-6 py-4">Item & Detail</th>
                  <th className="px-6 py-4">Pengaju / Approval</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {transfers.map((tf) => {
                  const statusColors = getTransferStatusBadgeClass(tf.status);

                  const userAssignedOutletIds = currentUser
                    ? [...getAssignedOutletIds(currentUser)]
                    : [];
                  const isUserOwnerOrManager = currentUser?.roles.some(r => ['Owner', 'Manager', 'Admin'].includes(r));

                  const canUserApprove = isUserOwnerOrManager && tf.status === 'DRAFT';
                  const canUserCancel = (isUserOwnerOrManager && (tf.status === 'DRAFT' || tf.status === 'IN_TRANSIT')) || (tf.status === 'DRAFT' && tf.requestedById === currentUser?.id);
                  const canUserReceive = (isUserOwnerOrManager || userAssignedOutletIds.includes(tf.toOutletId)) && tf.status === 'IN_TRANSIT';

                  return (
                    <tr key={tf.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">#{tf.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{new Date(tf.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span className="text-xs text-slate-500">Asal:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{tf.fromOutlet.name}</span>
                            <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold">{tf.fromOutlet.type}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450"></span>
                            <span className="text-xs text-slate-500">Ke:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{tf.toOutlet.name}</span>
                            <span className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-bold">{tf.toOutlet.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="max-w-[240px] divide-y divide-slate-100 dark:divide-slate-800/40">
                            {tf.items.map((item) => (
                              <div key={item.id} className="py-1 flex justify-between text-xs">
                                <span className="text-slate-700 dark:text-slate-300 truncate pr-2 max-w-[160px]" title={item.product?.name}>
                                  {item.product?.name}
                                </span>
                                <span className="font-bold font-mono text-indigo-500">{item.quantity} unit</span>
                              </div>
                            ))}
                          </div>
                          {tf.note && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                              "{tf.note}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <p>Diajukan: <span className="font-semibold text-slate-800 dark:text-slate-200">{tf.requestedBy?.name || 'Staf'}</span></p>
                          {tf.approvedBy && (
                            <p>Disetujui: <span className="font-semibold text-slate-800 dark:text-slate-200">{tf.approvedBy.name}</span></p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors}`}>
                          {tf.status === 'DRAFT' && <FileText className="w-3 h-3" />}
                          {tf.status === 'IN_TRANSIT' && <Truck className="w-3 h-3 animate-pulse" />}
                          {tf.status === 'COMPLETED' && <Check className="w-3 h-3" />}
                          {tf.status === 'CANCELLED' && <Ban className="w-3 h-3" />}
                          {tf.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canUserApprove && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Setujui Transfer Stok',
                                  message: 'Setujui transfer ini? Tindakan ini akan langsung memotong stok di outlet asal.',
                                  type: 'warning',
                                  confirmText: 'Setujui',
                                  cancelText: 'Batal',
                                  onConfirm: async () => {
                                    const res = await approveTransfer(tf.id);
                                    if (res.success) {
                                      showSuccess('Transfer stok disetujui, barang dalam perjalanan.');
                                      fetchInventory();
                                      void refreshDraftCount();
                                    } else {
                                      setError(res.message || 'Gagal menyetujui transfer stok.');
                                    }
                                  },
                                });
                              }}
                              className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-emerald-605 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all shadow active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          {canUserReceive && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Konfirmasi Penerimaan Barang',
                                  message: 'Konfirmasi penerimaan barang untuk transfer ini? Stok outlet tujuan akan bertambah.',
                                  type: 'success',
                                  confirmText: 'Terima Barang',
                                  cancelText: 'Batal',
                                  onConfirm: async () => {
                                    const res = await completeTransfer(tf.id);
                                    if (res.success) {
                                      showSuccess('Transfer stok berhasil diselesaikan, barang diterima.');
                                      fetchInventory();
                                      void refreshDraftCount();
                                    } else {
                                      setError(res.message || 'Gagal menyelesaikan transfer stok.');
                                    }
                                  },
                                });
                              }}
                              className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow active:scale-95"
                            >
                              <Inbox className="w-3.5 h-3.5" />
                              Terima Barang
                            </button>
                          )}
                          {canUserCancel && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Batalkan Transfer Stok',
                                  message: 'Apakah Anda yakin ingin membatalkan transfer stok ini?',
                                  type: 'danger',
                                  confirmText: 'Batalkan Transfer',
                                  cancelText: 'Batal',
                                  onConfirm: async () => {
                                    const res = await cancelTransfer(tf.id);
                                    if (res.success) {
                                      showSuccess('Transfer stok berhasil dibatalkan.');
                                      fetchInventory();
                                      void refreshDraftCount();
                                    } else {
                                      setError(res.message || 'Gagal membatalkan transfer stok.');
                                    }
                                  },
                                });
                              }}
                              className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold rounded-lg border border-rose-500/20 transition-all active:scale-95"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Batal
                            </button>
                          )}
                          {!canUserApprove && !canUserReceive && !canUserCancel && (
                            <span className="text-xs text-slate-500 italic">Tidak ada aksi</span>
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
    </div>
  );
}
