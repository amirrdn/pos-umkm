import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

/**
 * Route POST /api/auth/login
 * Deskripsi: Endpoint autentikasi masuk sistem untuk mendapatkan JWT.
 */
router.post('/login', authController.login.bind(authController));

/**
 * Route POST /api/auth/register
 * Deskripsi: Pendaftaran mandiri tenant/UMKM baru di platform.
 */
router.post('/register', authController.register.bind(authController));

export default router;
