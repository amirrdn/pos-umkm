import {
  Package,
  Edit,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
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

function ProductThumbnail({ product }: { product: MasterProduct }) {
  const imageUrl =
    product.images && product.images.length > 0
      ? resolveProductImageUrl(
          product.images.find((img) => img.isMain)?.url || product.images[0].url
        )
      : null;

  return (
    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
      {imageUrl ? (
        <img
          src={imageUrl}
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
  );
}

function ProductOutletStockBreakdown({
  product,
  filterOutletId,
}: {
  product: MasterProduct;
  filterOutletId: string;
}) {
  if (filterOutletId || !product.outletStocks?.length) return null;

  return (
    <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 space-y-0.5 border-t border-slate-100 dark:border-slate-800/50 pt-1.5">
      {product.outletStocks.map((os) => (
        <div key={os.outletId} className="flex justify-between gap-2">
          <span className="truncate">{os.outlet?.name || 'Cabang'}:</span>
          <span className="font-bold shrink-0">{os.stock} pcs</span>
        </div>
      ))}
    </div>
  );
}

function ProductRowActions({
  product,
  onEdit,
  onDelete,
  compact = false,
}: {
  product: MasterProduct;
  onEdit: (product: MasterProduct) => void;
  onDelete: (productId: string) => void;
  compact?: boolean;
}) {
  const btnClass = compact
    ? 'cursor-pointer p-2 min-h-9 min-w-9 flex items-center justify-center text-slate-400 dark:text-slate-500 rounded-lg transition-all'
    : 'cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 rounded-lg transition-all';

  return (
    <div className={`flex ${compact ? 'gap-1' : 'justify-center gap-2'}`}>
      <button
        type="button"
        onClick={() => onEdit(product)}
        className={`${btnClass} hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30`}
        title="Edit"
        aria-label={`Edit ${product.name}`}
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(product.id)}
        className={`${btnClass} hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
        title="Hapus"
        aria-label={`Hapus ${product.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
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
    <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 min-h-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 min-w-0">
            <FileSpreadsheet className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="truncate">
              Master Produk Aktif ({products.length})
            </span>
          </h3>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
            {canFilterByOutlet(user?.roles) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-w-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">
                  Cabang
                </span>
                <AppSelect
                  size="sm"
                  value={filterOutletId}
                  onChange={onFilterOutletChange}
                  placeholder="Semua Outlet (Total)"
                  searchable={outlets.length > 4}
                  className="w-full sm:min-w-[180px] md:min-w-[220px] min-w-0"
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
              type="button"
              onClick={onRefresh}
              className="cursor-pointer p-2 min-h-10 min-w-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all shrink-0"
              title="Muat ulang"
              aria-label="Muat ulang daftar produk"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center py-16 sm:py-20">
              <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Memuat data produk...
              </p>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Mobile & tablet — kartu */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <ProductThumbnail product={product} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {product.name}
                            </p>
                            <p className="text-[11px] font-bold text-indigo-600 uppercase truncate mt-0.5">
                              {product.sku}
                            </p>
                          </div>
                          <ProductRowActions
                            product={product}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            compact
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {product.categoryName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getProductStockBadgeClass(product.stock)}`}
                          >
                            {product.stock} pcs
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] sm:text-xs">
                          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              Harga Beli
                            </p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                              Rp {product.purchasePrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 px-2.5 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-400 dark:text-indigo-500">
                              Harga Jual
                            </p>
                            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                              Rp {product.sellingPrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        <ProductOutletStockBreakdown
                          product={product}
                          filterOutletId={filterOutletId}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop — tabel */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
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
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-indigo-600 uppercase">
                          {product.sku}
                        </td>
                        <td className="py-4 px-6 text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail product={product} />
                            <span className="font-bold">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] font-bold">
                            {product.categoryName}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          Rp {product.purchasePrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-right font-bold">
                          Rp {product.sellingPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-bold ${getProductStockBadgeClass(product.stock)}`}
                          >
                            {product.stock} pcs
                          </span>
                          <div className="max-w-[120px] mx-auto">
                            <ProductOutletStockBreakdown
                              product={product}
                              filterOutletId={filterOutletId}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ProductRowActions
                            product={product}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 sm:py-20 px-4">
              <Package className="h-12 w-12 text-slate-200 mb-3" />
              <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">
                Belum ada data produk
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs">
                Gunakan tombol &quot;Tambah Produk&quot; di atas untuk mendaftarkan barang.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
