import express, { Request, Response } from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import { pingRedis } from './lib/redis';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from './middlewares/authMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';
import { requireRole } from './middlewares/roleMiddleware';
import { startNotificationSchedulers } from './lib/notificationScheduler';
import { startQueueWorkers } from './lib/queue';
import { logInfo } from './lib/logger';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import transactionRoutes from './routes/transactionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import shiftRoutes from './routes/shiftRoutes';
import staffRoutes from './routes/staffRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import customerRoutes from './routes/customerRoutes';
import categoryRoutes from './routes/categoryRoutes';
import outletRoutes from './routes/outletRoutes';
import transferRoutes from './routes/transferRoutes';
import notificationRoutes from './routes/notificationRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import platformRoutes from './routes/platformRoutes';
import supplierRoutes from './routes/supplierRoutes';
import poRoutes from './routes/poRoutes';
import salesReturnRoutes from './routes/salesReturnRoutes';
import { checkSubscriptionStatus } from './middlewares/subscriptionGuard';
import { errorHandler } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/apiRateLimiter';
import { getJwtSecret } from './lib/jwtConfig';


dotenv.config();

getJwtSecret();

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.set('trust proxy', 1);
}

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const defaultLocalOrigins = process.env.NODE_ENV === 'production'
  ? []
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const corsOrigins = Array.from(new Set([...configuredOrigins, ...defaultLocalOrigins]));

app.use('/uploads', express.static(uploadsDir));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(checkSubscriptionStatus);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/register-staff', authLimiter);
app.use('/api/auth/resend-verification', authLimiter);
app.use('/api/auth/google', authLimiter);

app.use('/api', apiRateLimiter);

app.get('/health', async (_req, res) => {
  const redisOk = await pingRedis();
  res.status(200).json({
    status: 'ok',
    redis: process.env.REDIS_ENABLED === 'true' ? (redisOk ? 'up' : 'down') : 'disabled',
  })
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

app.use('/api/outlets', outletRoutes);

app.use('/api/stock-transfers', transferRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/subscriptions', subscriptionRoutes);

app.use('/api/platform', platformRoutes);

app.use('/api/suppliers', supplierRoutes);

app.use('/api/purchase-orders', poRoutes);

app.use('/api/sales-returns', salesReturnRoutes);

app.get(
  '/api/admin/dashboard',
  authMiddleware,
  tenantMiddleware,
  requireRole(['Owner', 'Manager', 'Admin']),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Selamat datang di Dashboard Admin Tenant.',
      tenantId: req.tenantId,
      user: req.user
    });
  }
);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  startNotificationSchedulers();
  startQueueWorkers();
  logInfo('server', `Server berjalan di port ${PORT}`);

  void pingRedis().then((ok) => {
    if (process.env.REDIS_ENABLED === 'true') {
      logInfo('redis', ok ? 'Redis OK' : 'Redis unavailable - fallback to DB');
    }
  })
});

server.timeout = 300000;
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;
