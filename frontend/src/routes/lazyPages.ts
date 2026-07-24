import { lazy, type ComponentType } from 'react';

/** Lazy-load modul dengan named export sebagai default untuk React.lazy. */
function lazyNamed(
  loader: () => Promise<Record<string, ComponentType>>,
  exportName: string
) {
  return lazy(() =>
    loader().then((module) => {
      const component = module[exportName];
      if (!component) {
        throw new Error(`Export "${exportName}" tidak ditemukan pada route chunk.`);
      }
      return { default: component as ComponentType };
    })
  );
}

export const LandingPage = lazy(() => import('../components/LandingPage'));
export const RegisterView = lazy(() => import('../components/RegisterView'));
export const VerifyEmailView = lazy(() => import('../components/VerifyEmailView'));
export const LoginView = lazyNamed(() => import('../components/LoginView'), 'LoginView');
export const UserDocumentation = lazy(() => import('../components/UserDocumentation'));

export const PlatformConsoleLayout = lazyNamed(
  () => import('../layouts/PlatformConsoleLayout'),
  'PlatformConsoleLayout'
);
export const PlatformDashboard = lazyNamed(
  () => import('../components/platform/PlatformDashboard'),
  'PlatformDashboard'
);
export const PlatformAnalyticsView = lazyNamed(
  () => import('../components/platform/PlatformAnalyticsView'),
  'PlatformAnalyticsView'
);
export const PlatformStaffView = lazyNamed(
  () => import('../components/platform/PlatformStaffView'),
  'PlatformStaffView'
);
export const PlatformTenantsView = lazyNamed(
  () => import('../components/platform/PlatformTenantsView'),
  'PlatformTenantsView'
);
export const PlatformTenantDetailView = lazyNamed(
  () => import('../components/platform/PlatformTenantDetailView'),
  'PlatformTenantDetailView'
);
export const PlatformBillingView = lazyNamed(
  () => import('../components/platform/PlatformBillingView'),
  'PlatformBillingView'
);
export const PlatformAuditView = lazyNamed(
  () => import('../components/platform/PlatformAuditView'),
  'PlatformAuditView'
);

export const PosView = lazyNamed(() => import('../components/PosView'), 'PosView');
export const TransactionHistory = lazyNamed(
  () => import('../components/TransactionHistory'),
  'TransactionHistory'
);
export const ProductMaster = lazyNamed(() => import('../components/ProductMaster'), 'ProductMaster');
export const CategoryMaster = lazyNamed(() => import('../components/CategoryMaster'), 'CategoryMaster');
export const DashboardAdmin = lazy(() => import('../components/DashboardAdmin'));
export const StaffManagementView = lazyNamed(
  () => import('../components/StaffManagementView'),
  'StaffManagementView'
);
export const InventoryView = lazyNamed(() => import('../components/InventoryView'), 'InventoryView');
export const CustomerManagementView = lazyNamed(
  () => import('../components/CustomerManagementView'),
  'CustomerManagementView'
);
export const OutletManagementView = lazyNamed(
  () => import('../components/OutletManagementView'),
  'OutletManagementView'
);
export const CustomerDisplay = lazy(() => import('../components/CustomerDisplay'));
export const BillingDashboard = lazy(() => import('../components/BillingDashboard'));
export const SubscriptionPricing = lazy(() => import('../components/SubscriptionPricing'));

export const SupplierManagementView = lazyNamed(
  () => import('../components/supplier-management/SupplierManagementView'),
  'SupplierManagementView'
);
export const PurchaseOrderView = lazyNamed(
  () => import('../components/purchase-order/PurchaseOrderView'),
  'PurchaseOrderView'
);
export const SalesReturnView = lazyNamed(
  () => import('../components/sales-return/SalesReturnView'),
  'SalesReturnView'
);
