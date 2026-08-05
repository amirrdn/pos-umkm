import { useState, useEffect } from 'react';
import { Package, ArrowUpDown, History, Search, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { Product } from '../../types/inventory';
import { InventoryOverviewStats } from './InventoryOverviewStats';

export interface InventoryOverviewPanelProps {
  products: Product[];
  loading: boolean;
  canMutate: boolean | undefined;
  isBelowMinStock: (prod: Product) => boolean;
  onOpenLedger: (product: Product) => void;
  onOpenMutation: (product: Product) => void;

  // UI/UX filter & stats props
  summaryStats: {
    totalItems: number;
    criticalItems: number;
    emptyItems: number;
    totalAssetValue: number;
  };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedCategoryName: string;
  onCategoryChange: (categoryName: string) => void;
  categories: string[];
  selectedStockFilter: 'all' | 'critical' | 'empty';
  onStockFilterChange: (filter: 'all' | 'critical' | 'empty') => void;
  resetFilters: () => void;
  isFiltered: boolean;
}

export function InventoryOverviewPanel({
  products,
  loading,
  canMutate,
  isBelowMinStock,
  onOpenLedger,
  onOpenMutation,
  summaryStats,
  searchQuery,
  onSearchQueryChange,
  selectedCategoryName,
  onCategoryChange,
  categories,
  selectedStockFilter,
  onStockFilterChange,
  resetFilters,
  isFiltered,
}: InventoryOverviewPanelProps) {
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 jika daftar produk, filter kategori, atau filter stok berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, selectedCategoryName, selectedStockFilter]);

  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Panel Ringkasan Statistik */}
      <InventoryOverviewStats summaryStats={summaryStats} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-md dark:shadow-none flex flex-col overflow-hidden backdrop-blur-md transition-all">
        {/* Toolbar & Filter Panel */}
        <div className="p-5 border-b border-slate-200/90 dark:border-slate-800 flex flex-col gap-4 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
            {/* Input Pencarian */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-emerald-500 w-4.5 h-4.5 transition-colors" />
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full pl-10.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-400 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Kelompok Filter Dropdown & Status */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown Kategori */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedCategoryName}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="cursor-pointer appearance-none w-full sm:w-auto pl-4 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-2xs hover:border-emerald-500"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
              </div>

              {/* Status Stok Button Group */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'critical', label: 'Kritis' },
                  { id: 'empty', label: 'Habis' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onStockFilterChange(tab.id as 'all' | 'critical' | 'empty')}
                    className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      selectedStockFilter === tab.id
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/50 dark:border-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel Konten - List / Table */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            /* Skeleton Loading State */
            <div className="h-full w-full">
              {/* Skeleton Desktop */}
              <div className="hidden md:block animate-pulse p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-6 w-[35%]">Nama Produk / SKU</th>
                      <th className="py-4 px-6 w-[20%]">Kategori</th>
                      <th className="py-4 px-6 w-[15%] text-right">Harga Beli</th>
                      <th className="py-4 px-6 w-[15%] text-right">Harga Jual</th>
                      <th className="py-4 px-6 w-[10%] text-center">Stok</th>
                      <th className="py-4 px-6 w-[5%] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {[...Array(5)].map((_, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-4.5 px-6">
                          <div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-44 mb-1.5" />
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
                        </td>
                        <td className="py-4.5 px-6"><div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" /></td>
                        <td className="py-4.5 px-6"><div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" /></td>
                        <td className="py-4.5 px-6"><div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" /></td>
                        <td className="py-4.5 px-6"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-14 mx-auto" /></td>
                        <td className="py-4.5 px-6"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Skeleton Mobile */}
              <div className="block md:hidden p-4 space-y-4 animate-pulse">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="p-4.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="space-y-2">
                      <div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-40" />
                      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-14" />
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" />
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Tampilan Mobile — Kartu Stacked */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProducts.map((prod) => {
                  const belowMin = isBelowMinStock(prod);
                  const stockStatus = belowMin
                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                    : prod.stock <= 5
                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
                    : prod.stock <= 15
                    ? 'text-amber-500 bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20'
                    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30';

                  return (
                    <article
                      key={prod.id}
                      className="p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-3 relative"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {prod.name}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider mt-0.5">
                              {prod.sku}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${stockStatus} shrink-0 shadow-2xs`}>
                            {prod.stock} unit
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            {prod.category?.name || 'Umum'}
                          </span>
                          {prod.minStock && prod.minStock > 0 && (
                            <span className="bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-rose-100/50 dark:border-rose-950/20">
                              Min: {prod.minStock} unit
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Harga Beli & Jual */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Harga Beli</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            Rp {Number(prod.purchasePrice).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 px-3 py-2 border border-emerald-200/50 dark:border-emerald-900/30">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Harga Jual</span>
                          <p className="font-black text-slate-900 dark:text-slate-100 mt-0.5">
                            Rp {Number(prod.sellingPrice).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Tombol Aksi Mobile */}
                      <div className="flex items-center gap-2 mt-1 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onOpenLedger(prod)}
                          className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-2xs"
                        >
                          <History className="w-3.5 h-3.5 text-slate-500" />
                          Kartu Stok
                        </button>
                        {canMutate && (
                          <button
                            type="button"
                            onClick={() => onOpenMutation(prod)}
                            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Mutasi Stok
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Tampilan Desktop — Tabel High-Density */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700">
                    <tr>
                      <th className="py-4 px-6">Nama Produk / SKU</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6 text-right">Harga Beli (HPP)</th>
                      <th className="py-4 px-6 text-right">Harga Jual</th>
                      <th className="py-4 px-6 text-center">Stok Saat Ini</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    {paginatedProducts.map((prod) => {
                      const belowMin = isBelowMinStock(prod);
                      const stockStatus = belowMin
                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                        : prod.stock <= 5
                        ? 'text-rose-500 bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-950/20'
                        : prod.stock <= 15
                        ? 'text-amber-500 bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20'
                        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30';

                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800"
                        >
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{prod.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider block mt-0.5">{prod.sku}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                              {prod.category?.name || 'Umum'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-slate-600 dark:text-slate-400 font-mono">
                            Rp {Number(prod.purchasePrice).toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-right font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                            Rp {Number(prod.sellingPrice).toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-2xs ${stockStatus}`}>
                              {prod.stock} unit
                            </span>
                            {prod.minStock && prod.minStock > 0 ? (
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                                Min: {prod.minStock} unit
                              </div>
                            ) : null}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenLedger(prod)}
                                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-150 active:scale-95 shadow-2xs"
                                title="Riwayat Kartu Stok"
                              >
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                Kartu Stok
                              </button>

                              {canMutate && (
                                <button
                                  type="button"
                                  onClick={() => onOpenMutation(prod)}
                                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-all duration-150 active:scale-95"
                                  title="Mutasi Stok Manual"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                  Mutasi
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Baris Footer Pagination */}
              <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {/* Info Range Baris */}
                <div className="flex items-center gap-3">
                  <span>
                    Menampilkan <strong className="text-slate-900 dark:text-slate-100">{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
                    <strong className="text-slate-900 dark:text-slate-100">{endIndex}</strong> dari{' '}
                    <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> Stok Produk
                  </span>

                  {/* Selector Baris per Halaman */}
                  <div className="relative inline-block">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="cursor-pointer appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-1 pl-2.5 pr-7 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value={10}>10 / hal</option>
                      <option value={25}>25 / hal</option>
                      <option value={50}>50 / hal</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Tombol Navigasi Halaman */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          pageNum === currentPage
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Halaman Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
              <div className="p-4.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 mb-4 text-slate-400">
                <Package className="h-8 w-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                {isFiltered ? 'Stok Produk Tidak Ditemukan' : 'Belum Ada Data Inventaris'}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
                {isFiltered
                  ? 'Tidak ada produk yang cocok dengan kata kunci, kategori, atau status filter Anda.'
                  : 'Stok inventaris Anda akan muncul otomatis di sini ketika Anda mendaftarkan produk di Master Produk.'}
              </p>
              {isFiltered && resetFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="cursor-pointer mt-4.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  Atur Ulang Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
