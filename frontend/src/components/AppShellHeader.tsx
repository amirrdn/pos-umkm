import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ShoppingBag,
  History,
  Package,
  Tag,
  ArrowUpDown,
  Users,
  User,
  Store,
  BarChart2,
  Sun,
  Moon,
  LogOut,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import type { AuthUser } from '../store/useAuthStore';
import { canManageSubscription, getRoleDisplayLabel, isPlatformAdmin } from '../utils/roles';
import { OutletSwitcher } from './OutletSwitcher';
import { DraftTransferNavBadge } from './DraftTransferNavBadge';

type HeaderAccent = 'indigo' | 'emerald';

interface AppShellHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent?: HeaderAccent;
  user: AuthUser | null;
  onLogout: () => void;
  showOutletSwitcher?: boolean;
  outletSwitcherAllowAll?: boolean;
  outletSwitcherOperationalOnly?: boolean;
  trailingActions?: ReactNode;
}

interface ShellNavItem {
  path: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: boolean;
  show: boolean;
}

const accentStyles: Record<HeaderAccent, { icon: string; badge: string }> = {
  indigo: {
    icon: 'bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-indigo-500/25',
    badge: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
  },
  emerald: {
    icon: 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/25',
    badge: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  },
};

function isNavActive(path: string, locationPath: string) {
  if (path === '/pos') return locationPath === '/pos';
  return locationPath === path || locationPath.startsWith(`${path}/`);
}

export function AppShellHeader({
  title,
  subtitle,
  icon: Icon,
  accent = 'indigo',
  user,
  onLogout,
  showOutletSwitcher = true,
  outletSwitcherAllowAll = false,
  outletSwitcherOperationalOnly,
  trailingActions,
}: AppShellHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const activeNavRef = useRef<HTMLButtonElement>(null);

  const platformAdmin = isPlatformAdmin(user?.roles ?? []);
  const primaryRole = getRoleDisplayLabel(user?.roles[0] ?? 'Staff');
  const effectiveShowOutletSwitcher = showOutletSwitcher && !platformAdmin;
  const showPosNav = user?.roles.some((r) => ['Owner', 'Manager', 'Admin', 'Kasir'].includes(r));
  const showAdminNav =
    user?.roles.includes('Owner') ||
    user?.roles.includes('Admin') ||
    user?.roles.includes('Manager') ||
    user?.roles.includes('Staf Gudang');
  const showManagementNav = showAdminNav && !user?.roles.includes('Staf Gudang');
  const showOutletNav = user?.roles.includes('Owner') || user?.roles.includes('Admin');
  const showSubscriptionNav = canManageSubscription(user?.roles ?? []);

  const styles = accentStyles[accent];
  const switcherOperationalOnly = outletSwitcherOperationalOnly ?? !outletSwitcherAllowAll;

  const navItems: ShellNavItem[] = [
    ...(showPosNav
      ? [
          { path: '/pos', label: 'Kasir', icon: ShoppingBag, show: true },
          { path: '/pos/history', label: 'Riwayat', icon: History, show: true },
        ]
      : []),
    ...(showAdminNav
      ? [
          { path: '/admin/products', label: 'Produk', icon: Package, show: true },
          { path: '/admin/categories', label: 'Kategori', shortLabel: 'Kat.', icon: Tag, show: true },
          { path: '/admin/inventory', label: 'Stok', icon: ArrowUpDown, badge: true, show: true },
        ]
      : []),
    ...(showAdminNav && showManagementNav
      ? [
          { path: '/admin/staff', label: 'Staf', icon: Users, show: true },
          { path: '/admin/customers', label: 'Pelanggan', shortLabel: 'Plgn.', icon: User, show: true },
          ...(showOutletNav
            ? [{ path: '/admin/outlets', label: 'Outlet', icon: Store, show: true }]
            : []),
          { path: '/admin/dashboard', label: 'Dashboard', shortLabel: 'Dash.', icon: BarChart2, show: true },
          ...(showSubscriptionNav
            ? [
                { path: '/admin/billing', label: 'Billing', icon: CreditCard, show: true },
                { path: '/admin/pricing', label: 'Paket', icon: Sparkles, show: true },
              ]
            : []),
        ]
      : []),
  ].flat();

  const adminNavStartIndex = showPosNav ? 2 : 0;

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [location.pathname]);

  const navItemClass = (path: string) => {
    const active = isNavActive(path, location.pathname);
    return [
      'cursor-pointer flex items-center justify-center gap-1.5 rounded-lg whitespace-nowrap transition-all duration-150 shrink-0 snap-start relative',
      'min-h-10 min-w-10 p-2',
      'sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-2',
      'md:px-3 md:gap-2',
      'text-[11px] sm:text-xs font-semibold',
      active
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
    ].join(' ');
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Bar utama */}
      <div className="px-2 sm:px-3 md:px-5 py-2 sm:py-2.5 md:py-3 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className={`p-2 sm:p-2.5 rounded-xl text-white shadow-md shrink-0 ${styles.icon}`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                {title}
              </h1>
              <p className="hidden sm:block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {effectiveShowOutletSwitcher && (
          <div className="hidden xl:flex items-center gap-2 min-w-0 shrink-0">
            <div className="h-9 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Outlet
            </span>
            <OutletSwitcher
              allowAllOutlets={outletSwitcherAllowAll}
              operationalOnly={switcherOperationalOnly}
              size="md"
              className="min-w-0 max-w-[200px]"
            />
          </div>
        )}

        {platformAdmin && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Admin Platform
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {trailingActions && (
            <div className="flex items-center shrink-0 [&_button]:min-h-10 [&_button]:min-w-10 sm:[&_button]:min-h-0 sm:[&_button]:min-w-0">
              {trailingActions}
            </div>
          )}

          <button
            onClick={toggleTheme}
            type="button"
            className="cursor-pointer p-2 min-h-10 min-w-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0"
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            aria-label={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          <div className="hidden lg:flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shrink-0 max-w-[220px] xl:max-w-none">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${styles.badge}`}
            >
              {(user?.name ?? 'U').charAt(0)}
            </div>
            <div className="leading-tight min-w-0 hidden xl:block max-w-[140px]">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name || 'Operator'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${styles.badge}`}
            >
              {primaryRole}
            </span>
            {platformAdmin && (
              <span className="hidden xl:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shrink-0">
                Lintas Tenant
              </span>
            )}
          </div>

          <button
            onClick={onLogout}
            type="button"
            className="cursor-pointer flex items-center justify-center gap-1.5 min-h-10 px-2 sm:px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl transition-all active:scale-95 shrink-0"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Bar konteks — mobile & tablet */}
      <div className="xl:hidden px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        {effectiveShowOutletSwitcher && (
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 basis-[160px]">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
              Outlet
            </span>
            <OutletSwitcher
              allowAllOutlets={outletSwitcherAllowAll}
              operationalOnly={switcherOperationalOnly}
              size="sm"
              className="min-w-0 flex-1 max-w-full"
            />
          </div>
        )}

        {platformAdmin && (
          <div className="flex items-center px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Admin Platform
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto min-w-0 shrink-0">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${styles.badge}`}
            aria-hidden
          >
            {(user?.name ?? 'U').charAt(0)}
          </div>
          <div className="leading-tight min-w-0 max-w-[140px] sm:max-w-[180px]">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {user?.name || 'Operator'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {user?.email}
            </p>
          </div>
          <span
            className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${styles.badge}`}
          >
            {primaryRole}
          </span>
        </div>
      </div>

      {/* Navigasi */}
      <div className="relative border-t border-slate-100 dark:border-slate-800/80">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white dark:from-slate-900 to-transparent sm:w-8 md:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white dark:from-slate-900 to-transparent sm:w-8 md:hidden"
          aria-hidden
        />

        <nav
          className="relative px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch] md:overflow-x-visible md:flex-wrap md:gap-x-1 md:gap-y-1 lg:flex-nowrap lg:overflow-x-auto"
          aria-label="Navigasi utama"
        >
          {navItems.map((item, index) => {
            const NavIcon = item.icon;
            const active = isNavActive(item.path, location.pathname);
            const displayShort = item.shortLabel ?? item.label;
            const showDivider = showAdminNav && index === adminNavStartIndex && adminNavStartIndex > 0;

            return (
              <span key={item.path} className="contents">
                {showDivider && (
                  <div
                    className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1 shrink-0 self-center"
                    aria-hidden
                  />
                )}
                <button
                  ref={active ? activeNavRef : undefined}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={navItemClass(item.path)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <NavIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="hidden sm:inline md:hidden">{displayShort}</span>
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge && (
                    <DraftTransferNavBadge className="max-sm:absolute max-sm:-top-0.5 max-sm:-right-0.5 max-sm:min-w-[1rem] max-sm:px-1 max-sm:text-[9px]" />
                  )}
                </button>
              </span>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
