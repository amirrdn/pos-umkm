import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { getErrorMessage } from '../api/types';
import type { ApiSuccessResponse } from '../api/types';

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

interface OutletHierarchy {
  main: Outlet | null;
  branches: Outlet[];
}

interface OutletState {
  outlets: Outlet[];
  hierarchy: OutletHierarchy | null;
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
      const response = await apiClient.get<ApiSuccessResponse<Outlet[]>>('/api/outlets');
      set({ outlets: response.data.data || [], loading: false });
    } catch (err: unknown) {
      console.error(err);
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  fetchHierarchy: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ApiSuccessResponse<OutletHierarchy>>('/api/outlets/hierarchy');
      set({ hierarchy: response.data.data || null, loading: false });
    } catch (err: unknown) {
      console.error(err);
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createBranch: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ApiSuccessResponse<Outlet>>('/api/outlets/branches', data);
      await get().fetchOutlets();
      await get().fetchHierarchy();
      set({ loading: false });
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  updateOutlet: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ApiSuccessResponse<Outlet>>(`/api/outlets/${id}`, data);
      set((state) => ({
        outlets: state.outlets.map((o) => (o.id === id ? response.data.data : o)),
        loading: false,
      }));
      await get().fetchHierarchy();
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  deleteOutlet: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/api/outlets/${id}`);
      set((state) => ({
        outlets: state.outlets.filter((o) => o.id !== id),
        loading: false,
      }));
      await get().fetchHierarchy();
      return { success: true };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },
}));
