import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema, registerSchema, registerStaffSchema } from '../schemas/authSchema';

const authService = new AuthService();

/**
 * Controller Layer untuk Autentikasi Pengguna.
 */
export class AuthController {
  /**
   * Meng-handle request HTTP POST untuk login pengguna.
   */
  async login(req: Request, res: Response) {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi input login gagal.',
          errors: validation.error.format()
        });
      }

      const { email, password } = validation.data;

      const result = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        data: result
      });

    } catch (error: any) {
      console.error('Login Controller Error:', error);

      const message = error.message || '';
      if (message.includes('Kredensial') || message.includes('dinonaktifkan')) {
        return res.status(401).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memproses login.'
      });
    }
  }

  /**
   * Meng-handle request HTTP POST untuk registrasi tenant/UMKM baru.
   */
  async register(req: Request, res: Response) {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi input pendaftaran gagal.',
          errors: validation.error.format()
        });
      }

      const result = await authService.registerTenant(validation.data);

      return res.status(201).json({
        success: true,
        message: 'Registrasi toko dan pengguna berhasil.',
        data: result
      });

    } catch (error: any) {
      console.error('Register Controller Error:', error);

      const message = error.message || '';
      if (message.includes('sudah digunakan')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memproses registrasi.'
      });
    }
  }

  /**
   * Meng-handle request HTTP POST untuk registrasi staf ke tenant (PENDING status).
   */
  async registerStaff(req: Request, res: Response) {
    try {
      const validation = registerStaffSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi input pendaftaran staf gagal.',
          errors: validation.error.format()
        });
      }

      const result = await authService.registerStaff(validation.data);

      return res.status(201).json({
        success: true,
        message: 'Registrasi staf berhasil, menunggu persetujuan Admin.',
        data: result
      });

    } catch (error: any) {
      console.error('Register Staff Controller Error:', error);

      const message = error.message || '';
      if (message.includes('sudah digunakan') || message.includes('tidak ditemukan')) {
        return res.status(400).json({
          success: false,
          message: message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat memproses registrasi staf.'
      });
    }
  }

  /**
   * Mengambil daftar tenant untuk keperluan pendaftaran staf.
   */
  async getTenants(_req: Request, res: Response) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      });
      return res.status(200).json({ success: true, data: tenants });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data toko.' });
    }
  }

  /**
   * Mengambil daftar outlet berdasarkan tenant ID untuk pendaftaran staf.
   */
  async getTenantOutlets(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const outlets = await prisma.outlet.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true }
      });
      return res.status(200).json({ success: true, data: outlets });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data outlet.' });
    }
  }
}
