import { create } from 'zustand';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './useAuthStore';

export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OutletState {
  outlets: Outlet[];
  loading: boolean;
  error: string | null;
  fetchOutlets: () => Promise<void>;
  createOutlet: (data: { name: string; address?: string | null; phone?: string | null }) => Promise<{ success: boolean; data?: Outlet; message?: string }>;
  updateOutlet: (id: string, data: { name?: string; address?: string | null; phone?: string | null }) => Promise<{ success: boolean; data?: Outlet; message?: string }>;
  deleteOutlet: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export const useOutletStore = create<OutletState>((set) => ({
  outlets: [],
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

  createOutlet: async (data) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/outlets`, {
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
        throw new Error(resData.message || 'Gagal membuat outlet.');
      }

      set((state) => ({
        outlets: [resData.data, ...state.outlets],
        loading: false
      }));

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

      return { success: true };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  }
}));
