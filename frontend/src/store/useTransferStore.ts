import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { getErrorMessage } from '../api/types';
import type { ApiSuccessResponse } from '../api/types';

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

interface TransferFilters {
  fromOutletId?: string;
  toOutletId?: string;
  status?: string;
}

interface TransferState {
  transfers: StockTransfer[];
  loading: boolean;
  error: string | null;
  fetchTransfers: (filters?: TransferFilters) => Promise<void>;
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
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ApiSuccessResponse<StockTransfer[]>>('/api/stock-transfers', {
        params: filters,
      });
      set({ transfers: response.data.data || [], loading: false });
    } catch (err: unknown) {
      console.error(err);
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createTransfer: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ApiSuccessResponse<StockTransfer>>('/api/stock-transfers', data);
      await get().fetchTransfers();
      set({ loading: false });
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  approveTransfer: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<ApiSuccessResponse<StockTransfer>>(
        `/api/stock-transfers/${id}/approve`
      );
      await get().fetchTransfers();
      set({ loading: false });
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  completeTransfer: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<ApiSuccessResponse<StockTransfer>>(
        `/api/stock-transfers/${id}/complete`
      );
      await get().fetchTransfers();
      set({ loading: false });
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  cancelTransfer: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<ApiSuccessResponse<StockTransfer>>(
        `/api/stock-transfers/${id}/cancel`
      );
      await get().fetchTransfers();
      set({ loading: false });
      return { success: true, data: response.data.data };
    } catch (err: unknown) {
      console.error(err);
      const message = getErrorMessage(err);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },
}));
