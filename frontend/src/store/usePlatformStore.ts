import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/apiClient';
import { useAuthStore } from './useAuthStore';
import {
  fetchActiveTenantInspectionApi,
  startTenantInspectionApi,
  stopTenantInspectionApi,
} from '../api/platformAuditApi';

export interface PlatformTenantSummary {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  status: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  _count: {
    products: number;
    outlets: number;
    users: number;
    transactions: number;
  };
}

export interface PlatformTenantMeta {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  productCount?: number;
}

export interface PlatformOverview {
  totalTenants: number;
  activeTenants: number;
  expiredTenants: number;
  tierCounts: Array<{ subscriptionTier: string; _count: number }>;
}

export interface PlatformStaffSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  approvalStatus: string;
  createdAt: string;
  tenantName: string;
  roles: string[];
  isActive: boolean;
}

export interface PlatformRevenueMetric {
  date: string;
  revenue: number;
}

export interface PlatformTopProductMetric {
  productName: string;
  tenantName: string;
  quantitySold: number;
  revenueGenerated: number;
}

export interface CreateTenantPayload {
  tenantName: string;
  ownerName: string;
  email: string;
  password?: string;
  phone: string;
  taxRate: number;
}

export interface UpdateTenantPayload {
  name: string;
  phone: string;
  taxRate: number;
}

function toTenantMeta(tenant: PlatformTenantSummary): PlatformTenantMeta {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    subscriptionTier: tenant.subscriptionTier,
    subscriptionStatus: tenant.subscriptionStatus,
    productCount: tenant._count.products,
  };
}

interface PlatformState {
  tenants: PlatformTenantSummary[];
  overview: PlatformOverview | null;
  activeTenantId: string | null;
  activeTenantMeta: PlatformTenantMeta | null;
  staffList: PlatformStaffSummary[];
  revenueData: PlatformRevenueMetric[];
  topProducts: PlatformTopProductMetric[];
  loading: boolean;
  error: string | null;

  setActiveTenant: (tenant: PlatformTenantSummary | string | null) => Promise<void>;
  syncActiveInspection: () => Promise<void>;
  ensureActiveTenant: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchOverview: () => Promise<void>;
  fetchStaffList: (page?: number, limit?: number) => Promise<void>;
  fetchRevenueData: () => Promise<void>;
  fetchTopProducts: () => Promise<void>;
  createTenant: (payload: CreateTenantPayload) => Promise<void>;
  updateTenant: (id: string, payload: UpdateTenantPayload) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      tenants: [],
      overview: null,
      activeTenantId: null,
      activeTenantMeta: null,
      staffList: [],
      revenueData: [],
      topProducts: [],
      loading: false,
      error: null,

      setActiveTenant: async (tenant) => {
        if (tenant === null) {
          set({ activeTenantId: null, activeTenantMeta: null });
          try {
            await stopTenantInspectionApi();
          } catch {
            // ignore network errors during local clear
          }
          return;
        }

        const tenantId = typeof tenant === 'string' ? tenant : tenant.id;

        if (tenantId === get().activeTenantId) {
          return;
        }

        try {
          set({ error: null });
          const inspection = await startTenantInspectionApi(tenantId);
          const found =
            typeof tenant === 'string'
              ? get().tenants.find((item) => item.id === tenant)
              : tenant;

          set({
            activeTenantId: tenantId,
            activeTenantMeta: found
              ? toTenantMeta(found)
              : {
                  id: inspection.data.tenantId,
                  name: inspection.data.tenantName,
                  slug: inspection.data.tenantId,
                  subscriptionTier: '-',
                  subscriptionStatus: '-',
                },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memulai inspeksi tenant.';
          set({ error: message });
          throw err;
        }
      },

      syncActiveInspection: async () => {
        try {
          const inspection = await fetchActiveTenantInspectionApi();
          if (!inspection) {
            return;
          }

          const found = get().tenants.find((tenant) => tenant.id === inspection.tenantId);
          set({
            activeTenantId: inspection.tenantId,
            activeTenantMeta: found
              ? toTenantMeta(found)
              : {
                  id: inspection.tenantId,
                  name: inspection.tenantName,
                  slug: inspection.tenantId,
                  subscriptionTier: '-',
                  subscriptionStatus: '-',
                },
          });
        } catch {
          // ignore sync errors on boot
        }
      },

      ensureActiveTenant: async () => {
        const state = get();
        if (state.activeTenantId && state.tenants.some((t) => t.id === state.activeTenantId)) {
          return;
        }

        if (state.tenants.length === 0) {
          await get().fetchTenants();
        }

        const tenants = get().tenants;
        if (tenants.length === 0) return;

        const userTenantId = useAuthStore.getState().user?.tenantId;
        const fallback =
          tenants.find((t) => t.id === userTenantId) ??
          tenants.find((t) => t.id === state.activeTenantId) ??
          tenants[0];

        if (fallback) {
          get().setActiveTenant(fallback);
        }
      },

      fetchTenants: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get<{ data: PlatformTenantSummary[] }>('/api/platform/tenants');
          const tenants = response.data.data ?? [];
          set({ tenants, loading: false });

          const { activeTenantId } = get();
          if (activeTenantId) {
            const active = tenants.find((t) => t.id === activeTenantId);
            if (active) {
              set({ activeTenantMeta: toTenantMeta(active) });
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memuat daftar tenant.';
          set({ error: message, loading: false });
        }
      },

      fetchOverview: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get<{ data: PlatformOverview }>('/api/platform/overview');
          set({ overview: response.data.data ?? null, loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memuat ringkasan platform.';
          set({ error: message, loading: false });
        }
      },

      fetchStaffList: async (page = 1, limit = 50) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get<{ data: PlatformStaffSummary[] }>(`/api/platform/staff?page=${page}&limit=${limit}`);
          set({ staffList: response.data.data || [], loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memuat daftar staf.';
          set({ error: message, loading: false });
        }
      },

      fetchRevenueData: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get<{ data: PlatformRevenueMetric[] }>('/api/platform/analytics/revenue');
          set({ revenueData: response.data.data || [], loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memuat data pendapatan.';
          set({ error: message, loading: false });
        }
      },

      fetchTopProducts: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get<{ data: PlatformTopProductMetric[] }>('/api/platform/analytics/top-products');
          set({ topProducts: response.data.data || [], loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memuat daftar produk terlaris.';
          set({ error: message, loading: false });
        }
      },

      createTenant: async (payload: CreateTenantPayload) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post('/api/platform/tenants', payload);
          await get().fetchTenants();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal membuat tenant.';
          set({ error: message, loading: false });
          throw err;
        }
      },

      updateTenant: async (id: string, payload: UpdateTenantPayload) => {
        set({ loading: true, error: null });
        try {
          await apiClient.put(`/api/platform/tenants/${id}`, payload);
          await get().fetchTenants();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal memperbarui tenant.';
          set({ error: message, loading: false });
          throw err;
        }
      },

      deleteTenant: async (id) => {
        set({ loading: true, error: null });
        try {
          await apiClient.delete(`/api/platform/tenants/${id}`);
          if (get().activeTenantId === id) {
            set({ activeTenantId: null, activeTenantMeta: null });
          }
          await get().fetchTenants();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gagal menghapus tenant.';
          set({ error: message, loading: false });
          throw err;
        }
      },
    }),
    {
      name: 'platform-console-state',
      partialize: (state) => ({
        activeTenantId: state.activeTenantId,
        activeTenantMeta: state.activeTenantMeta,
      }),
    }
  )
);
