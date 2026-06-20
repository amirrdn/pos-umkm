import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { LoginView } from './components/LoginView';
import { PosView } from './components/PosView';
import { ProductMaster } from './components/ProductMaster';
import { CategoryMaster } from './components/CategoryMaster';
import DashboardAdmin from './components/DashboardAdmin';
import LandingPage from './components/LandingPage';
import RegisterView from './components/RegisterView';
import VerifyEmailView from './components/VerifyEmailView';
import UserDocumentation from './components/UserDocumentation';
import BillingDashboard from './components/BillingDashboard';
import SubscriptionPricing from './components/SubscriptionPricing';
import { TransactionHistory } from './components/TransactionHistory';
import { StaffManagementView } from './components/StaffManagementView';
import { InventoryView } from './components/InventoryView';
import { CustomerManagementView } from './components/CustomerManagementView';
import CustomerDisplay from './components/CustomerDisplay';
import { OutletManagementView } from './components/OutletManagementView';
import { NotificationPoller } from './components/NotificationPoller';


/**
 * Komponen pembungkus Protected Route.
 * Menjamin hanya pengguna yang memiliki token JWT aktif yang bisa mengakses halaman.
 * Opsional melakukan pengecekan hak akses berdasarkan Role.
 */
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token) {
    return <Navigate to="/login" replace />;
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

function App() {
  const token = useAuthStore((state) => state.token);
  const theme = useThemeStore((state) => state.theme);

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
      <Routes>
        {/* Rute Utama (Landing Page jika belum login, POS jika sudah login) */}
        <Route
          path="/"
          element={
            token ? <Navigate to="/pos" replace /> : <LandingPage />
          }
        />

        {/* Rute Register (dialihkan ke POS jika sudah login) */}
        <Route
          path="/register"
          element={
            token ? <Navigate to="/pos" replace /> : <RegisterView />
          }
        />

        {/* Rute Verifikasi Email */}
        <Route path="/verify-email" element={<VerifyEmailView />} />

        {/* Rute Login (dialihkan ke POS jika sudah login) */}
        <Route
          path="/login"
          element={
            token ? <Navigate to="/pos" replace /> : <LoginView />
          }
        />

        {/* Rute Dokumentasi (Publik) */}
        <Route path="/docs" element={<UserDocumentation />} />

        {/* Rute POS Terproteksi (Kasir, Manager, Owner) */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Kasir']}>
              <PosView />
            </ProtectedRoute>
          }
        />

        {/* Rute Riwayat Transaksi Terproteksi (Kasir, Manager, Owner) */}
        <Route
          path="/pos/history"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Kasir']}>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        {/* Rute Master Produk Terproteksi (Staf Gudang, Manager, Owner) */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Staf Gudang']}>
              <ProductMaster />
            </ProtectedRoute>
          }
        />

        {/* Rute Master Kategori Terproteksi (Staf Gudang, Manager, Owner) */}
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Staf Gudang']}>
              <CategoryMaster />
            </ProtectedRoute>
          }
        />

        {/* Rute Dashboard Analitik Terproteksi (Manager, Owner) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        {/* Rute Kelola Staf Terproteksi (Manager, Owner) */}
        <Route
          path="/admin/staff"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
              <StaffManagementView />
            </ProtectedRoute>
          }
        />

        {/* Rute Kelola Inventaris Terproteksi (Staf Gudang, Manager, Owner) */}
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Staf Gudang']}>
              <InventoryView />
            </ProtectedRoute>
          }
        />

        {/* Rute Kelola Pelanggan Terproteksi (Kasir, Manager, Owner) */}
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin', 'Kasir']}>
              <CustomerManagementView />
            </ProtectedRoute>
          }
        />

        {/* Rute Kelola Outlet Terproteksi (Owner, Admin platform) */}
        <Route
          path="/admin/outlets"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
              <OutletManagementView />
            </ProtectedRoute>
          }
        />


        {/* Rute Customer Display - Layar kedua/monitor customer untuk QRIS (Publik, tanpa auth) */}
        <Route path="/customer-display" element={<CustomerDisplay />} />

        {/* Rute Billing Dashboard Terproteksi (Owner, Manager) */}
        <Route
          path="/admin/billing"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
              <BillingDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rute Subscription Pricing Terproteksi (Owner, Manager) */}
        <Route
          path="/admin/pricing"
          element={
            <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Admin']}>
              <SubscriptionPricing />
            </ProtectedRoute>
          }
        />

        {/* Rute tidak dikenal dialihkan ke root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
