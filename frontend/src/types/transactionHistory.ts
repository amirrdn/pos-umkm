export interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
  };
}

export interface TransactionRecord {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: TransactionItem[];
  subTotal?: number;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  qrisUrl?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
}

export interface ReceiptItemData {
  id: string;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
  };
}

export interface ReceiptData {
  invoiceNumber: string;
  createdAt: string;
  grandTotal: number;
  paymentMethod: string;
  cashierName?: string;
  tenantName?: string;
  items: ReceiptItemData[];
  subTotal?: number;
  discount?: number;
  tax?: number;
}
