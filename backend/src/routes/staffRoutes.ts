import { Router } from 'express';
import { listStaff, listRoles, createStaff, updateStaff, deleteStaff, approveStaff, rejectStaff } from '../controllers/staffController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireRole(['Owner', 'Manager', 'Admin']));

/**
 * GET /api/staff
 * Mengambil seluruh daftar karyawan dalam tenant.
 */
router.get('/', listStaff);

/**
 * GET /api/staff/roles
 * Mengambil semua role yang tersedia untuk dropdown form tambah/ubah karyawan.
 */
router.get('/roles', listRoles);

/**
 * POST /api/staff
 * Menambahkan karyawan baru dengan role yang dipilih.
 */
router.post('/', createStaff);

/**
 * PATCH /api/staff/:id
 * Memperbarui data karyawan: nama, status aktif, atau role.
 */
router.patch('/:id', updateStaff);

/**
 * DELETE /api/staff/:id
 * Soft delete akun karyawan dari tenant.
 */
router.delete('/:id', deleteStaff);

/**
 * PATCH /api/staff/:id/approve
 * Admin menyetujui pendaftaran staf baru.
 */
router.patch('/:id/approve', approveStaff);

/**
 * PATCH /api/staff/:id/reject
 * Admin menolak pendaftaran staf baru.
 */
router.patch('/:id/reject', rejectStaff);

export default router;
