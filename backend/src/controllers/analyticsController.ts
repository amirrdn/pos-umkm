import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  /**
   * Mengambil summary laporan penjualan tenant (Pendapatan Hari Ini, Pendapatan Bulan Ini, Total Transaksi Hari Ini).
   */
  async getSummary(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      let outletId = req.outletId;
      if (req.isGlobalAdmin) {
        outletId = (req.query.outletId as string) || req.outletId || null;
      }
      const summary = await analyticsService.getSummary(tenantId, outletId);

      return res.status(200).json({
        success: true,
        message: 'Rangkuman analitik berhasil diambil.',
        data: summary
      });
    } catch (error: any) {
      console.error('GetSummary Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil rangkuman analitik.'
      });
    }
  }

  /**
   * Mengambil daftar 5 produk terlaris untuk tenant saat ini.
   */
  async getBestSellers(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      let outletId = req.outletId;
      if (req.isGlobalAdmin) {
        outletId = (req.query.outletId as string) || req.outletId || null;
      }
      const bestSellers = await analyticsService.getBestSellers(tenantId, outletId);

      return res.status(200).json({
        success: true,
        message: 'Daftar produk terlaris berhasil diambil.',
        data: bestSellers
      });
    } catch (error: any) {
      console.error('GetBestSellers Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil data produk terlaris.'
      });
    }
  }

  /**
   * Mengambil tren pendapatan dan laba bersih 30 hari terakhir.
   */
  async getTrend(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      let outletId = req.outletId;
      if (req.isGlobalAdmin) {
        outletId = (req.query.outletId as string) || req.outletId || null;
      }
      const trend = await analyticsService.getRevenueAndProfitTrend(tenantId, outletId);

      return res.status(200).json({
        success: true,
        message: 'Tren analitik berhasil diambil.',
        data: trend
      });
    } catch (error: any) {
      console.error('GetTrend Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server saat mengambil data tren analitik.'
      });
    }
  }

  async getCashierReports(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      let outletId = req.outletId;
      if (req.isGlobalAdmin) {
        outletId = (req.query.outletId as string) || req.outletId || null;
      }
      const reports = await analyticsService.getCashierReports(tenantId, outletId);

      return res.status(200).json({
        success: true,
        message: 'Laporan kasir berhasil diambil.',
        data: reports
      });
    } catch (error: any) {
      console.error('GetCashierReports Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil laporan kasir.'
      });
    }
  }

  async getShiftReports(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      let outletId = req.outletId;
      if (req.isGlobalAdmin) {
        outletId = (req.query.outletId as string) || req.outletId || null;
      }
      const reports = await analyticsService.getShiftReports(tenantId, outletId);

      return res.status(200).json({
        success: true,
        message: 'Laporan shift berhasil diambil.',
        data: reports
      });
    } catch (error: any) {
      console.error('GetShiftReports Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil laporan shift.'
      });
    }
  }
}

