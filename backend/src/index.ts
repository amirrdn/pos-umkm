import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { authMiddleware } from './middlewares/authMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';
import { requireRole } from './middlewares/roleMiddleware';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import transactionRoutes from './routes/transactionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import shiftRoutes from './routes/shiftRoutes';
import staffRoutes from './routes/staffRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import customerRoutes from './routes/customerRoutes';


// Inisialisasi konfigurasi dari file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Aktifkan CORS untuk mengizinkan request dari origin frontend (Vite)
app.use(cors());
app.use(express.json());

// ==========================================
// DAFTAR ROUTE APLIKASI
// ==========================================

// 1. Health check endpoint (Tanpa proteksi tenant dan auth)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend SaaS POS berjalan dengan baik.'
  });
});

// 2. Route Autentikasi Pengguna
app.use('/api/auth', authRoutes);

// 3. Route Pengelolaan Produk (CRUD lengkap)
app.use('/api/products', productRoutes);

// 4. Route Transaksi Checkout Kasir
app.use('/api/transactions', transactionRoutes);

// 5. Route Analitik Laporan
app.use('/api/analytics', analyticsRoutes);

// 6. Route Manajemen Shift Kasir
app.use('/api/shifts', shiftRoutes);

// 7. Route Manajemen Karyawan & Staf
app.use('/api/staff', staffRoutes);

// 8. Route Manajemen Inventaris (Kartu Stok & Mutasi)
app.use('/api/inventory', inventoryRoutes);

// 9. Route Manajemen Pelanggan (Database & Membership)
app.use('/api/customers', customerRoutes);


// 5. Route Admin khusus (Dashboard) - Menggunakan JWT auth dan role-checking
app.get(
  '/api/admin/dashboard',
  authMiddleware,
  tenantMiddleware,
  requireRole(['TENANT_ADMIN']),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Selamat datang di Dashboard Admin Tenant.',
      tenantId: req.tenantId,
      user: req.user
    });
  }
);

// Mulai jalankan Express server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server POS Multi-Tenant berjalan di port: ${PORT}`);
  console.log(`====================================================`);
});
