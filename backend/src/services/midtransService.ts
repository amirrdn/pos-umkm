import crypto from 'crypto';

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
  [key: string]: any;
}

export class MidtransService {
  private static getServerKey() {
    return process.env.MIDTRANS_SERVER_KEY || 'Mid-server-NhCmZFQENLUx_vuLFj-AHwHq';
  }

  private static getApiBaseUrl() {
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    return isProd ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2';
  }

  /**
   * Meng-charge QRIS Dinamis ke Midtrans Core API.
   * Mengembalikan URL gambar QR Code untuk di-scan.
   */
  static async createQrisCharge(orderId: string, grossAmount: number): Promise<{ qrisUrl: string; qrString: string }> {
    const serverKey = this.getServerKey();
    const baseUrl = this.getApiBaseUrl();
    const authHeader = Buffer.from(serverKey + ':').toString('base64');

    const payload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount)
      },
      qris: {
        acquirer: 'gopay'
      }
    };


    try {
      const response = await fetch(`${baseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as MidtransQrisChargeResponse;

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghubungi server Midtrans.');
      }
      const actions = data.actions || [];
      const qrisAction = actions.find((act) => act.name === 'generate-qr-code');
      if (!qrisAction || !qrisAction.url) {
        throw new Error('Midtrans tidak mengembalikan url QRIS.');
      }

      return {
        qrisUrl: qrisAction.url,
        qrString: data.qr_string || ''
      };
    } catch (error: any) {
      console.error('Midtrans Charge Error:', error);
      throw new Error(`Integrasi Midtrans Gagal: ${error.message}`);
    }
  }

  /**
   * Membuat transaksi Snap Midtrans untuk langganan.
   * Mengembalikan token dan redirect_url.
   */
  static async createSnapTransaction(orderId: string, grossAmount: number): Promise<{ token: string; redirectUrl: string }> {
    const serverKey = this.getServerKey();
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProd ? 'https://app.midtrans.com/snap/v1' : 'https://app.sandbox.midtrans.com/snap/v1';
    const authHeader = Buffer.from(serverKey + ':').toString('base64');

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount)
      },
      credit_card: {
        secure: true
      }
    };

    try {
      const response = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as MidtransSnapResponse;

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghubungi server Snap Midtrans.');
      }

      return {
        token: data.token,
        redirectUrl: data.redirect_url
      };
    } catch (error: any) {
      console.error('Midtrans Snap Error:', error);
      throw new Error(`Integrasi Midtrans Snap Gagal: ${error.message}`);
    }
  }

  /**
   * Memvalidasi kecocokan signature key notification Midtrans.
   */
  static verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
    const serverKey = this.getServerKey();

    const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const hash = crypto.createHash('sha512').update(rawString).digest('hex');

    return hash === signatureKey;
  }

  /**
   * Mengecek status transaksi secara langsung ke Midtrans API.
   */
  static async getTransactionStatus(orderId: string): Promise<string> {
    const serverKey = this.getServerKey();
    const baseUrl = this.getApiBaseUrl();
    const authHeader = Buffer.from(serverKey + ':').toString('base64');

    const response = await fetch(`${baseUrl}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${authHeader}`
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengecek status ke Midtrans: ${response.statusText}`);
    }

    const data = (await response.json()) as MidtransStatusResponse;
    return data.transaction_status;
  }
}
