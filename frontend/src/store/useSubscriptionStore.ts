import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

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
      const response = await apiClient.get<{ data: SubscriptionDetails }>('/api/subscriptions/active');
      set({ subscription: response.data.data, loading: false });
    } catch (err: unknown) {
      console.error('FetchActiveSubscription Error:', err);
      set({ error: err instanceof Error ? err.message : 'Gagal mengambil detail langganan.', loading: false });
    }
  },

  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<{ data: SubscriptionInvoice[] }>('/api/subscriptions/invoices');
      set({ invoices: response.data.data || [], loading: false });
    } catch (err: unknown) {
      console.error('FetchInvoices Error:', err);
      set({ error: err instanceof Error ? err.message : 'Gagal mengambil riwayat tagihan.', loading: false });
    }
  },

  upgradeSubscription: async (tier: 'GROWTH' | 'ENTERPRISE') => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<{
        data: { snapToken: string; snapUrl: string; invoiceNumber: string };
      }>('/api/subscriptions/upgrade', { tier });

      set({ loading: false });
      return {
        snapToken: response.data.data.snapToken,
        snapUrl: response.data.data.snapUrl,
        invoiceNumber: response.data.data.invoiceNumber,
      };
    } catch (err: unknown) {
      console.error('UpgradeSubscription Error:', err);
      set({ error: err instanceof Error ? err.message : 'Gagal mengajukan upgrade paket.', loading: false });
      throw err;
    }
  },

  downgradeSubscription: async () => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/api/subscriptions/downgrade');
      set({ loading: false });
    } catch (err: unknown) {
      console.error('DowngradeSubscription Error:', err);
      set({ error: err instanceof Error ? err.message : 'Gagal mengubah paket ke gratis.', loading: false });
      throw err;
    }
  },
}));
