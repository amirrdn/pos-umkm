import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Antarmuka untuk Data Pengguna (User)
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  outletId?: string | null;
  outlet?: { id: string; name: string } | null;
}

// Antarmuka untuk State dan Action Otentikasi
interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      // Menyimpan token dan data pengguna ke dalam state (dan localStorage otomatis via persist)
      login: (token, user) => set({
        token,
        user,
        isAuthenticated: true
      }),

      // Menghapus data sesi otentikasi dari state (dan localStorage)
      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'pos-auth-session', // Nama key di localStorage
    }
  )
);
