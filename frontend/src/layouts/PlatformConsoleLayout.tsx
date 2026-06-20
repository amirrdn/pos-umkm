import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { usePlatformStore } from '../store/usePlatformStore';
import { getRoleDisplayLabel } from '../utils/roles';
import { TenantSwitcher } from '../components/platform/TenantSwitcher';

const NAV_ITEMS = [
  { path: '/platform', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/platform/tenants', label: 'Tenant', icon: Building2 },
  { path: '/platform/billing', label: 'Billing', icon: CreditCard },
] as const;

export function PlatformConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const activeTenantMeta = usePlatformStore((state) => state.activeTenantMeta);
  const ensureActiveTenant = usePlatformStore((state) => state.ensureActiveTenant);

  useEffect(() => {
    ensureActiveTenant();
  }, [ensureActiveTenant]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside className="w-64 shrink-0 flex flex-col bg-gradient-to-b from-violet-950 to-slate-950 border-r border-violet-900/40">
        <div className="px-5 py-6 border-b border-violet-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight">SaaSPOS</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80">
                Platform Console
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive(path, exact)
                  ? 'bg-violet-500/20 text-violet-100 border border-violet-400/30'
                  : 'text-violet-200/70 hover:bg-violet-500/10 hover:text-violet-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-violet-900/40 space-y-3">
          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-violet-300/70 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-violet-500/20 text-violet-200 border border-violet-400/20">
              {getRoleDisplayLabel(user?.roles[0] ?? 'Admin')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-violet-200/80 hover:bg-violet-500/10 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Terang' : 'Gelap'}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="cursor-pointer flex items-center justify-center p-2 rounded-lg text-rose-300 hover:bg-rose-500/10 transition-all"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">
                Konsol Admin Platform
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola tenant, langganan, dan operasional SaaS
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  Tenant Aktif
                </span>
                <TenantSwitcher className="min-w-[200px] max-w-xs" size="md" />
              </div>
              {activeTenantMeta && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Paket: <span className="font-bold">{activeTenantMeta.subscriptionTier}</span>
                  {' · '}
                  Status: <span className="font-bold">{activeTenantMeta.subscriptionStatus}</span>
                  {activeTenantMeta.productCount !== undefined && (
                    <>
                      {' · '}
                      {activeTenantMeta.productCount} SKU
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
