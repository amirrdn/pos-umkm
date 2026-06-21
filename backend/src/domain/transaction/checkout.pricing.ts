import { Prisma } from '@prisma/client';

export interface PricingLineItem {
  unitPrice: Prisma.Decimal | number | string;
  quantity: number;
}

export interface CheckoutPricingInput {
  lineItems: PricingLineItem[];
  discountType?: 'PERCENT' | 'NOMINAL';
  discountValue?: number;
  applyTax?: boolean;
}

export interface CheckoutPricingBreakdown {
  subTotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  taxableAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
}

const TAX_RATE = new Prisma.Decimal(0.11);

/**
 * Menjumlahkan subtotal dari daftar item (harga × qty).
 */
export function sumLineItemsSubtotal(lineItems: PricingLineItem[]): Prisma.Decimal {
  return lineItems.reduce((total, item) => {
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    return total.add(unitPrice.mul(item.quantity));
  }, new Prisma.Decimal(0));
}

/**
 * Menghitung diskon, PPN 11%, dan grand total checkout.
 * Logika identik dengan transactionController.checkout() saat ini.
 */
export function computeCheckoutPricing(input: CheckoutPricingInput): CheckoutPricingBreakdown {
  const subTotal = sumLineItemsSubtotal(input.lineItems);

  let discountAmount = new Prisma.Decimal(0);
  if (input.discountType === 'PERCENT' && input.discountValue && input.discountValue > 0) {
    discountAmount = subTotal.mul(new Prisma.Decimal(input.discountValue).div(100));
  } else if (input.discountType === 'NOMINAL' && input.discountValue && input.discountValue > 0) {
    discountAmount = new Prisma.Decimal(input.discountValue);
  }

  if (discountAmount.gt(subTotal)) {
    discountAmount = subTotal;
  }

  const taxableAmount = subTotal.sub(discountAmount);
  const taxAmount = input.applyTax ? taxableAmount.mul(TAX_RATE) : new Prisma.Decimal(0);
  const grandTotal = taxableAmount.add(taxAmount);

  return {
    subTotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}

/**
 * Poin loyalty: 1 poin per Rp 10.000 (floor).
 */
export function computeEarnedPoints(grandTotal: Prisma.Decimal): number {
  return Math.floor(grandTotal.toNumber() / 10000);
}
