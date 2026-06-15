import { create } from 'zustand';
import { API_BASE_URL } from '../config';

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
  error: string | null;

  // Actions
  fetchActiveShift: (token: string, tenantId: string) => Promise<void>;
  openShift: (token: string, tenantId: string, cashStart: number) => Promise<ActiveShift>;
  closeShift: (token: string, tenantId: string, shiftId: string, cashActual: number) => Promise<ActiveShift>;
  clearShift: () => void;
}

// ==========================================
// HELPER
// ==========================================

function buildHeaders(token: string, tenantId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
  };
}

// ==========================================
// STORE
// ==========================================

export const useShiftStore = create<ShiftStore>((set) => ({
  activeShift: null,
  isLoading: false,
  error: null,

  /**
   * Mengambil data shift aktif milik kasir yang sedang login.
   * Dipanggil saat komponen PosView pertama kali di-mount.
   */
  fetchActiveShift: async (token, tenantId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/shifts/active`, {
        headers: buildHeaders(token, tenantId),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengambil data shift aktif.');
      set({ activeShift: json.data ?? null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Membuka shift baru dengan modal awal yang dimasukkan kasir.
   */
  openShift: async (token, tenantId, cashStart) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/shifts/open`, {
        method: 'POST',
        headers: buildHeaders(token, tenantId),
        body: JSON.stringify({ cashStart }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal membuka shift.');
      set({ activeShift: json.data });
      return json.data;
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
  closeShift: async (token, tenantId, shiftId, cashActual) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/shifts/close`, {
        method: 'POST',
        headers: buildHeaders(token, tenantId),
        body: JSON.stringify({ shiftId, cashActual }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal menutup shift.');
      set({ activeShift: null });
      return json.data;
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
  clearShift: () => set({ activeShift: null, error: null }),
}));
