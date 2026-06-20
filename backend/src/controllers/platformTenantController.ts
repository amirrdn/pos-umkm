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

  async updateTenantStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const actorUserId = req.user?.id || 'system-admin';
      
      if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status tidak valid. Gunakan ACTIVE atau SUSPENDED.'
        });
      }

      const result = await PlatformTenantService.updateTenantStatus(
        req.params.id,
        status,
        actorUserId
      );

      return res.status(200).json({
        success: true,
        message: 'Status tenant berhasil diperbarui.',
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memperbarui status tenant.';
      console.error('Platform updateTenantStatus Error:', error);
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  async overrideSubscription(req: Request, res: Response) {
    try {
      const { tier, expiresAt, note } = req.body;
      const actorUserId = req.user?.id || 'system-admin';

      if (!tier || !['FREE', 'GROWTH', 'ENTERPRISE'].includes(tier)) {
        return res.status(400).json({
          success: false,
          message: 'Tier tidak valid. Gunakan FREE, GROWTH, atau ENTERPRISE.'
        });
      }

      let parsedExpiresAt: Date | null = null;
      if (expiresAt) {
        parsedExpiresAt = new Date(expiresAt);
        if (isNaN(parsedExpiresAt.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Format expiresAt tidak valid.'
          });
        }
      }

      const result = await PlatformTenantService.overrideSubscription(
        req.params.id,
        tier,
        parsedExpiresAt,
        actorUserId,
        note
      );

      return res.status(200).json({
        success: true,
        message: 'Langganan tenant berhasil di-override.',
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal meng-override langganan tenant.';
      console.error('Platform overrideSubscription Error:', error);
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }
}

export const platformTenantController = new PlatformTenantController();
