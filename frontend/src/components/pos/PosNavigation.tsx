import React, { useEffect, useRef } from 'react';
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
  CreditCard,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { DraftTransferNavBadge } from '../DraftTransferNavBadge';

interface PosNavigationProps {
  navigate: (path: string) => void;
  locationPathname: string;
  showAdminNav: boolean;
  showManagementNav: boolean;
  showOutletNav: boolean;
  managesSubscription: boolean;
}

interface NavItem {
  path: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: boolean;
}

export const PosNavigation: React.FC<PosNavigationProps> = ({
  navigate,
  locationPathname,
  showAdminNav,
  showManagementNav,
  showOutletNav,
  managesSubscription,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const isNavActive = (path: string) => {
    if (path === '/pos') return locationPathname === '/pos';
    return locationPathname === path || locationPathname.startsWith(`${path}/`);
  };

  const posItems: NavItem[] = [
    { path: '/pos', label: 'Kasir', icon: ShoppingBag },
    { path: '/pos/history', label: 'Riwayat', icon: History },
  ];

  const adminItems: NavItem[] = [
    { path: '/admin/products', label: 'Produk', icon: Package },
    { path: '/admin/categories', label: 'Kategori', shortLabel: 'Kat.', icon: Tag },
    { path: '/admin/inventory', label: 'Stok', icon: ArrowUpDown, badge: true },
  ];

  const managementItems: NavItem[] = [
    { path: '/admin/staff', label: 'Staf', icon: Users },
    { path: '/admin/customers', label: 'Pelanggan', shortLabel: 'Plgn.', icon: User },
    ...(showOutletNav
      ? [{ path: '/admin/outlets', label: 'Outlet', icon: Store } satisfies NavItem]
      : []),
    { path: '/admin/dashboard', label: 'Dashboard', shortLabel: 'Dash.', icon: BarChart2 },
    ...(managesSubscription
      ? [
        { path: '/admin/billing', label: 'Billing', icon: CreditCard } satisfies NavItem,
        { path: '/admin/pricing', label: 'Paket', icon: Sparkles } satisfies NavItem,
      ]
      : []),
  ];

  const items: NavItem[] = [
    ...posItems,
    ...(showAdminNav ? adminItems : []),
    ...(showAdminNav && showManagementNav ? managementItems : []),
  ];

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [locationPathname]);

  const navItemClass = (path: string) => {
    const active = isNavActive(path);
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

  const renderItem = (item: NavItem, showDividerBefore = false) => {
    const Icon = item.icon;
    const active = isNavActive(item.path);
    const displayShort = item.shortLabel ?? item.label;

    return (
      <React.Fragment key={item.path}>
        {showDividerBefore && (
          <div
            className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1 shrink-0 self-center"
            aria-hidden
          />
        )}
        <button
          ref={active ? activeRef : undefined}
          type="button"
          onClick={() => navigate(item.path)}
          className={navItemClass(item.path)}
          title={item.label}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
        >
          <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="hidden sm:inline md:hidden">{displayShort}</span>
          <span className="hidden md:inline">{item.label}</span>
          {item.badge && <DraftTransferNavBadge className="max-sm:absolute max-sm:-top-0.5 max-sm:-right-0.5 max-sm:min-w-[1rem] max-sm:px-1 max-sm:text-[9px]" />}
        </button>
      </React.Fragment>
    );
  };

  const adminStartIndex = posItems.length;

  return (
    <div className="relative shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white dark:from-slate-900 to-transparent sm:w-8 md:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white dark:from-slate-900 to-transparent sm:w-8 md:hidden"
        aria-hidden
      />

      <nav
        ref={navRef}
        className="relative px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch] md:overflow-x-visible md:flex-wrap md:gap-x-1 md:gap-y-1 lg:flex-nowrap lg:overflow-x-auto"
        aria-label="Navigasi utama"
      >
        {items.map((item, index) =>
          renderItem(item, index === adminStartIndex && showAdminNav)
        )}
      </nav>
    </div>
  );
};
