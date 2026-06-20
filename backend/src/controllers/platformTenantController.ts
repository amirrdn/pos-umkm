import { Request, Response } from 'express';
import { PlatformTenantService } from '../services/platformTenantService';

export class PlatformTenantController {
  async listTenants(_req: Request, res: Response) {
    try {
      const tenants = await PlatformTenantService.listTenants();
      return res.status(200).json({
        success: true,
        message: 'Daftar tenant berhasil diambil.',
        data: tenants,
      });
    } catch (error) {
      console.error('Platform listTenants Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil daftar tenant.',
      });
    }
  }

  async getOverview(_req: Request, res: Response) {
    try {
      const overview = await PlatformTenantService.getOverview();
      return res.status(200).json({
        success: true,
        message: 'Ringkasan platform berhasil diambil.',
        data: overview,
      });
    } catch (error) {
      console.error('Platform getOverview Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil ringkasan platform.',
      });
    }
  }

  async getTenantById(req: Request, res: Response) {
    try {
      const tenant = await PlatformTenantService.getTenantById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Detail tenant berhasil diambil.',
        data: tenant,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tenant tidak ditemukan.';
      console.error('Platform getTenantById Error:', error);
      return res.status(404).json({
        success: false,
        message,
      });
    }
  }
}

export const platformTenantController = new PlatformTenantController();
