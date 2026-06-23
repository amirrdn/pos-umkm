import rateLimit from 'express-rate-limit';

const skipInTest = () => process.env.NODE_ENV === 'test';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipInTest() || req.path.startsWith('/auth') || req.originalUrl.startsWith('/api/auth'),
});

export const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan checkout dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});
