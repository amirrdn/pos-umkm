import {
  Package,
  Edit,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react';
import { ProductOverviewStats } from './ProductOverviewStats';
import {
  resolveProductImageUrl,
  getProductStockBadgeClass,
  canFilterByOutlet,
} from '../../utils/productMasterHelpers';
import type { MasterProduct, OutletSummary, ProductCategory } from '../../types/productMaster';
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
  summaryStats: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalCategoriesCount: number;
  };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  categories: ProductCategory[];
  resetFilters: () => void;
  isFiltered: boolean;
}

function ProductThumbnail({ product }: { product: MasterProduct }) {
  const imageUrl =
    product.images && product.images.length > 0
      ? resolveProductImageUrl(
          product.images.find((img) => img.isMain)?.url || product.images[0].url
        )
      : null;

  return (
    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center group relative">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-108"
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
    ? 'cursor-pointer p-2 min-h-9 min-w-9 flex items-center justify-center text-slate-400 dark:text-slate-500 rounded-lg transition-all active:scale-90'
    : 'cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 rounded-lg transition-all active:scale-90';

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
  searchQuery,
  onSearchQueryChange,
  selectedCategoryId,
  onCategoryChange,
  categories,
  resetFilters,
  isFiltered,
  summaryStats,
}: ProductListPanelProps) {
  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto lg:overflow-hidden flex flex-col gap-4 bg-slate-50 dark:bg-slate-950 min-h-0">
      {/* Panel Statistik Ringkasan */}
      <ProductOverviewStats summaryStats={summaryStats} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Toolbar & Filter Panel */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-4 shrink-0 bg-white dark:bg-slate-900">
          {/* Baris Atas: Judul dan Refresh */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
              <span className="truncate">
                Master Produk Aktif ({products.length})
              </span>
            </h3>
            <button
              type="button"
              onClick={onRefresh}
              className="cursor-pointer p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-95 transition-all shrink-0 shadow-sm"
              title="Muat ulang daftar"
              aria-label="Muat ulang daftar produk"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Baris Bawah: Input Cari & Multi-Dropdown Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Input Pencarian */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-500 w-4 h-4 transition-colors" />
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Kelompok Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Kategori */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="cursor-pointer w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Cabang / Outlet */}
              {canFilterByOutlet(user?.roles) && (
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={filterOutletId}
                    onChange={(e) => onFilterOutletChange(e.target.value)}
                    className="cursor-pointer w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Semua Outlet (Total)</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name} {outlet.type === 'MAIN' ? '(Pusat)' : '(Cabang)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel List / Table Konten */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            /* Skeleton Loading State (Mengurangi perceived latency) */
            <div className="h-full w-full">
              {/* Skeleton Desktop */}
              <div className="hidden lg:block animate-pulse p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                      <th className="py-4 px-6 w-[12%]">SKU / Kode</th>
                      <th className="py-4 px-6 w-[35%]">Nama Produk</th>
                      <th className="py-4 px-6 w-[15%]">Kategori</th>
                      <th className="py-4 px-6 w-[12%] text-right">Harga Beli</th>
                      <th className="py-4 px-6 w-[12%] text-right">Harga Jual</th>
                      <th className="py-4 px-6 w-[8%] text-center">Stok</th>
                      <th className="py-4 px-6 w-[6%] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...Array(5)].map((_, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-4.5 px-6"><div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" /></td>
                        <td className="py-4.5 px-6 flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-44" />
                        </td>
                        <td className="py-4.5 px-6"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" /></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" /></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" /></td>
                        <td className="py-4.5 px-6"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-14 mx-auto" /></td>
                        <td className="py-4.5 px-6"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-14 mx-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Skeleton Mobile */}
              <div className="block lg:hidden p-4 space-y-4 animate-pulse">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-3">
                    <div className="flex gap-3">
                      <div className="h-11 w-11 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32" />
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                      </div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-12" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-14" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Tampilan Mobile & Tablet — Kartu Stacked */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-3 relative"
                  >
                    <div className="flex items-start gap-3">
                      <ProductThumbnail product={product} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {product.name}
                            </p>
                            <p className="text-[11px] font-bold text-indigo-650 dark:text-indigo-400 uppercase truncate mt-0.5 font-mono">
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
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            {product.categoryName}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-current shadow-sm ${getProductStockBadgeClass(product.stock)}`}
                          >
                            Stok: {product.stock} pcs
                          </span>
                        </div>

                        {/* Rincian Harga */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] sm:text-xs">
                          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2 border border-slate-100 dark:border-slate-800/50">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              Harga Beli
                            </p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                              Rp {product.purchasePrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 px-2.5 py-2 border border-indigo-100/50 dark:border-indigo-900/30">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-400 dark:text-indigo-500">
                              Harga Jual
                            </p>
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                              Rp {product.sellingPrice.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        {/* Detail Limit Stok Multi-Cabang */}
                        <ProductOutletStockBreakdown
                          product={product}
                          filterOutletId={filterOutletId}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tampilan Desktop — Tabel High-Density */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="py-4 px-6 font-bold text-indigo-650 dark:text-indigo-400 uppercase font-mono tracking-wider">
                          {product.sku}
                        </td>
                        <td className="py-4 px-6 text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail product={product} />
                            <span className="font-extrabold">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            {product.categoryName}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-slate-600 dark:text-slate-400">
                          Rp {product.purchasePrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-900 dark:text-slate-100">
                          Rp {product.sellingPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border border-current shadow-sm ${getProductStockBadgeClass(product.stock)}`}
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
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
              <div className="p-4.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-750 mb-4 text-slate-400">
                <Package className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">
                {isFiltered ? 'Katalog Tidak Ditemukan' : 'Belum Ada Data Produk'}
              </h4>
              <p className="text-slate-450 dark:text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                {isFiltered
                  ? 'Tidak ada produk yang cocok dengan pencarian atau filter kategori Anda.'
                  : 'Gunakan tombol "Tambah Produk" di kanan atas header untuk mendaftarkan barang baru Anda.'}
              </p>
              {isFiltered && resetFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="cursor-pointer mt-4.5 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Atur Ulang Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
