import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface ActiveShift {
  id: string;
  tenantId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  cashStart: number;
  cashExpected: number;
  cashActual: number | null;
  difference: number | null;
  status: 'OPEN' | 'CLOSED';
  totalCashSales: number;
  totalTransactions: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ShiftStore {
  activeShift: ActiveShift | null;
  isLoading: boolean;
  hasCheckedActiveShift: boolean;
  error: string | null;
  fetchActiveShift: () => Promise<void>;
  openShift: (cashStart: number) => Promise<ActiveShift>;
  closeShift: (shiftId: string, cashActual: number) => Promise<ActiveShift>;
  clearShift: () => void;
}

export const useShiftStore = create<ShiftStore>((set) => ({
  activeShift: null,
  isLoading: false,
  hasCheckedActiveShift: false,
  error: null,

  fetchActiveShift: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<{ data: ActiveShift | null }>('/api/shifts/active');
      set({ activeShift: response.data.data ?? null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      set({ error: msg });
    } finally {
      set({ isLoading: false, hasCheckedActiveShift: true });
    }
  },

  openShift: async (cashStart) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ data: ActiveShift }>('/api/shifts/open', { cashStart });
      set({ activeShift: response.data.data, hasCheckedActiveShift: true });
      return response.data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  closeShift: async (shiftId, cashActual) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ data: ActiveShift }>('/api/shifts/close', {
        shiftId,
        cashActual,
      });
      set({ activeShift: null });
      return response.data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearShift: () => set({ activeShift: null, error: null, hasCheckedActiveShift: false }),
}));
