import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { LoginView } from './components/LoginView';
import { PosView } from './components/PosView';
import { ProductMaster } from './components/ProductMaster';
import DashboardAdmin from './components/DashboardAdmin';
import LandingPage from './components/LandingPage';
import RegisterView from './components/RegisterView';
import { TransactionHistory } from './components/TransactionHistory';
import { StaffManagementView } from './components/StaffManagementView';
import { InventoryView } from './components/InventoryView';


/**
 * Komponen pembungkus Protected Route.
 * Menjamin hanya pengguna yang memiliki token JWT aktif yang bisa mengakses halaman POS.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    // Alihkan ke login jika token tidak ditemukan
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
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

        {/* Rute Login (dialihkan ke POS jika sudah login) */}
        <Route 
          path="/login" 
          element={
            token ? <Navigate to="/pos" replace /> : <LoginView />
          } 
        />

        {/* Rute POS Terproteksi */}
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute>
              <PosView />
            </ProtectedRoute>
          } 
        />

        {/* Rute Riwayat Transaksi Terproteksi */}
        <Route 
          path="/pos/history" 
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          } 
        />

        {/* Rute Master Produk Terproteksi */}
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute>
              <ProductMaster />
            </ProtectedRoute>
          } 
        />

        {/* Rute Dashboard Analitik Terproteksi */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />

        {/* Rute Kelola Staf Terproteksi */}
        <Route 
          path="/admin/staff" 
          element={
            <ProtectedRoute>
              <StaffManagementView />
            </ProtectedRoute>
          } 
        />

        {/* Rute Kelola Inventaris Terproteksi */}
        <Route 
          path="/admin/inventory" 
          element={
            <ProtectedRoute>
              <InventoryView />
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
