import type { RefObject } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { PosReceiptTransaction } from './posUtils';

interface UsePosPrintOptions {
  printRef: RefObject<HTMLDivElement | null>;
  cashReceived: number | '';
}

export function usePosPrint({ printRef, cashReceived }: UsePosPrintOptions) {
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleSendWhatsApp = (transaction: PosReceiptTransaction) => {
    if (!transaction) return;

    const activeCashReceived = transaction.paymentMethod === 'CASH' ? Number(cashReceived || 0) : 0;
    const activeChange = transaction.paymentMethod === 'CASH' ? Math.max(0, activeCashReceived - transaction.grandTotal) : 0;

    const itemsText = transaction.items
      .map((item) => {
        const pName = item.product?.name || item.name || 'Produk';
        const qty = item.quantity;
        const sub = item.subtotal || (qty * (item.priceAtTransaction || item.price || 0));
        return `- ${pName} x${qty}: Rp ${Number(sub).toLocaleString('id-ID')}`;
      })
      .join('\n');

    const formattedDate = new Date(transaction.createdAt).toLocaleString('id-ID');
    const tenantName = transaction.tenantName || 'UMKM POS';
    const invoiceNum = transaction.invoiceNumber;
    const cashierName = transaction.cashierName || 'Kasir';
    const totalTagihan = Number(transaction.grandTotal).toLocaleString('id-ID');

    let paymentDetail = `Metode: ${transaction.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS'}`;
    if (transaction.paymentMethod === 'CASH') {
      paymentDetail += `\nBayar: Rp ${activeCashReceived.toLocaleString('id-ID')}\nKembali: Rp ${activeChange.toLocaleString('id-ID')}`;
    }

    let customerDetail = '';
    if (transaction.customer) {
      const earned = Math.floor(Number(transaction.grandTotal) / 10000);
      customerDetail = `\n\nPelanggan: ${transaction.customer.name}\nPoin Baru: +${earned} Pts\nTotal Poin: ${transaction.customer.points} Pts`;
    }

    const text = `*INVOICE: ${invoiceNum}*
Toko: ${tenantName}
Tanggal: ${formattedDate}
Kasir: ${cashierName}

*Daftar Produk:*
${itemsText}

*Total Tagihan: Rp ${totalTagihan}*
${paymentDetail}${customerDetail}

Terima kasih atas kunjungan Anda!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return {
    handlePrint,
    handleSendWhatsApp,
  };
}
