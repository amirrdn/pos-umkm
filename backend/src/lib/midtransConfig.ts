/**
 * Membaca Midtrans server key dari environment — fail fast jika tidak diset.
 */
export function getMidtransServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) {
    throw new Error(
      'MIDTRANS_SERVER_KEY environment variable is required. Set it in backend/.env (see .env.example).'
    );
  }
  return key;
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

export function getMidtransCoreApiBaseUrl(): string {
  return isMidtransProduction()
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';
}

export function getMidtransSnapApiBaseUrl(): string {
  return isMidtransProduction()
    ? 'https://app.midtrans.com/snap/v1'
    : 'https://app.sandbox.midtrans.com/snap/v1';
}
