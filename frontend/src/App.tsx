import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, isPlatformAdmin } from './store/useAuthStore';
import { TENANT_OWNER_ROLE, ROLE_MANAGER, ROLE_CASHIER, ROLE_INVENTORY, PLATFORM_ADMIN_ROLE } from './utils/roles';
import { useThemeStore } from './store/useThemeStore';
import { NotificationPoller } from './components/NotificationPoller';
import { RouteFallback } from './components/RouteFallback';
import {
  BillingDashboard,
  CategoryMaster,
  CustomerDisplay,
  CustomerManagementView,
  DashboardAdmin,
  InventoryView,
  LandingPage,
  LoginView,
  OutletManagementView,
  PlatformBillingView,
  PlatformAuditView,
  PlatformConsoleLayout,
  PlatformDashboard,
  PlatformAnalyticsView,
  PlatformStaffView,
  PlatformTenantDetailView,
  PlatformTenantsView,
  PosView,
  ProductMaster,
  RegisterView,
  StaffManagementView,
  SubscriptionPricing,
  TransactionHistory,
  UserDocumentation,
  VerifyEmailView,
  SupplierManagementView,
  PurchaseOrderView,
  SalesReturnView,
} from './routes/lazyPages';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user && isPlatformAdmin(user.roles)) {
    return <Navigate to="/platform" replace />;
  }

  if (allowedRoles && user) {
    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      if (user.roles.includes(ROLE_INVENTORY)) {
        return <Navigate to="/admin/inventory" replace />;
      }
      return <Navigate to="/pos" replace />;
    }
  }

  return <>{children}</>;
};

const PlatformRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !isPlatformAdmin(user.roles)) {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
};

function getDefaultAuthedPath(user: ReturnType<typeof useAuthStore.getState>['user']) {
  if (user && isPlatformAdmin(user.roles)) {
    return '/platform';
  }
  return '/pos';
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const defaultAuthedPath = getDefaultAuthedPath(user);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <NotificationPoller />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to={defaultAuthedPath} replace /> : <LandingPage />}
          />

          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to={defaultAuthedPath} replace /> : <RegisterView />}
          />

          <Route path="/verify-email" element={<VerifyEmailView />} />

          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={defaultAuthedPath} replace /> : <LoginView />}
          />

          <Route path="/docs" element={<UserDocumentation />} />

          <Route
            path="/platform"
            element={
              <PlatformRoute>
                <PlatformConsoleLayout />
              </PlatformRoute>
            }
          >
            <Route index element={<PlatformDashboard />} />
            <Route path="analytics" element={<PlatformAnalyticsView />} />
            <Route path="staff" element={<PlatformStaffView />} />
            <Route path="tenants" element={<PlatformTenantsView />} />
            <Route path="tenants/:tenantId" element={<PlatformTenantDetailView />} />
            <Route path="billing" element={<PlatformBillingView />} />
            <Route path="audit" element={<PlatformAuditView />} />
          </Route>

          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_CASHIER]}>
                <PosView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos/history"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_CASHIER]}>
                <TransactionHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_INVENTORY]}>
                <ProductMaster />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_INVENTORY]}>
                <CategoryMaster />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE]}>
                <StaffManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_INVENTORY]}>
                <InventoryView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_CASHIER]}>
                <CustomerManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/outlets"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, PLATFORM_ADMIN_ROLE]}>
                <OutletManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/suppliers"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_INVENTORY]}>
                <SupplierManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/purchase-orders"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_INVENTORY]}>
                <PurchaseOrderView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sales-returns"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE, ROLE_CASHIER]}>
                <SalesReturnView />
              </ProtectedRoute>
            }
          />

          <Route path="/customer-display" element={<CustomerDisplay />} />

          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE]}>
                <BillingDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute allowedRoles={[TENANT_OWNER_ROLE, ROLE_MANAGER, PLATFORM_ADMIN_ROLE]}>
                <SubscriptionPricing />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
