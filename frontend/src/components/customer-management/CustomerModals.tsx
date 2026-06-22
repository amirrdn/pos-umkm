import { CustomerToast } from './CustomerToast';
import { CustomerFormModal } from './CustomerFormModal';
import type { UseCustomerManagementReturn } from '../../hooks/useCustomerManagement';

export interface CustomerModalsProps {
  customerManagement: UseCustomerManagementReturn;
}

export function CustomerModals({ customerManagement }: CustomerModalsProps) {
  const { notification } = customerManagement;

  return (
    <>
      {notification && <CustomerToast notification={notification} />}
      <CustomerFormModal customerManagement={customerManagement} />
    </>
  );
}
