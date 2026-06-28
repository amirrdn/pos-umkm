import type { PosModalVisibility } from '../../../types/posModal.types';

export const MODAL_PRIORITY: Record<keyof PosModalVisibility, number> = {
  shiftRequired: 100,
  closeShift: 90,
  checkoutConfirm: 80,
  qris: 70,
  success: 60,
  addCustomer: 50,
  shiftDrawer: 40,
  onboarding: 30,
  help: 20,
};

export const MODAL_LABELS: Record<keyof PosModalVisibility, string> = {
  shiftRequired: 'Buka shift kasir',
  closeShift: 'Tutup shift',
  checkoutConfirm: 'Konfirmasi pembayaran',
  qris: 'Pembayaran QRIS',
  success: 'Transaksi berhasil',
  addCustomer: 'Tambah pelanggan',
  shiftDrawer: 'Ringkasan shift',
  onboarding: 'Panduan POS',
  help: 'Bantuan keyboard',
};

export function getActiveModalKey(visibility: PosModalVisibility): keyof PosModalVisibility | null {
  const open = (Object.keys(visibility) as Array<keyof PosModalVisibility>)
    .filter((key) => visibility[key])
    .sort((a, b) => MODAL_PRIORITY[b] - MODAL_PRIORITY[a]);

  return open[0] ?? null;
}

export function hasOpenModal(visibility: PosModalVisibility): boolean {
  return Object.values(visibility).some(Boolean);
}
