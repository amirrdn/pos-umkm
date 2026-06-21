import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/apiClient';
import { useAuthStore } from './useAuthStore';

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
  loading: boolean;
  error: string | null;

  setActiveTenant: (tenant: PlatformTenantSummary | string | null) => void;
  ensureActiveTenant: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchOverview: () => Promise<void>;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      tenants: [],
      overview: null,
      activeTenantId: null,
      activeTenantMeta: null,
      loading: false,
      error: null,

      setActiveTenant: (tenant) => {
        if (tenant === null) {
          set({ activeTenantId: null, activeTenantMeta: null });
          return;
        }

        if (typeof tenant === 'string') {
          const found = get().tenants.find((item) => item.id === tenant);
          set({
            activeTenantId: tenant,
            activeTenantMeta: found ? toTenantMeta(found) : get().activeTenantMeta,
          });
          return;
        }

        set({
          activeTenantId: tenant.id,
          activeTenantMeta: toTenantMeta(tenant),
        });
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
