import {
  Package, Edit, Trash2, RefreshCw, FileSpreadsheet,
} from 'lucide-react';
import { AppSelect } from '../AppSelect';
import {
  resolveProductImageUrl,
  getProductStockBadgeClass,
  canFilterByOutlet,
} from '../../utils/productMasterHelpers';
import type { MasterProduct, OutletSummary } from '../../types/productMaster';
import type { AuthUser } from '../../store/useAuthStore';

export interface ProductListPanelProps {
  products: MasterProduct[];
  loading: boolean;
  filterOutletId: string;
  outlets: OutletSummary[];
  user: AuthUser | null;
  onFilterOutletChange: (outletId: string) => void;
  onRefresh: () => void;
  onEdit: (product: MasterProduct) => void;
  onDelete: (productId: string) => void;
}

export function ProductListPanel({
  products,
  loading,
  filterOutletId,
  outlets,
  user,
  onFilterOutletChange,
  onRefresh,
  onEdit,
  onDelete,
}: ProductListPanelProps) {
  return (
    <main className="flex-1 p-6 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            Master Produk Aktif ({products.length})
          </h3>

          <div className="flex items-center gap-3">
            {canFilterByOutlet(user?.roles) && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Cabang:</span>
                <AppSelect
                  size="sm"
                  value={filterOutletId}
                  onChange={onFilterOutletChange}
                  placeholder="Semua Outlet (Total)"
                  searchable={outlets.length > 4}
                  options={[
                    { value: '', label: 'Semua Outlet (Total)' },
                    ...outlets.map((outlet) => ({
                      value: outlet.id,
                      label: outlet.name,
                      description: outlet.type === 'MAIN' ? 'Pusat' : 'Cabang',
                    })),
                  ]}
                />
              </div>
            )}

            <button
              onClick={onRefresh}
              className="cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center py-20">
              <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat data produk...</p>
            </div>
          ) : products.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-4 px-6">SKU / Kode</th>
                  <th className="py-4 px-6">Nama Produk</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6 text-right">Harga Beli</th>
                  <th className="py-4 px-6 text-right">Harga Jual</th>
                  <th className="py-4 px-6 text-center">Stok</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-indigo-600 uppercase">{product.sku}</td>
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={resolveProductImageUrl(
                                product.images.find((img) => img.isMain)?.url || product.images[0].url
                              )}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                              }}
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <span className="font-bold">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-bold">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">Rp {product.purchasePrice.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-right font-bold">Rp {product.sellingPrice.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${getProductStockBadgeClass(product.stock)}`}>
                        {product.stock} pcs
                      </span>

                      {!filterOutletId && product.outletStocks && product.outletStocks.length > 0 && (
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 space-y-0.5 max-w-[120px] mx-auto text-left border-t border-slate-100 dark:border-slate-800/50 pt-1">
                          {product.outletStocks.map((os) => (
                            <div key={os.outletId} className="flex justify-between gap-1.5">
                              <span className="truncate">{os.outlet?.name || 'Cabang'}:</span>
                              <span className="font-bold shrink-0">{os.stock} pcs</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
              <Package className="h-12 w-12 text-slate-200 mb-3" />
              <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">Belum ada data produk</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Gunakan tombol "Tambah Produk Baru" di atas untuk mendaftarkan barang.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
