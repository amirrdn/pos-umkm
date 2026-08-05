import {
  Tag,
  Edit,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  Package,
} from 'lucide-react';
import type { Category } from '../../api/categoryApi';
import { CategoryOverviewStats } from './CategoryOverviewStats';

export interface CategoryListPanelProps {
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  onOpenCreate: () => void;
}

function CategoryRowActions({
  category,
  onEdit,
  onDelete,
  compact = false,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  compact?: boolean;
}) {
  const btnClass = compact
    ? 'cursor-pointer p-2 min-h-9 min-w-9 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-2xs border border-slate-250 dark:border-slate-700'
    : 'cursor-pointer p-2 rounded-xl transition-all active:scale-90 shadow-2xs border border-slate-250 dark:border-slate-700';

  return (
    <div className={`flex ${compact ? 'gap-1.5' : 'justify-center gap-2'}`}>
      <button
        type="button"
        onClick={() => onEdit(category)}
        className={`${btnClass} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-800`}
        title="Edit Kategori"
        aria-label={`Edit ${category.name}`}
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(category)}
        className={`${btnClass} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-300 dark:hover:border-rose-800`}
        title="Hapus Kategori"
        aria-label={`Hapus ${category.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CategoryListPanel({
  categories,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  resetFilters,
  isFiltered,
  onOpenCreate,
}: CategoryListPanelProps) {
  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
      <CategoryOverviewStats categories={categories} />

      <div className="flex-1 min-h-[560px] lg:min-h-[640px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs hover:shadow-md dark:shadow-none flex flex-col overflow-hidden backdrop-blur-md transition-all">
        <div className="p-5 border-b border-slate-200/90 dark:border-slate-800 flex flex-col gap-4 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2 min-w-0">
              <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
              </div>
              <span className="truncate">
                Daftar Kategori Produk ({categories.length})
              </span>
            </h3>
            <button
              type="button"
              onClick={onRefresh}
              className="cursor-pointer group p-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 shadow-2xs"
              title="Muat ulang daftar"
              aria-label="Muat ulang daftar kategori"
            >
              <RefreshCw
                className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'
                  }`}
              />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-indigo-600 dark:focus-within:text-indigo-400 w-4.5 h-4.5 transition-colors" />
              <input
                type="text"
                placeholder="Cari kategori berdasarkan nama, prefix, atau slug..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full pl-10.5 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all shadow-2xs"
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 w-4 h-4 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  className="cursor-pointer appearance-none w-full sm:w-auto pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs hover:border-indigo-500"
                >
                  <option value="name_asc">Nama (A - Z)</option>
                  <option value="name_desc">Nama (Z - A)</option>
                  <option value="prefix_asc">Prefix SKU (A - Z)</option>
                  <option value="prefix_desc">Prefix SKU (Z - A)</option>
                  <option value="products_desc">Jumlah Produk Terbanyak</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 pointer-events-none" />
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="cursor-pointer px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-extrabold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  Bersihkan Filter
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
          {loading ? (
            /* Skeleton Loading State */
            <div className="h-full w-full">
              <div className="hidden lg:block animate-pulse p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                      <th className="py-4 px-6 w-[35%]">Nama Kategori</th>
                      <th className="py-4 px-6 w-[20%]">Prefix SKU</th>
                      <th className="py-4 px-6 w-[25%]">Slug (SEO)</th>
                      <th className="py-4 px-6 w-[12%] text-center">Produk Terikat</th>
                      <th className="py-4 px-6 w-[8%] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...Array(5)].map((_, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-4.5 px-6">
                          <div className="h-4.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-40" />
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 font-mono" />
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16 mx-auto" />
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-14 mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="block lg:hidden p-4 space-y-4 animate-pulse">
                {[...Array(3)].map((_, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-32" />
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                      </div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {categories.map((cat) => (
                  <article
                    key={cat.id}
                    className="p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-3 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {cat.name}
                          </p>
                          <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                            {cat.prefix}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate mt-1">
                          {cat.slug}
                        </p>
                      </div>
                      <CategoryRowActions
                        category={cat}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        compact
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-slate-400" />
                        Produk Terkait:
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-slate-200 dark:border-slate-700">
                        {cat._count?.products ?? 0} Produk
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700">
                    <tr>
                      <th className="py-4 px-6">Nama Kategori</th>
                      <th className="py-4 px-6">Prefix SKU</th>
                      <th className="py-4 px-6">Slug (SEO)</th>
                      <th className="py-4 px-6 text-center">Produk Terikat</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    {categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-bold">
                          {cat.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50">
                            {cat.prefix}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                          {cat.slug}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-slate-200 dark:border-slate-700">
                            {cat._count?.products ?? 0} Produk
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <CategoryRowActions
                            category={cat}
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
                <Tag className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm">
                {isFiltered ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori Terdaftar'}
              </h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                {isFiltered
                  ? 'Tidak ada kategori yang sesuai dengan kata kunci pencarian atau pengurutan Anda.'
                  : 'Gunakan tombol "Tambah Kategori" di header untuk membuat kategori barang baru Anda.'}
              </p>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="cursor-pointer mt-4.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Atur Ulang Filter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenCreate}
                  className="cursor-pointer mt-4.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Tambah Kategori Pertama
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
