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

/**
 * Route POST /api/auth/register-staff
 * Deskripsi: Pendaftaran staf ke dalam tenant. Menunggu persetujuan Admin.
 */
router.post('/register-staff', authController.registerStaff.bind(authController));

router.get('/tenants', authController.getTenants.bind(authController));
router.get('/tenants/:tenantId/outlets', authController.getTenantOutlets.bind(authController));

/**
 * Route POST /api/auth/verify-email
 * Deskripsi: Aktivasi akun dengan token dari email verifikasi.
 */
router.post('/verify-email', authController.verifyEmail.bind(authController));

/**
 * Route POST /api/auth/resend-verification
 * Deskripsi: Kirim ulang email verifikasi akun.
 */
router.post('/resend-verification', authController.resendVerification.bind(authController));

export default router;
