import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

// ==========================================
// INTERFACE
// ==========================================

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
  /** True setelah GET /shifts/active selesai — cegah flash ShiftModal saat refresh. */
  hasCheckedActiveShift: boolean;
  error: string | null;

  // Actions
  fetchActiveShift: (token: string, tenantId: string) => Promise<void>;
  openShift: (token: string, tenantId: string, cashStart: number) => Promise<ActiveShift>;
  closeShift: (token: string, tenantId: string, shiftId: string, cashActual: number) => Promise<ActiveShift>;
  clearShift: () => void;
}

// ==========================================
// STORE
// ==========================================

export const useShiftStore = create<ShiftStore>((set) => ({
  activeShift: null,
  isLoading: false,
  hasCheckedActiveShift: false,
  error: null,

  /**
   * Mengambil data shift aktif milik kasir yang sedang login.
   * Dipanggil saat komponen PosView pertama kali di-mount.
   */
  fetchActiveShift: async (_token, _tenantId) => {
    void _token;
    void _tenantId;
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

  /**
   * Membuka shift baru dengan modal awal yang dimasukkan kasir.
   */
  openShift: async (_token, _tenantId, cashStart) => {
    void _token;
    void _tenantId;
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

  /**
   * Menutup shift aktif dengan memasukkan jumlah uang fisik di laci.
   */
  closeShift: async (_token, _tenantId, shiftId, cashActual) => {
    void _token;
    void _tenantId;
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

  /**
   * Membersihkan state shift (misalnya saat user logout).
   */
  clearShift: () => set({ activeShift: null, error: null, hasCheckedActiveShift: false }),
}));
