import { Router } from 'express';
import {
  getTenantOutlets,
  getTenants,
  googleLogin,
  login,
  logout,
  register,
  registerStaff,
  resendVerification,
  verifyEmail,
} from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.post('/register-staff', registerStaff);
router.post('/google', googleLogin);
router.get('/tenants', getTenants);
router.get('/tenants/:tenantId/outlets', getTenantOutlets);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;
