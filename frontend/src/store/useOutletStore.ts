import { create } from 'zustand';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './useAuthStore';

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
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal mengambil data outlet.');
      }

      set({ outlets: resData.data || [], loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  fetchHierarchy: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets/hierarchy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal mengambil data hierarki outlet.');
      }

      set({ hierarchy: resData.data || null, loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  createBranch: async (data) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets/branches`, {
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
        throw new Error(resData.message || 'Gagal membuat cabang baru.');
      }

      // Refresh outlets and hierarchy
      await get().fetchOutlets();
      await get().fetchHierarchy();

      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  updateOutlet: async (id, data) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets/${id}`, {
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
        throw new Error(resData.message || 'Gagal memperbarui outlet.');
      }

      set((state) => ({
        outlets: state.outlets.map((o) => (o.id === id ? resData.data : o)),
        loading: false
      }));

      // Refresh hierarchy
      await get().fetchHierarchy();

      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  deleteOutlet: async (id) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal menghapus outlet.');
      }

      set((state) => ({
        outlets: state.outlets.filter((o) => o.id !== id),
        loading: false
      }));

      // Refresh hierarchy
      await get().fetchHierarchy();

      return { success: true };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  }
}));
