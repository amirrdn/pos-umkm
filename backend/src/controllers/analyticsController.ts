import { logError } from '../lib/logger';
import { Request, Response } from 'express';
import { resolveAnalyticsOutletId } from '../domain/analytics';
import { AnalyticsService } from '../services/analyticsService';

const analyticsService = new AnalyticsService();

export async function getSummary(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const outletId = resolveAnalyticsOutletId(req);
    const summary = await analyticsService.getSummary(tenantId, outletId);

    return res.status(200).json({
      success: true,
      message: 'Rangkuman analitik berhasil diambil.',
      data: summary,
    });
  } catch (error: unknown) {
    logError('GetSummary Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil rangkuman analitik.',
    });
  }
}

export async function getBestSellers(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const outletId = resolveAnalyticsOutletId(req);
    const bestSellers = await analyticsService.getBestSellers(tenantId, outletId);

    return res.status(200).json({
      success: true,
      message: 'Daftar produk terlaris berhasil diambil.',
      data: bestSellers,
    });
  } catch (error: unknown) {
    logError('GetBestSellers Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil data produk terlaris.',
    });
  }
}

export async function getTrend(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const outletId = resolveAnalyticsOutletId(req);
    const trend = await analyticsService.getRevenueAndProfitTrend(tenantId, outletId);

    return res.status(200).json({
      success: true,
      message: 'Tren analitik berhasil diambil.',
      data: trend,
    });
  } catch (error: unknown) {
    logError('GetTrend Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal server saat mengambil data tren analitik.',
    });
  }
}

export async function getCashierReports(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const outletId = resolveAnalyticsOutletId(req);
    const reports = await analyticsService.getCashierReports(tenantId, outletId);

    return res.status(200).json({
      success: true,
      message: 'Laporan kasir berhasil diambil.',
      data: reports,
    });
  } catch (error: unknown) {
    logError('GetCashierReports Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan kasir.',
    });
  }
}

export async function getShiftReports(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const outletId = resolveAnalyticsOutletId(req);
    const reports = await analyticsService.getShiftReports(tenantId, outletId);

    return res.status(200).json({
      success: true,
      message: 'Laporan shift berhasil diambil.',
      data: reports,
    });
  } catch (error: unknown) {
    logError('GetShiftReports Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan shift.',
    });
  }
}

export async function getBreakdown(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const data = await analyticsService.getOutletBreakdown(tenantId);

    return res.status(200).json({
      success: true,
      message: 'Breakdown penjualan per outlet berhasil diambil.',
      data,
    });
  } catch (error: unknown) {
    logError('GetBreakdown Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil breakdown outlet.',
    });
  }
}
