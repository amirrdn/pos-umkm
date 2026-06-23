import { useState, useEffect, useRef, useCallback } from 'react';
import { useCustomerStore, type Customer } from '../../store/useCustomerStore';

interface UsePosCustomerOptions {
  activeOutletId: string | null;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export function usePosCustomer({ activeOutletId, showToast }: UsePosCustomerOptions) {
  const { fetchCustomers, createCustomer } = useCustomerStore();

  const [customerByOutlet, setCustomerByOutlet] = useState<{
    outletId: string | null;
    customer: Customer | null;
  }>({ outletId: activeOutletId, customer: null });

  const selectedCustomer =
    customerByOutlet.outletId === activeOutletId ? customerByOutlet.customer : null;

  const setSelectedCustomer = useCallback(
    (customer: Customer | null) => {
      setCustomerByOutlet({ outletId: activeOutletId, customer });
    },
    [activeOutletId]
  );

  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  const customerSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  useEffect(() => {
    if (!customerQuery.trim()) {
      Promise.resolve().then(() => {
        setSearchResults([]);
      });
      return;
    }

    if (customerSearchTimeoutRef.current) {
      clearTimeout(customerSearchTimeoutRef.current);
    }

    customerSearchTimeoutRef.current = setTimeout(() => {
      void (async () => {
        await fetchCustomers(customerQuery);
        setSearchResults(useCustomerStore.getState().customers);
      })();
    }, 300);

    return () => {
      if (customerSearchTimeoutRef.current) {
        clearTimeout(customerSearchTimeoutRef.current);
      }
    };
  }, [customerQuery, fetchCustomers]);

  const handleCreateCustomerSubmit = async (name: string, phone: string, email: string) => {
    if (!name.trim()) {
      showToast('error', 'Nama pelanggan wajib diisi!');
      return false;
    }
    setIsCreatingCustomer(true);
    const res = await createCustomer({
      name,
      phone: phone || null,
      email: email || null
    });
    setIsCreatingCustomer(false);

    if (res.success && res.data) {
      setSelectedCustomer(res.data);
      showToast('success', 'Pelanggan berhasil didaftarkan!');
      setShowAddCustomerModal(false);
      return true;
    } else {
      showToast('error', res.message || 'Gagal mendaftarkan pelanggan.');
      return false;
    }
  };

  return {
    customerByOutlet,
    setCustomerByOutlet,
    selectedCustomer,
    setSelectedCustomer,
    customerQuery,
    setCustomerQuery,
    searchResults,
    setSearchResults,
    showAddCustomerModal,
    setShowAddCustomerModal,
    newCustName,
    setNewCustName,
    newCustPhone,
    setNewCustPhone,
    newCustEmail,
    setNewCustEmail,
    isCreatingCustomer,
    setIsCreatingCustomer,
    handleCreateCustomerSubmit,
  };
}
