import { create } from 'zustand';
import { API_BASE_URL } from '../config';
import { buildApiHeaders } from '../utils/apiHeaders';

export interface UsageDetail {
  current: number;
  limit: number;
  isNearLimit: boolean;
  isFull: boolean;
}

export interface SubscriptionDetails {
  tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAID_PENDING' | 'EXPIRED' | 'SUSPENDED';
  expiresAt: string | null;
  lastBillingAt: string | null;
  platformAdminBypass?: boolean;
  usage: {
    products: UsageDetail;
    outlets: UsageDetail;
    staff: UsageDetail;
    transactions: UsageDetail;
  };
  features: {
    hasQris: boolean;
    hasCogs: boolean;
    maxDebtLimit: number;
  };
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  amount: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  paymentToken: string | null;
  paymentUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface SubscriptionState {
  subscription: SubscriptionDetails | null;
  invoices: SubscriptionInvoice[];
  loading: boolean;
  error: string | null;

  fetchActiveSubscription: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  upgradeSubscription: (tier: 'GROWTH' | 'ENTERPRISE') => Promise<{
    snapToken: string;
    snapUrl: string;
    invoiceNumber: string;
  }>;
  downgradeSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  invoices: [],
  loading: false,
  error: null,

  fetchActiveSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/active`, {
        method: 'GET',
        headers: buildApiHeaders(),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Gagal mengambil detail langganan.');
      }

      set({ subscription: res.data, loading: false });
    } catch (err: any) {
      console.error('FetchActiveSubscription Error:', err);
      set({ error: err.message, loading: false });
    }
  },

  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/invoices`, {
        method: 'GET',
        headers: buildApiHeaders(),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Gagal mengambil riwayat tagihan.');
      }

      set({ invoices: res.data || [], loading: false });
    } catch (err: any) {
      console.error('FetchInvoices Error:', err);
      set({ error: err.message, loading: false });
    }
  },

  upgradeSubscription: async (tier: 'GROWTH' | 'ENTERPRISE') => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/upgrade`, {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ tier }),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Gagal mengajukan upgrade paket.');
      }

      set({ loading: false });
      return {
        snapToken: res.data.snapToken,
        snapUrl: res.data.snapUrl,
        invoiceNumber: res.data.invoiceNumber,
      };
    } catch (err: any) {
      console.error('UpgradeSubscription Error:', err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  downgradeSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/downgrade`, {
        method: 'POST',
        headers: buildApiHeaders(),
      });

      const res = await response.json();
      if (!response.ok) {
        throw new Error(res.message || 'Gagal mengubah paket ke gratis.');
      }

      set({ loading: false });
    } catch (err: any) {
      console.error('DowngradeSubscription Error:', err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
