import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCustomerStore, type Customer } from '../store/useCustomerStore';
import type {
  CustomerModalMode,
  CustomerNotification,
} from '../types/customerManagement';

export function useCustomerManagement() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const {
    customers,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    loading,
    error,
  } = useCustomerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CustomerModalMode>('create');
  const [notification, setNotification] = useState<CustomerNotification | null>(null);

  const [currentId, setCurrentId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const showToast = (type: CustomerNotification['type'], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchCustomers('');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId('');
    setName('');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setModalMode('edit');
    setCurrentId(cust.id);
    setName(cust.name);
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nama pelanggan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      phone: phone.trim() ? phone : null,
      email: email.trim() ? email : null,
    };

    try {
      if (modalMode === 'create') {
        const res = await createCustomer(payload);
        if (res.success) {
          showToast('success', 'Pelanggan baru berhasil ditambahkan!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal menambahkan pelanggan.');
        }
      } else {
        const res = await updateCustomer(currentId, payload);
        if (res.success) {
          showToast('success', 'Data pelanggan berhasil diperbarui!');
          setIsModalOpen(false);
        } else {
          showToast('error', res.message || 'Gagal memperbarui pelanggan.');
        }
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${customerName}"? Data riwayat transaksi mereka akan dilepas tautannya.`)) {
      return;
    }

    try {
      const res = await deleteCustomer(id);
      if (res.success) {
        showToast('success', 'Pelanggan berhasil dihapus.');
      } else {
        showToast('error', res.message || 'Gagal menghapus pelanggan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem saat menghapus.');
    }
  };

  return {
    user,
    handleLogout,
    customers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    fetchCustomers,
    handleSearchSubmit,
    handleClearSearch,
    openCreateModal,
    openEditModal,
    handleDelete,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    notification,
    setNotification,
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    isSubmitting,
    handleSubmit,
  };
}

export type UseCustomerManagementReturn = ReturnType<typeof useCustomerManagement>;
