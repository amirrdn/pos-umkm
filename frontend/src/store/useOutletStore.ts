import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  type: 'MAIN' | 'BRANCH';
  parentOutletId: string | null;
  code: string | null;
  address: string | null;
  phone: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  activeStaff?: number;
  totalStockSKUs?: number;
}

interface OutletState {
  outlets: Outlet[];
  hierarchy: { main: Outlet | null; branches: Outlet[] } | null;
  loading: boolean;
  error: string | null;
  fetchOutlets: () => Promise<void>;
  fetchHierarchy: () => Promise<void>;
  createBranch: (data: { name: string; code?: string | null; address?: string | null; phone?: string | null }) => Promise<{ success: boolean; data?: Outlet; message?: string }>;
  updateOutlet: (id: string, data: { name?: string; code?: string | null; address?: string | null; phone?: string | null; isActive?: boolean }) => Promise<{ success: boolean; data?: Outlet; message?: string }>;
  deleteOutlet: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export const useOutletStore = create<OutletState>((set, get) => ({
  outlets: [],
  hierarchy: null,
  loading: false,
  error: null,

  fetchOutlets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/outlets');
      set({ outlets: response.data.data || [], loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  fetchHierarchy: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/api/outlets/hierarchy');
      set({ hierarchy: response.data.data || null, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  createBranch: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/api/outlets/branches', data);
      await get().fetchOutlets();
      await get().fetchHierarchy();
      return { success: true, data: response.data.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  updateOutlet: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(`/api/outlets/${id}`, data);
      set((state) => ({
        outlets: state.outlets.map((o) => (o.id === id ? response.data.data : o)),
        loading: false
      }));
      await get().fetchHierarchy();
      return { success: true, data: response.data.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  deleteOutlet: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/api/outlets/${id}`);
      set((state) => ({
        outlets: state.outlets.filter((o) => o.id !== id),
        loading: false
      }));
      await get().fetchHierarchy();
      return { success: true };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },
}));
