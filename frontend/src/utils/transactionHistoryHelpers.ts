import type { ReceiptData, TransactionRecord } from '../types/transactionHistory';

export function formatTransactionRupiah(value: number): string {
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
}

export function formatTransactionDateTime(value: string): string {
  return new Date(value).toLocaleString('id-ID');
}

export function getTenantDisplayName(tenantId?: string | null): string {
  return tenantId === 'tenant-uuid-xyz-123' ? 'Toko Utama' : 'UMKM POS';
}

export function filterTransactionsByInvoice(
  transactions: TransactionRecord[],
  searchQuery: string
): TransactionRecord[] {
  const query = searchQuery.toLowerCase();
  return transactions.filter((tx) => tx.invoiceNumber.toLowerCase().includes(query));
}

export function buildReceiptData(
  transaction: TransactionRecord | null,
  user?: { name?: string; tenantId?: string | null } | null
): ReceiptData | null {
  if (!transaction) return null;

  return {
    invoiceNumber: transaction.invoiceNumber,
    createdAt: transaction.createdAt,
    grandTotal: transaction.grandTotal,
    paymentMethod: 'CASH',
    cashierName: user?.name,
    tenantName: getTenantDisplayName(user?.tenantId),
    items: transaction.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      priceAtTransaction: Number(item.priceAtTransaction),
      subtotal: Number(item.subtotal),
      product: {
        name: item.product?.name || 'Produk',
        sku: item.product?.sku || '',
      },
    })),
    subTotal: transaction.subTotal ? Number(transaction.subTotal) : undefined,
    discount: transaction.discount ? Number(transaction.discount) : undefined,
    tax: transaction.tax ? Number(transaction.tax) : undefined,
  };
}

export function buildWhatsAppInvoiceText(
  transaction: TransactionRecord,
  user?: { name?: string; tenantId?: string | null } | null
): string {
  const items = transaction.items || [];
  const itemsText =
    items.length > 0
      ? items
          .map((item) => {
            const productName = item.product?.name || 'Produk';
            const subtotal = item.subtotal || item.quantity * (item.priceAtTransaction || 0);
            return `- ${productName} x${item.quantity}: Rp ${Number(subtotal).toLocaleString('id-ID')}`;
          })
          .join('\n')
      : '-';

  const formattedDate = formatTransactionDateTime(transaction.createdAt);
  const tenantName = getTenantDisplayName(user?.tenantId);
  const paymentDetail = `Metode: ${transaction.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS'}`;

  let customerDetail = '';
  if (transaction.customer) {
    customerDetail = `\n\nPelanggan: ${transaction.customer.name}`;
  }

  return `*INVOICE: ${transaction.invoiceNumber}*
Toko: ${tenantName}
Tanggal: ${formattedDate}
Kasir: ${user?.name || 'Kasir'}

*Daftar Produk:*
${itemsText}

*Total Tagihan: Rp ${Number(transaction.grandTotal).toLocaleString('id-ID')}*
${paymentDetail}${customerDetail}

Terima kasih atas kunjungan Anda!`;
}

export function normalizeWhatsAppPhone(phone: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = `62${cleanPhone.slice(1)}`;
  }
  return cleanPhone;
}

export function openWhatsAppInvoice(
  transaction: TransactionRecord,
  user?: { name?: string; tenantId?: string | null; phone?: string | null } | null
): void {
  const text = buildWhatsAppInvoiceText(transaction, user);
  const phone = transaction.customer?.phone;

  if (phone) {
    const phoneParam = normalizeWhatsAppPhone(phone);
    window.open(`https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(text)}`, '_blank');
    return;
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}
