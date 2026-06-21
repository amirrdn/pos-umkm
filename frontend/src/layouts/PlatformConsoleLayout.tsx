import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { usePlatformStore } from '../store/usePlatformStore';
import { getRoleDisplayLabel } from '../utils/roles';
import { TenantSwitcher } from '../components/platform/TenantSwitcher';

const NAV_ITEMS = [
  { path: '/platform', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/platform/tenants', label: 'Tenant', icon: Building2, exact: false },
  { path: '/platform/billing', label: 'Billing', icon: CreditCard, exact: false },
] as const;

export function PlatformConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const activeTenantMeta = usePlatformStore((state) => state.activeTenantMeta);
  const ensureActiveTenant = usePlatformStore((state) => state.ensureActiveTenant);
  const [menuOpenForPath, setMenuOpenForPath] = useState<string | null>(null);
  const mobileMenuOpen = menuOpenForPath === location.pathname;
  const setMobileMenuOpen = useCallback((open: boolean) => {
    setMenuOpenForPath(open ? location.pathname : null);
  }, [location.pathname]);

  useEffect(() => {
    ensureActiveTenant();
  }, [ensureActiveTenant]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = (path: string, exact?: boolean, compact = false) => {
    const active = isActive(path, exact);
    return [
      'cursor-pointer flex items-center transition-all font-semibold',
      compact
        ? 'flex-col justify-center gap-1 flex-1 min-h-[56px] px-1 py-2 text-[10px] rounded-none'
        : 'gap-3 w-full px-3 py-2.5 rounded-xl text-sm',
      active
        ? compact
          ? 'text-violet-100 bg-violet-500/10'
          : 'bg-violet-500/20 text-violet-100 border border-violet-400/30'
        : compact
          ? 'text-violet-200/70 hover:text-violet-100'
          : 'text-violet-200/70 hover:bg-violet-500/10 hover:text-violet-100',
    ].join(' ');
  };

  const renderNavItems = (compact = false, onNavigate?: () => void) =>
    NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => (
      <button
        key={path}
        type="button"
        onClick={() => {
          navigate(path);
          onNavigate?.();
        }}
        className={navItemClass(path, exact, compact)}
        aria-current={isActive(path, exact) ? 'page' : undefined}
      >
        <Icon className={compact ? 'w-5 h-5 shrink-0' : 'w-4 h-4 shrink-0'} />
        <span className={compact ? 'truncate max-w-full' : undefined}>{label}</span>
      </button>
    ));

  const renderSidebarBrand = () => (
    <div className="px-4 sm:px-5 py-4 sm:py-6 border-b border-violet-900/40">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-violet-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white tracking-tight truncate">SaaSPOS</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80 truncate">
            Platform Console
          </p>
        </div>
      </div>
    </div>
  );

  const renderSidebarFooter = () => (
    <div className="px-3 sm:px-4 py-4 border-t border-violet-900/40 space-y-3">
      <div className="px-2 min-w-0">
        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
        <p className="text-[10px] text-violet-300/70 truncate">{user?.email}</p>
        <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-violet-500/20 text-violet-200 border border-violet-400/20">
          {getRoleDisplayLabel(user?.roles[0] ?? 'Admin')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2 min-h-10 rounded-lg text-xs font-semibold text-violet-200/80 hover:bg-violet-500/10 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
          {theme === 'dark' ? 'Terang' : 'Gelap'}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer flex items-center justify-center p-2 min-h-10 min-w-10 rounded-lg text-rose-300 hover:bg-rose-500/10 transition-all"
          title="Keluar"
          aria-label="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderSidebar = (onClose?: () => void) => (
    <>
      {renderSidebarBrand()}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navigasi platform">
        {renderNavItems(false, onClose)}
      </nav>
      {renderSidebarFooter()}
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-gradient-to-b from-violet-950 to-slate-950 border-r border-violet-900/40">
        {renderSidebar()}
      </aside>

      {/* Drawer mobile / tablet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Tutup menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative h-full w-[min(100vw-3rem,17rem)] flex flex-col bg-gradient-to-b from-violet-950 to-slate-950 border-r border-violet-900/40 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="cursor-pointer absolute top-3 right-3 p-2 rounded-lg text-violet-200/80 hover:bg-violet-500/10 transition-all"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebar(() => setMobileMenuOpen(false))}
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar mobile / tablet */}
        <div className="lg:hidden shrink-0 px-3 py-2.5 border-b border-violet-900/30 bg-gradient-to-r from-violet-950 to-slate-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="cursor-pointer p-2 min-h-10 min-w-10 flex items-center justify-center rounded-lg text-violet-200 hover:bg-violet-500/10 transition-all shrink-0"
              aria-label="Buka menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">SaaSPOS</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-violet-300/80 truncate">
                Platform Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="cursor-pointer p-2 min-h-10 min-w-10 flex items-center justify-center rounded-lg text-violet-200/80 hover:bg-violet-500/10 transition-all"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              aria-label={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer p-2 min-h-10 min-w-10 flex items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/10 transition-all"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <header className="shrink-0 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">
                Konsol Admin Platform
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Kelola tenant, langganan, dan operasional SaaS
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 min-w-0 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0 w-full sm:w-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  Tenant Aktif
                </span>
                <TenantSwitcher className="w-full sm:min-w-[200px] sm:max-w-xs min-w-0" size="md" />
              </div>
              {activeTenantMeta && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-right">
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

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <Outlet />
        </div>

        {/* Bottom nav mobile / tablet */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-violet-900/40 bg-gradient-to-t from-slate-950 to-violet-950 pb-[env(safe-area-inset-bottom)]"
          aria-label="Navigasi platform"
        >
          {renderNavItems(true, () => setMobileMenuOpen(false))}
        </nav>
      </main>
    </div>
  );
}
