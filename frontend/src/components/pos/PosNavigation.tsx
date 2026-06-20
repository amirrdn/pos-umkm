import React from 'react';
import { ShoppingBag, History, Package, Tag, ArrowUpDown, Users, User, Store, BarChart2, CreditCard } from 'lucide-react';
import { DraftTransferNavBadge } from '../DraftTransferNavBadge';

interface PosNavigationProps {
  navigate: (path: string) => void;
  locationPathname: string;
  showAdminNav: boolean;
  showManagementNav: boolean;
  showOutletNav: boolean;
  managesSubscription: boolean;
}

export const PosNavigation: React.FC<PosNavigationProps> = ({
  navigate,
  locationPathname,
  showAdminNav,
  showManagementNav,
  showOutletNav,
  managesSubscription,
}) => {
  const isNavActive = (path: string) => {
    if (path === '/pos') return locationPathname === '/pos';
    return locationPathname === path || locationPathname.startsWith(`${path}/`);
  };

  const navItemClass = (path: string) =>
    `cursor-pointer flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 shrink-0 ${
      isNavActive(path)
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <nav className="px-3 sm:px-5 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
      <button onClick={() => navigate('/pos')} className={`${navItemClass('/pos')} snap-start`}>
        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
        Kasir
      </button>
      <button onClick={() => navigate('/pos/history')} className={`${navItemClass('/pos/history')} snap-start`}>
        <History className="w-3.5 h-3.5 shrink-0" />
        Riwayat
      </button>

      {showAdminNav && (
        <>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
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
              {managesSubscription && (
                <button onClick={() => navigate('/admin/billing')} className={navItemClass('/admin/billing')}>
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  Billing
                </button>
              )}
              {managesSubscription && (
                <button onClick={() => navigate('/admin/pricing')} className={navItemClass('/admin/pricing')}>
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  Paket
                </button>
              )}
            </>
          )}
        </>
      )}
    </nav>
  );
};
