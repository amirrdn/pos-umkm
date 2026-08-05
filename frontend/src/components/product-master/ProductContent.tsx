import { ProductListPanel } from './ProductListPanel';
import type { UseProductMasterReturn } from '../../hooks/useProductMaster';

export interface ProductContentProps {
  productMaster: UseProductMasterReturn;
}

export function ProductContent({ productMaster }: ProductContentProps) {
  const {
    filteredProducts,
    loading,
    filterOutletId,
    outlets,
    user,
    handleFilterOutletChange,
    fetchProducts,
    handleOpenEdit,
    handleDelete,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    categories,
    resetFilters,
    summaryStats,
  } = productMaster;

  const isFiltered = searchQuery !== '' || selectedCategoryId !== '' || filterOutletId !== '';

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 min-h-0">
      <ProductListPanel
        products={filteredProducts}
        loading={loading}
        filterOutletId={filterOutletId}
        outlets={outlets}
        user={user}
        onFilterOutletChange={handleFilterOutletChange}
        onRefresh={() => fetchProducts(filterOutletId)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        summaryStats={summaryStats}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        categories={categories}
        resetFilters={resetFilters}
        isFiltered={isFiltered}
      />
    </main>
  );
}
