import type { TransactionData } from '../../components/ReceiptTemplate';
import type { PosTransactionStatus } from '../../api/posApi';
import { API_BASE_URL } from '../../config';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  imageUrl: string;
}

export interface ProductApiImage {
  url: string;
  isMain?: boolean;
}

export interface PosReceiptTransaction extends TransactionData {
  cashierName?: string;
  tenantName?: string;
  customer?: (NonNullable<TransactionData['customer']> & { phone?: string | null }) | null;
}

export function toReceiptTransaction(
  tx: PosTransactionStatus,
  extras: { paymentMethod: string; cashierName?: string; tenantName?: string }
): PosReceiptTransaction {
  const customer = tx.customer as
    | (NonNullable<PosTransactionStatus['customer']> & { phone?: string | null })
    | null
    | undefined;

  return {
    invoiceNumber: tx.invoiceNumber,
    createdAt: tx.createdAt ?? new Date().toISOString(),
    grandTotal: Number(tx.grandTotal),
    paymentMethod: extras.paymentMethod,
    items: (tx.items ?? []).map((item) => ({
      quantity: item.quantity,
      priceAtTransaction: Number(item.priceAtTransaction ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      product: item.product
        ? { name: item.product.name, sku: item.product.sku ?? '' }
        : undefined,
    })),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          points: customer.points ?? 0,
          phone: customer.phone ?? null,
        }
      : null,
    cashierName: extras.cashierName,
    tenantName: extras.tenantName,
  };
}

export function buildProductAssetUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
