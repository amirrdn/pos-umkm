import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { createSubscriptionUpgradeInvoice } from '../services/subscriptionUpgradeService';
import { processSubscriptionMidtransWebhook } from '../services/subscriptionMidtransWebhookService';
import { upgradeSubscriptionSchema, midtransWebhookSchema } from '../schemas/subscriptionSchema';
import { getErrorMessage } from '../lib/errors';
import { logError } from '../lib/logger';

export async function getActiveSubscription(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const details = await SubscriptionService.getSubscriptionDetails(tenantId, {
      bypassLimits: req.isPlatformAdmin,
    });

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error: unknown) {
    logError('getActiveSubscription', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal mengambil informasi langganan.'),
    });
  }
}

export async function upgradeSubscription(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;

    const validation = upgradeSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validasi paket upgrade gagal.',
        errors: validation.error.format(),
      });
    }

    const invoice = await createSubscriptionUpgradeInvoice(tenantId, validation.data.tier);

    return res.status(201).json({
      success: true,
      message: 'Invoice pembayaran langganan berhasil dibuat.',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        snapToken: invoice.paymentToken,
        snapUrl: invoice.paymentUrl,
      },
    });
  } catch (error: unknown) {
    logError('upgradeSubscription', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memproses inisiasi upgrade langganan.'),
    });
  }
}

export async function processMidtransWebhook(req: Request, res: Response) {
  try {
    const validation = midtransWebhookSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Format payload callback webhook tidak sesuai.',
      });
    }

    await processSubscriptionMidtransWebhook(validation.data);

    return res.status(200).json({
      success: true,
      message: 'Notifikasi pembayaran langganan berhasil diproses.',
    });
  } catch (error: unknown) {
    logError('processMidtransWebhook', error);
    return res.status(400).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memproses notifikasi webhook pembayaran.'),
    });
  }
}

export async function downgradeSubscription(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.id;

    await SubscriptionService.downgradeToFree(tenantId, userId);

    return res.status(200).json({
      success: true,
      message: 'Paket langganan berhasil diturunkan ke paket GRATIS secara aman.',
    });
  } catch (error: unknown) {
    logError('downgradeSubscription', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal memproses perubahan paket ke gratis.'),
    });
  }
}

export async function getInvoices(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const invoices = await SubscriptionService.getInvoices(tenantId);

    return res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error: unknown) {
    logError('getInvoices', error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, 'Gagal mengambil riwayat tagihan.'),
    });
  }
}
