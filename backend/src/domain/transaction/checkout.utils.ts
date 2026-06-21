/**
 * Menghasilkan nomor invoice unik untuk transaksi POS.
 */
export function generateCheckoutInvoiceNumber(now: Date = new Date()): string {
  const today = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${today}-${now.getTime()}-${randomSuffix}`;
}
