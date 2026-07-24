import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, CheckCircle2, XCircle, Eye, X } from 'lucide-react';
import { AppShellHeader } from '../AppShellHeader';
import { useAuthStore } from '../../store/useAuthStore';
import { getSuppliersApi, type Supplier } from '../../api/supplierApi';
import { getProductsApi } from '../../api/productMasterApi';
import type { MasterProduct } from '../../types/productMaster';
import {
  getPurchaseOrdersApi,
  createPurchaseOrderApi,
  receivePurchaseOrderApi,
  cancelPurchaseOrderApi,
  type PurchaseOrder,
} from '../../api/poApi';

export function PurchaseOrderView() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; costPrice: number }[]>([
    { productId: '', quantity: 1, costPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [poData, supData, prodData] = await Promise.all([
        getPurchaseOrdersApi(),
        getSuppliersApi(),
        getProductsApi(),
      ]);
      setOrders(poData);
      setSuppliers(supData);
      setProducts(prodData);
    } catch {
      setErrorMsg('Gagal memuat data kulakan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleAddItemRow = () => {
    setPoItems([...poItems, { productId: '', quantity: 1, costPrice: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...poItems];
    updated[index].productId = productId;
    if (prod) {
      updated[index].costPrice = Number(prod.purchasePrice);
    }
    setPoItems(updated);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSupplierId) {
      setErrorMsg('Pilih supplier terlebih dahulu.');
      return;
    }

    const validItems = poItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg('Tambahkan minimal 1 item produk.');
      return;
    }

    try {
      setSubmitting(true);
      await createPurchaseOrderApi({
        supplierId: selectedSupplierId,
        items: validItems,
      });
      setCreateModalOpen(false);
      setPoItems([{ productId: '', quantity: 1, costPrice: 0 }]);
      setSelectedSupplierId('');
      fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat Purchase Order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivePO = async (id: string) => {
    if (!window.confirm('Proses penerimaan barang ini akan menambah stok fisik dan mengupdate HPP. Lanjutkan?')) return;
    try {
      await receivePurchaseOrderApi(id);
      alert('Stok barang berhasil ditambahkan!');
      fetchData();
      setDetailModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses penerimaan barang.');
    }
  };

  const handleCancelPO = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan PO ini?')) return;
    try {
      await cancelPurchaseOrderApi(id);
      fetchData();
      setDetailModalOpen(false);
    } catch {
      alert('Gagal membatalkan PO.');
    }
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full dark:bg-emerald-950/60 dark:text-emerald-300">Selesai / Diterima</span>;
      case 'ORDERED':
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full dark:bg-amber-950/60 dark:text-amber-300">Menunggu Diterima</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-100 rounded-full dark:bg-rose-950/60 dark:text-rose-300">Dibatalkan</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <AppShellHeader
        title="Kulakan & Purchase Order"
        subtitle="Pencatatan pembelian barang dari pemasok & penambahan stok otomatis"
        icon={ShoppingCart}
        accent="indigo"
        user={user}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Riwayat Purchase Order</h2>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Buat PO / Kulakan
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat riwayat PO...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Belum ada riwayat kulakan</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">No. PO</th>
                    <th className="px-6 py-3">Supplier</th>
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Total Pembelian</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">{po.poNumber}</td>
                      <td className="px-6 py-4 font-medium">{po.supplier.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(po.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">Rp {Number(po.totalAmount).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedPO(po); setDetailModalOpen(true); }}
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

        {/* Modal Create PO */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Buat Purchase Order / Kulakan Baru</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-lg">{errorMsg}</div>}

              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Daftar Barang Kulakan</label>
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">-- Pilih Produk --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-20 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />

                      <input
                        type="number"
                        min="0"
                        placeholder="Harga Beli (Rp)"
                        value={item.costPrice}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].costPrice = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-32 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />

                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Baris
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan PO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail PO */}
        {detailModalOpen && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{selectedPO.poNumber}</h3>
                  <p className="text-xs text-slate-500">Supplier: {selectedPO.supplier.name}</p>
                </div>
                <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-xs space-y-1">
                  {selectedPO.items.map((it) => (
                    <div key={it.id} className="flex justify-between border-b border-slate-100 dark:border-slate-700/50 py-1.5">
                      <span>{it.product?.name ?? 'Produk'} x {it.quantity}</span>
                      <span className="font-medium">Rp {Number(it.subTotal).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-sm pt-2">
                  <span>Total Tagihan:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Rp {Number(selectedPO.totalAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {selectedPO.status !== 'RECEIVED' && selectedPO.status !== 'CANCELLED' && (
                  <>
                    <button
                      onClick={() => handleCancelPO(selectedPO.id)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg"
                    >
                      <XCircle className="w-3.5 h-3.5 inline mr-1" />
                      Batalkan PO
                    </button>
                    <button
                      onClick={() => handleReceivePO(selectedPO.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                      Terima Barang (Tambah Stok)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
