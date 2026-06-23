import { logError } from '../lib/logger';
import { Request, Response } from 'express';
import { PlatformAnalyticsService } from '../services/platformAnalyticsService';
import { getErrorMessage } from '../lib/errors';

export async function getStaffList(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await PlatformAnalyticsService.getAllStaff(page, limit);

    return res.status(200).json({
      success: true,
      message: 'Berhasil memuat daftar staf.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: unknown) {
    logError('Platform getStaffList Error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memuat daftar staf.'),
    });
  }
}

export async function getPlatformRevenue(_req: Request, res: Response) {
  try {
    const result = await PlatformAnalyticsService.getPlatformRevenue();

    return res.status(200).json({
      success: true,
      message: 'Berhasil memuat data pendapatan platform.',
      data: result,
    });
  } catch (error: unknown) {
    logError('Platform getPlatformRevenue Error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memuat data pendapatan.'),
    });
  }
}

export async function getTopProducts(_req: Request, res: Response) {
  try {
    const result = await PlatformAnalyticsService.getTopProducts();

    return res.status(200).json({
      success: true,
      message: 'Berhasil memuat produk paling laku.',
      data: result,
    });
  } catch (error: unknown) {
    logError('Platform getTopProducts Error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memuat produk paling laku.'),
    });
  }
}
