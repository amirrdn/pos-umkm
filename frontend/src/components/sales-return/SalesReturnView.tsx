import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Plus, Search, Eye, X } from 'lucide-react';
import { AppShellHeader } from '../AppShellHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { getSalesReturnsApi, createSalesReturnApi, type SalesReturn } from '../../api/salesReturnApi';
import { getTransactionHistoryApi } from '../../api/transactionHistoryApi';
import type { TransactionRecord } from '../../types/transactionHistory';

export function SalesReturnView() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);

  const [selectedTxId, setSelectedTxId] = useState('');
  const [reason, setReason] = useState('');
  const [returnItems, setReturnItems] = useState<{ productId: string; quantity: number; refundPrice: number; maxQty: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [returnData, txData] = await Promise.all([
        getSalesReturnsApi(),
        getTransactionHistoryApi(),
      ]);
      setReturns(returnData);
      setTransactions(txData);
    } catch {
      setErrorMsg('Gagal memuat data retur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleTransactionChange = (txId: string) => {
    setSelectedTxId(txId);
    const tx = transactions.find((t) => t.id === txId);
    if (tx && tx.items) {
      setReturnItems(
        tx.items.map((it: { productId: string; priceAtTransaction: number | string; quantity: number; product?: { name: string } }) => ({
          productId: it.productId,
          quantity: 1,
          refundPrice: Number(it.priceAtTransaction),
          maxQty: it.quantity,
          name: it.product?.name || 'Produk',
        }))
      );
    } else {
      setReturnItems([]);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTxId) {
      setErrorMsg('Pilih transaksi terlebih dahulu.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Alasan pengembalian wajib diisi.');
      return;
    }

    const validItems = returnItems.filter((i) => i.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg('Pilih minimal 1 barang untuk dikembalikan.');
      return;
    }

    try {
      setSubmitting(true);
      await createSalesReturnApi({
        transactionId: selectedTxId,
        reason,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          refundPrice: i.refundPrice,
        })),
      });

      setModalOpen(false);
      setSelectedTxId('');
      setReason('');
      setReturnItems([]);
      fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses retur barang.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReturns = returns.filter(
    (r) =>
      r.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.transaction.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <AppShellHeader
        title="Retur Penjualan & Refund"
        subtitle="Pengembalian barang dari pelanggan dan pengembalian stok otomatis"
        icon={RotateCcw}
        accent="indigo"
        user={user}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no retur / invoice / alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Proses Retur Baru
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data retur...</div>
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <RotateCcw className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Belum ada transaksi retur barang</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">No. Retur</th>
                    <th className="px-6 py-3">No. Invoice Asal</th>
                    <th className="px-6 py-3">Alasan Retur</th>
                    <th className="px-6 py-3">Total Refund</th>
                    <th className="px-6 py-3">Petugas</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">{ret.returnNumber}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{ret.transaction.invoiceNumber}</td>
                      <td className="px-6 py-4 text-xs">{ret.reason}</td>
                      <td className="px-6 py-4 font-semibold text-rose-600 dark:text-rose-400">Rp {Number(ret.totalRefundAmount).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{ret.user.name}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedReturn(ret); setDetailModalOpen(true); }}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 rounded-md hover:bg-indigo-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Proses Retur Penjualan Baru</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-lg">{errorMsg}</div>}

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Transaksi Asal *</label>
                  <select
                    required
                    value={selectedTxId}
                    onChange={(e) => handleTransactionChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="">-- Pilih Nomor Invoice --</option>
                    {transactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.invoiceNumber} (Rp {Number(tx.grandTotal).toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Alasan Retur *</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    placeholder="Contoh: Barang cacat / kemasan rusak"
                  />
                </div>

                {returnItems.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Barang yang Dikembalikan</label>
                    {returnItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg">
                        <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={item.maxQty}
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...returnItems];
                              updated[idx].quantity = Number(e.target.value);
                              setReturnItems(updated);
                            }}
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded text-center"
                          />
                          <span className="text-slate-400">/ max {item.maxQty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Memproses...' : 'Proses Retur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {detailModalOpen && selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedReturn.returnNumber}</h3>
                  <p className="text-xs text-slate-500">Invoice: {selectedReturn.transaction.invoiceNumber}</p>
                </div>
                <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg">
                  <strong className="block text-slate-900 dark:text-slate-100 mb-0.5">Alasan:</strong>
                  {selectedReturn.reason}
                </p>

                <div className="text-xs space-y-1">
                  {selectedReturn.items.map((it) => (
                    <div key={it.id} className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 py-1.5">
                      <span>{it.product?.name ?? 'Produk'} x {it.quantity}</span>
                      <span className="font-medium">Rp {Number(it.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-sm pt-2 text-rose-600 dark:text-rose-400">
                  <span>Total Refund:</span>
                  <span>Rp {Number(selectedReturn.totalRefundAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
