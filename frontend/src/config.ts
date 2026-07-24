// Konfigurasi URL API Backend untuk Lingkungan Produksi dan Pengembangan
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://pos-umkm.onrender.com';
export const API_TIMEOUT_MS = 300000; // 5 Menit

export const MIDTRANS_IS_PRODUCTION =
  import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

export const MIDTRANS_SNAP_SCRIPT_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

/** Client key Snap Midtrans (public) — wajib diset via VITE_MIDTRANS_CLIENT_KEY. */
export function getMidtransClientKey(): string {
  const key = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
  if (!key) {
    throw new Error(
      'VITE_MIDTRANS_CLIENT_KEY environment variable is required. Set it in frontend/.env (see .env.example).'
    );
  }
  return key;
}
