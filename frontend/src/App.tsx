import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, isPlatformAdmin } from './store/useAuthStore';
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
  PlatformConsoleLayout,
  PlatformDashboard,
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
} from './routes/lazyPages';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user && isPlatformAdmin(user.roles)) {
    return <Navigate to="/platform" replace />;
  }

  if (allowedRoles && user) {
    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      if (user.roles.includes('Staf Gudang')) {
        return <Navigate to="/admin/inventory" replace />;
      }
      return <Navigate to="/pos" replace />;
    }
  }

  return <>{children}</>;
};

const PlatformRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token) {
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
  const token = useAuthStore((state) => state.token);
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
            element={token ? <Navigate to={defaultAuthedPath} replace /> : <LandingPage />}
          />

          <Route
            path="/register"
            element={token ? <Navigate to={defaultAuthedPath} replace /> : <RegisterView />}
          />

          <Route path="/verify-email" element={<VerifyEmailView />} />

          <Route
            path="/login"
            element={token ? <Navigate to={defaultAuthedPath} replace /> : <LoginView />}
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
            <Route path="tenants" element={<PlatformTenantsView />} />
            <Route path="tenants/:tenantId" element={<PlatformTenantDetailView />} />
            <Route path="billing" element={<PlatformBillingView />} />
          </Route>

          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Kasir']}>
                <PosView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos/history"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Kasir']}>
                <TransactionHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Staf Gudang']}>
                <ProductMaster />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Staf Gudang']}>
                <CategoryMaster />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
                <StaffManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Staf Gudang']}>
                <InventoryView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Kasir']}>
                <CustomerManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/outlets"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
                <OutletManagementView />
              </ProtectedRoute>
            }
          />

          <Route path="/customer-display" element={<CustomerDisplay />} />

          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
                <BillingDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
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
