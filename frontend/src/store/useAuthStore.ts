import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  hasTenantWideOutletAccess,
  isPlatformAdmin,
  isTenantOwner,
  canManageSubscription,
  hasAnyRole,
  PLATFORM_ADMIN_ROLE,
  PLATFORM_ADMIN_ROLE_LABEL,
  TENANT_OWNER_ROLE,
  TENANT_WIDE_OUTLET_ROLES,
} from '../utils/roles';
import { getAssignedOutletIds } from '../utils/outletAccess';

export {
  isPlatformAdmin,
  isTenantOwner,
  canManageSubscription,
  hasTenantWideOutletAccess,
  hasAnyRole,
  PLATFORM_ADMIN_ROLE,
  PLATFORM_ADMIN_ROLE_LABEL,
  TENANT_OWNER_ROLE,
  TENANT_WIDE_OUTLET_ROLES,
};

export interface AuthOutlet {
  id: string;
  name: string;
  type?: 'MAIN' | 'BRANCH';
  code?: string | null;
  isActive?: boolean;
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
  if (isPlatformAdmin(user.roles)) {
    return null;
  }

  const wideAccess = hasTenantWideOutletAccess(user.roles);
  const allowedIds = [...getAssignedOutletIds(user)];
  const isOperational = (outletId: string) => {
    const outlet = user.outlets?.find((o) => o.id === outletId);
    return outlet ? outlet.isActive !== false : true;
  };

  if (persistedOutletId) {
    if (wideAccess && isOperational(persistedOutletId)) return persistedOutletId;
    if (allowedIds.includes(persistedOutletId) && isOperational(persistedOutletId)) {
      return persistedOutletId;
    }
  }

  const firstActiveAssigned = user.outlets?.find((o) => o.isActive !== false);
  if (firstActiveAssigned) return firstActiveAssigned.id;

  const firstActiveId = allowedIds.find((id) => isOperational(id));
  if (firstActiveId) return firstActiveId;

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
