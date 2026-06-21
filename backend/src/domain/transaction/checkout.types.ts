import type { CheckoutInput } from '../../schemas/transactionSchema';

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export interface CheckoutActorContext {
  tenantId: string;
  userId: string;
  outletId: string | null;
  isPlatformAdmin: boolean;
}

export interface CheckoutCommand extends CheckoutInput {
  tenantId: string;
  userId: string;
  outletId: string | null;
  bypassSubscriptionLimits: boolean;
}

export interface ResolvedCheckoutLineItem {
  productId: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface CheckoutPricingResult {
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  taxableAmount: number;
  grandTotal: number;
}

export interface CheckoutTransactionResult {
  transactionId: string;
  invoiceNumber: string;
  paymentMethod: string;
  status: 'PENDING' | 'COMPLETED';
  grandTotal: number;
  qrString?: string;
}
