import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config';
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
  taxRate?: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  activeOutletId: string | null;

  login: (user: AuthUser) => void;
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

async function clearServerAuthSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore network errors during local sign-out
  }
}

async function clearPlatformInspectionSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/platform/inspection/stop`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore network errors during local sign-out
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      activeOutletId: null,

      login: (user) => {
        const activeOutletId = resolveInitialOutlet(user, get().activeOutletId);
        set({
          user,
          isAuthenticated: true,
          activeOutletId,
        });
      },

      logout: () => {
        const { user } = get();
        if (user && isPlatformAdmin(user.roles)) {
          void clearPlatformInspectionSession();
        }
        void clearServerAuthSession();
        set({
          user: null,
          isAuthenticated: false,
          activeOutletId: null,
        });
      },

      setActiveOutlet: (outletId) => set({ activeOutletId: outletId }),
    }),
    {
      name: 'pos-auth-session',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeOutletId: state.activeOutletId,
      }),
    }
  )
);
