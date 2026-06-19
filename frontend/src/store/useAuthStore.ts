import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const GLOBAL_ADMIN_ROLES = ['Owner', 'Admin', 'TENANT_ADMIN', 'Manager'];

export function isGlobalAdmin(roles: string[]): boolean {
  return roles.some((role) => GLOBAL_ADMIN_ROLES.includes(role));
}

export interface AuthOutlet {
  id: string;
  name: string;
  type?: 'MAIN' | 'BRANCH';
  code?: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  outletIds?: string[];
  outlets?: AuthOutlet[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  activeOutletId: string | null;

  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setActiveOutlet: (outletId: string | null) => void;
}

function resolveInitialOutlet(user: AuthUser, persistedOutletId: string | null): string | null {
  const admin = isGlobalAdmin(user.roles);
  const allowedIds = user.outletIds ?? [];

  if (persistedOutletId) {
    if (admin) return persistedOutletId;
    if (allowedIds.includes(persistedOutletId)) return persistedOutletId;
  }

  if (allowedIds.length > 0) return allowedIds[0];
  if (user.outlets && user.outlets.length > 0) return user.outlets[0].id;

  return null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      activeOutletId: null,

      login: (token, user) => {
        const activeOutletId = resolveInitialOutlet(user, get().activeOutletId);
        set({
          token,
          user,
          isAuthenticated: true,
          activeOutletId,
        });
      },

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          activeOutletId: null,
        }),

      setActiveOutlet: (outletId) => set({ activeOutletId: outletId }),
    }),
    {
      name: 'pos-auth-session',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeOutletId: state.activeOutletId,
      }),
    }
  )
);
