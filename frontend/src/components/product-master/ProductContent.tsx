import { ProductListPanel } from './ProductListPanel';
import type { UseProductMasterReturn } from '../../hooks/useProductMaster';

export interface ProductContentProps {
  productMaster: UseProductMasterReturn;
}

export function ProductContent({ productMaster }: ProductContentProps) {
  const {
    products,
    loading,
    filterOutletId,
    outlets,
    user,
    handleFilterOutletChange,
    fetchProducts,
    handleOpenEdit,
    handleDelete,
  } = productMaster;

  return (
    <ProductListPanel
      products={products}
      loading={loading}
      filterOutletId={filterOutletId}
      outlets={outlets}
      user={user}
      onFilterOutletChange={handleFilterOutletChange}
      onRefresh={() => fetchProducts(filterOutletId)}
      onEdit={handleOpenEdit}
      onDelete={handleDelete}
    />
  );
}
