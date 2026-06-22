import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { getErrorMessage } from '../api/types';
import type { ApiSuccessResponse } from '../api/types';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  points: number;
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
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async (search) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ApiSuccessResponse<Customer[]>>('/api/customers', {
        params: search ? { search } : undefined,
      });
      set({ customers: response.data.data || [], loading: false });
    } catch (err: unknown) {
      console.error(err);
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createCustomer: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ApiSuccessResponse<Customer>>('/api/customers', data);
      set((state) => ({
        customers: [response.data.data, ...state.customers],
        loading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  updateCustomer: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ApiSuccessResponse<Customer>>(`/api/customers/${id}`, data);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? response.data.data : c)),
        loading: false,
      }));
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  deleteCustomer: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/api/customers/${id}`);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        loading: false,
      }));
      return { success: true };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },
}));
