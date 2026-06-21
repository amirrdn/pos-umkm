import crypto from 'crypto';
import {
  getMidtransCoreApiBaseUrl,
  getMidtransServerKey,
  getMidtransSnapApiBaseUrl,
} from '../lib/midtransConfig';
import { midtransRequest } from '../lib/midtransHttp';

export interface MidtransQrisChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status: string;
  actions?: {
    name: string;
    method: string;
    url: string;
  }[];
  qr_string?: string;
  acquirer?: string;
  message?: string;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
  message?: string;
}

export interface MidtransStatusResponse {
  transaction_status: string;
  status_code?: string;
  status_message?: string;
  payment_type?: string;
  transaction_time?: string;
  gross_amount?: string;
  bank?: string;
  va_numbers?: { bank: string; va_number: string }[];
  biller_code?: string;
  bill_key?: string;
  fraud_status?: string;
  currency?: string;
  order_id?: string;
}

export class MidtransService {
  /**
   * Meng-charge QRIS Dinamis ke Midtrans Core API.
   * Mengembalikan URL gambar QR Code untuk di-scan.
   */
  static async createQrisCharge(orderId: string, grossAmount: number): Promise<{ qrisUrl: string; qrString: string }> {
    const payload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      qris: {
        acquirer: 'gopay',
      },
    };

    try {
      const data = await midtransRequest<MidtransQrisChargeResponse>(
        getMidtransCoreApiBaseUrl(),
        '/charge',
        { method: 'POST', body: JSON.stringify(payload) }
      );

      const qrisAction = (data.actions ?? []).find((act) => act.name === 'generate-qr-code');
      if (!qrisAction?.url) {
        throw new Error('Midtrans tidak mengembalikan url QRIS.');
      }

      return {
        qrisUrl: qrisAction.url,
        qrString: data.qr_string ?? '',
      };
    } catch (error: unknown) {
      console.error('Midtrans Charge Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Integrasi Midtrans Gagal: ${message}`);
    }
  }

  /**
   * Membuat transaksi Snap Midtrans untuk langganan.
   * Mengembalikan token dan redirect_url.
   */
  static async createSnapTransaction(
    orderId: string,
    grossAmount: number
  ): Promise<{ token: string; redirectUrl: string }> {
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      credit_card: {
        secure: true,
      },
    };

    try {
      const data = await midtransRequest<MidtransSnapResponse>(
        getMidtransSnapApiBaseUrl(),
        '/transactions',
        { method: 'POST', body: JSON.stringify(payload) }
      );

      return {
        token: data.token,
        redirectUrl: data.redirect_url,
      };
    } catch (error: unknown) {
      console.error('Midtrans Snap Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Integrasi Midtrans Snap Gagal: ${message}`);
    }
  }

  /**
   * Memvalidasi kecocokan signature key notification Midtrans.
   */
  static verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
    const serverKey = getMidtransServerKey();
    const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const hash = crypto.createHash('sha512').update(rawString).digest('hex');
    return hash === signatureKey;
  }

  /**
   * Mengecek status transaksi secara langsung ke Midtrans API.
   */
  static async getTransactionStatus(orderId: string): Promise<string> {
    const data = await this.getFullTransactionStatus(orderId);
    return data.transaction_status;
  }

  /**
   * Mengambil seluruh data status transaksi dari Midtrans API.
   */
  static async getFullTransactionStatus(orderId: string): Promise<MidtransStatusResponse> {
    const data = await midtransRequest<MidtransStatusResponse>(
      getMidtransCoreApiBaseUrl(),
      `/${orderId}/status`,
      { method: 'GET' }
    );

    return data;
  }
}
