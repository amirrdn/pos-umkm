import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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
import categoryRoutes from './routes/categoryRoutes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

app.use(cors());
app.use(express.json());

// ==========================================
// DAFTAR ROUTE APLIKASI
// ==========================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend SaaS POS berjalan dengan baik.'
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api/transactions', transactionRoutes);

app.use('/api/analytics', analyticsRoutes);

app.use('/api/shifts', shiftRoutes);

app.use('/api/staff', staffRoutes);

app.use('/api/inventory', inventoryRoutes);

app.use('/api/customers', customerRoutes);

app.use('/api/categories', categoryRoutes);


app.get(
  '/api/admin/dashboard',
  authMiddleware,
  tenantMiddleware,
  requireRole(['Owner', 'TENANT_ADMIN', 'Manager']),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Selamat datang di Dashboard Admin Tenant.',
      tenantId: req.tenantId,
      user: req.user
    });
  }
);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server POS Multi-Tenant berjalan di port: ${PORT}`);
  console.log(`====================================================`);
});
