import { ProductToast } from './ProductToast';
import { ProductFormModal } from './ProductFormModal';
import type { UseProductMasterReturn } from '../../hooks/useProductMaster';

export interface ProductModalsProps {
  productMaster: UseProductMasterReturn;
}

export function ProductModals({ productMaster }: ProductModalsProps) {
  const { notification, setNotification } = productMaster;

  return (
    <>
      {notification && (
        <ProductToast
          notification={notification}
          onDismiss={() => setNotification(null)}
        />
      )}
      <ProductFormModal productMaster={productMaster} />
    </>
  );
}
