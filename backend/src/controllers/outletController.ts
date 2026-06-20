import { Request, Response } from 'express';
import { OutletService } from '../services/outletService';
import { createBranchSchema, updateOutletSchema } from '../schemas/outletSchema';
import { SubscriptionService } from '../services/subscriptionService';

const outletService = new OutletService();

export class OutletController {
  async getAllOutlets(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const operationalOnly = req.query.operationalOnly === 'true';
      const outlets = await outletService.getAllOutlets(tenantId, operationalOnly);

      return res.status(200).json({
        success: true,
        message: 'Daftar outlet berhasil diambil.',
        data: outlets
      });
    } catch (error: any) {
      console.error('GetAllOutlets Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil daftar outlet.'
      });
    }
  }

  async getOutletById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id;
      const outlet = await outletService.getOutletById(tenantId, id);

      return res.status(200).json({
        success: true,
        message: 'Detail outlet berhasil diambil.',
        data: outlet
      });
    } catch (error: any) {
      console.error('GetOutletById Controller Error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Outlet tidak ditemukan.'
      });
    }
  }

  async getOutletHierarchy(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const hierarchy = await outletService.getOutletHierarchy(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Hierarki outlet berhasil diambil.',
        data: hierarchy
      });
    } catch (error: any) {
      console.error('GetOutletHierarchy Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil hierarki outlet.'
      });
    }
  }

  async getMainOutlet(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const outlet = await outletService.getMainOutlet(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Outlet utama berhasil diambil.',
        data: outlet
      });
    } catch (error: any) {
      console.error('GetMainOutlet Controller Error:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Outlet utama tidak ditemukan.'
      });
    }
  }

  async createBranch(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const validation = createBranchSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi data cabang gagal.',
          errors: validation.error.format()
        });
      }

      // Periksa batas kuota outlet
      const canCreateOutlet = await SubscriptionService.checkOutletLimit(tenantId);
      if (!canCreateOutlet) {
        return res.status(403).json({
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: 'Batas maksimal kapasitas outlet/cabang untuk paket Anda telah tercapai. Silakan lakukan upgrade untuk menambah cabang baru.'
        });
      }

      const outlet = await outletService.createBranch(tenantId, validation.data);

      return res.status(201).json({
        success: true,
        message: 'Cabang baru berhasil didaftarkan.',
        data: outlet
      });
    } catch (error: any) {
      console.error('CreateBranch Controller Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan internal server saat membuat cabang.'
      });
    }
  }

  async updateMainOutlet(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const validation = updateOutletSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi pembaruan data outlet utama gagal.',
          errors: validation.error.format()
        });
      }

      const outlet = await outletService.updateMainOutlet(tenantId, validation.data);

      return res.status(200).json({
        success: true,
        message: 'Informasi outlet utama berhasil diperbarui.',
        data: outlet
      });
    } catch (error: any) {
      console.error('UpdateMainOutlet Controller Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui data outlet utama.'
      });
    }
  }

  async updateOutlet(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id;
      const validation = updateOutletSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Validasi pembaruan data outlet gagal.',
          errors: validation.error.format()
        });
      }

      const outlet = await outletService.updateOutlet(tenantId, id, validation.data);

      return res.status(200).json({
        success: true,
        message: 'Informasi outlet berhasil diperbarui.',
        data: outlet
      });
    } catch (error: any) {
      console.error('UpdateOutlet Controller Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui data outlet.'
      });
    }
  }

  async deleteOutlet(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = req.params.id;

      await outletService.deleteOutlet(tenantId, id);

      return res.status(200).json({
        success: true,
        message: 'Outlet berhasil dihapus secara halus.'
      });
    } catch (error: any) {
      console.error('DeleteOutlet Controller Error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gagal menghapus data outlet.'
      });
    }
  }
}
