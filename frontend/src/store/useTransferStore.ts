import { create } from 'zustand';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './useAuthStore';

export interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface StockTransfer {
  id: string;
  tenantId: string;
  fromOutletId: string;
  toOutletId: string;
  requestedById: string;
  approvedById: string | null;
  status: 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferItem[];
  fromOutlet: { id: string; name: string; type: 'MAIN' | 'BRANCH' };
  toOutlet: { id: string; name: string; type: 'MAIN' | 'BRANCH' };
  requestedBy: { id: string; name: string; email: string };
  approvedBy: { id: string; name: string; email: string } | null;
}

interface TransferState {
  transfers: StockTransfer[];
  loading: boolean;
  error: string | null;
  fetchTransfers: (filters?: { fromOutletId?: string; toOutletId?: string; status?: string }) => Promise<void>;
  createTransfer: (data: {
    fromOutletId: string;
    toOutletId: string;
    note?: string;
    items: { productId: string; quantity: number }[];
  }) => Promise<{ success: boolean; data?: StockTransfer; message?: string }>;
  approveTransfer: (id: string) => Promise<{ success: boolean; data?: StockTransfer; message?: string }>;
  completeTransfer: (id: string) => Promise<{ success: boolean; data?: StockTransfer; message?: string }>;
  cancelTransfer: (id: string) => Promise<{ success: boolean; data?: StockTransfer; message?: string }>;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  loading: false,
  error: null,

  fetchTransfers: async (filters = {}) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return;

    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (filters.fromOutletId) queryParams.append('fromOutletId', filters.fromOutletId);
      if (filters.toOutletId) queryParams.append('toOutletId', filters.toOutletId);
      if (filters.status) queryParams.append('status', filters.status);

      const response = await fetch(`${API_BASE_URL}/api/stock-transfers?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal mengambil data transfer stok.');
      }

      set({ transfers: resData.data || [], loading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
    }
  },

  createTransfer: async (data) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock-transfers`, {
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
        throw new Error(resData.message || 'Gagal membuat transfer stok.');
      }

      await get().fetchTransfers();
      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  approveTransfer: async (id) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock-transfers/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal menyetujui transfer stok.');
      }

      await get().fetchTransfers();
      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  completeTransfer: async (id) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock-transfers/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal menyelesaikan transfer stok.');
      }

      await get().fetchTransfers();
      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  },

  cancelTransfer: async (id) => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user) return { success: false, message: 'Tidak diotorisasi' };

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock-transfers/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': user.tenantId
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Gagal membatalkan transfer stok.');
      }

      await get().fetchTransfers();
      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error(err);
      set({ error: err.message || 'Terjadi kesalahan.', loading: false });
      return { success: false, message: err.message || 'Terjadi kesalahan.' };
    }
  }
}));
