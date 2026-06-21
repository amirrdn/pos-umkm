import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { createSubscriptionUpgradeInvoice } from '../services/subscriptionUpgradeService';
import { processSubscriptionMidtransWebhook } from '../services/subscriptionMidtransWebhookService';
import { upgradeSubscriptionSchema, midtransWebhookSchema } from '../schemas/subscriptionSchema';

export class SubscriptionController {
  /**
   * Mendapatkan detail paket langganan dan sisa limit kapasitas data tenant.
   */
  async getActiveSubscription(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const details = await SubscriptionService.getSubscriptionDetails(tenantId, {
        bypassLimits: req.isPlatformAdmin,
      });

      return res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error: any) {
      console.error('GetActiveSubscription Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil informasi langganan.',
      });
    }
  }

  /**
   * Menginisiasi checkout upgrade paket dengan Midtrans.
   */
  async upgradeSubscription(req: Request, res: Response) {
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

      const invoice = await createSubscriptionUpgradeInvoice(
        tenantId,
        validation.data.tier
      );

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
    } catch (error: any) {
      console.error('UpgradeSubscription Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal memproses inisiasi upgrade langganan.',
      });
    }
  }

  /**
   * Endpoint Webhook Publik untuk notifikasi asinkron Midtrans.
   */
  async processMidtransWebhook(req: Request, res: Response) {
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
      console.error('Subscription Webhook Controller Error:', error);
      const message =
        error instanceof Error ? error.message : 'Gagal memproses notifikasi webhook pembayaran.';
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Menurunkan tingkat langganan secara manual ke paket FREE.
   */
  async downgradeSubscription(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id;

      await SubscriptionService.downgradeToFree(tenantId, userId);

      return res.status(200).json({
        success: true,
        message: 'Paket langganan berhasil diturunkan ke paket GRATIS secara aman.',
      });
    } catch (error: any) {
      console.error('DowngradeSubscription Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal memproses perubahan paket ke gratis.',
      });
    }
  }

  /**
   * Mengambil riwayat tagihan invoice untuk tenant saat ini.
   */
  async getInvoices(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const invoices = await SubscriptionService.getInvoices(tenantId);

      return res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error: any) {
      console.error('GetInvoices Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil riwayat tagihan.',
      });
    }
  }
}
export const subscriptionController = new SubscriptionController();
