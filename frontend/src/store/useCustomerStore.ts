import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

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
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/customers', {
        params: search ? { search } : undefined
      });
      set({ customers: response.data.data || [], loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  createCustomer: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/api/customers', data);
      set((state) => ({
        customers: [response.data.data, ...state.customers],
        loading: false
      }));
      return { success: true, data: response.data.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  updateCustomer: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(`/api/customers/${id}`, data);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? response.data.data : c)),
        loading: false
      }));
      return { success: true, data: response.data.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  deleteCustomer: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/api/customers/${id}`);
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
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/api/customers/${id}/pay-debt`, { amount, paymentMethod, note });
      const updatedCustomer = response.data.data.customer;
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
  },
}));
