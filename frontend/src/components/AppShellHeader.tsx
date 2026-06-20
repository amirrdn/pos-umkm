import type { ReactNode } from 'react';
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
  /** Izinkan opsi "Semua Outlet" — untuk dashboard analitik. */
  outletSwitcherAllowAll?: boolean;
  /** Filter hanya outlet operasional di switcher. Default: true kecuali `outletSwitcherAllowAll`. */
  outletSwitcherOperationalOnly?: boolean;
  /** Konten tambahan di bar kanan (mis. badge shift POS). */
  trailingActions?: ReactNode;
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

  const navItemClass = (path: string) =>
    `cursor-pointer flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
      isNavActive(path, location.pathname)
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  const styles = accentStyles[accent];
  const switcherOperationalOnly = outletSwitcherOperationalOnly ?? !outletSwitcherAllowAll;

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="px-5 py-3 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className={`p-2.5 rounded-xl text-white shadow-md ${styles.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                {title}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                {subtitle}
              </p>
            </div>
          </div>

          {effectiveShowOutletSwitcher && (
            <>
              <div className="hidden md:block h-9 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  Outlet
                </span>
                <OutletSwitcher
                  allowAllOutlets={outletSwitcherAllowAll}
                  operationalOnly={switcherOperationalOnly}
                  size="md"
                  className="min-w-0"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {trailingActions}

          <button
            onClick={toggleTheme}
            type="button"
            className="cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          <div className="hidden md:flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${styles.badge}`}
            >
              {(user?.name ?? 'U').charAt(0)}
            </div>
            <div className="leading-tight max-w-[140px]">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name || 'Operator'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${styles.badge}`}
            >
              {primaryRole}
            </span>
            {platformAdmin && (
              <span className="hidden lg:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
                Lintas Tenant
              </span>
            )}
          </div>

          <button
            onClick={onLogout}
            type="button"
            className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      <nav className="px-5 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {showPosNav && (
          <button onClick={() => navigate('/pos')} className={navItemClass('/pos')}>
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            Kasir
          </button>
        )}
        {showPosNav && (
          <button onClick={() => navigate('/pos/history')} className={navItemClass('/pos/history')}>
            <History className="w-3.5 h-3.5 shrink-0" />
            Riwayat
          </button>
        )}

        {showAdminNav && (
          <>
            {showPosNav && <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />}
            <button onClick={() => navigate('/admin/products')} className={navItemClass('/admin/products')}>
              <Package className="w-3.5 h-3.5 shrink-0" />
              Produk
            </button>
            <button onClick={() => navigate('/admin/categories')} className={navItemClass('/admin/categories')}>
              <Tag className="w-3.5 h-3.5 shrink-0" />
              Kategori
            </button>
            <button onClick={() => navigate('/admin/inventory')} className={navItemClass('/admin/inventory')}>
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              Stok
              <DraftTransferNavBadge />
            </button>

            {showManagementNav && (
              <>
                <button onClick={() => navigate('/admin/staff')} className={navItemClass('/admin/staff')}>
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  Staf
                </button>
                <button onClick={() => navigate('/admin/customers')} className={navItemClass('/admin/customers')}>
                  <User className="w-3.5 h-3.5 shrink-0" />
                  Pelanggan
                </button>
                {showOutletNav && (
                  <button onClick={() => navigate('/admin/outlets')} className={navItemClass('/admin/outlets')}>
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    Outlet
                  </button>
                )}
                <button onClick={() => navigate('/admin/dashboard')} className={navItemClass('/admin/dashboard')}>
                  <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                  Dashboard
                </button>
                {showSubscriptionNav && (
                  <>
                    <button onClick={() => navigate('/admin/billing')} className={navItemClass('/admin/billing')}>
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      Billing
                    </button>
                    <button onClick={() => navigate('/admin/pricing')} className={navItemClass('/admin/pricing')}>
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      Paket
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
