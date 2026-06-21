import { Request, Response } from 'express';
import { PlatformBillingService } from '../services/platformBillingService';
import { getErrorMessage } from '../lib/errors';

export async function getBillingMetrics(_req: Request, res: Response) {
  try {
    const result = await PlatformBillingService.getMetrics();
    return res.status(200).json({
      success: true,
      message: 'Berhasil memuat metrik billing platform.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform getBillingMetrics Error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memuat metrik billing.'),
    });
  }
}

export async function listInvoices(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await PlatformBillingService.getInvoices(page, limit);

    return res.status(200).json({
      success: true,
      message: 'Berhasil memuat daftar invoice lintas-tenant.',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: unknown) {
    console.error('Platform listInvoices Error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memuat daftar invoice.'),
    });
  }
}

export async function getMidtransDetail(req: Request, res: Response) {
  try {
    const { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return res.status(400).json({ success: false, message: 'invoiceNumber diperlukan.' });
    }

    const result = await PlatformBillingService.getMidtransInvoiceDetail(invoiceNumber);
    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil detail transaksi Midtrans.',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Platform getMidtransDetail Error:', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal mengambil detail transaksi Midtrans.'),
    });
  }
}

