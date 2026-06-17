import { create } from 'zustand';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './useAuthStore';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  points: number;
  debtBalance: number;
  createdAt: string;
}

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: (search?: string) => Promise<void>;
  createCustomer: (data: { name: string; phone?: string | null; email?: string | null }) => Promise<{ success: boolean; data?: Customer; message?: string }>;
  updateCustomer: (id: string, data: { name?: string; phone?: string | null; email?: string | null }) => Promise<{ success: boolean; data?: Customer; message?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; message?: string }>;
  payDebt: (id: string, amount: number, paymentMethod: string, note?: string) => Promise<{ success: boolean; message?: string }>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async (search) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return;

    set({ loading: true, error: null });
    try {
      const url = new URL(`${API_BASE_URL}/api/customers`);
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal mengambil data pelanggan.');
      }

      set({ customers: resData.data || [], loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  createCustomer: async (data) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        },
        body: JSON.stringify(data)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal membuat pelanggan.');
      }

      set((state) => ({
        customers: [resData.data, ...state.customers],
        loading: false
      }));

      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  updateCustomer: async (id, data) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        },
        body: JSON.stringify(data)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal memperbarui pelanggan.');
      }

      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? resData.data : c)),
        loading: false
      }));

      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  deleteCustomer: async (id) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal menghapus pelanggan.');
      }

      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        loading: false
      }));

      return { success: true };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  payDebt: async (id, amount, paymentMethod, note) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}/pay-debt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        },
        body: JSON.stringify({ amount, paymentMethod, note })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal membayar hutang.');
      }

      const updatedCustomer = resData.data.customer;

      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, debtBalance: Number(updatedCustomer.debtBalance) } : c)),
        loading: false
      }));

      return { success: true };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  }
}));
