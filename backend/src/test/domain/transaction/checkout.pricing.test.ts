import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  computeCheckoutPricing,
  computeEarnedPoints,
  sumLineItemsSubtotal,
} from '../../../domain/transaction/checkout.pricing';
import { CheckoutError, isCheckoutError, toCheckoutError } from '../../../domain/transaction/checkout.errors';
import { generateCheckoutInvoiceNumber } from '../../../domain/transaction/checkout.utils';

describe('checkout.pricing', () => {
  it('sums line item subtotals', () => {
    const subTotal = sumLineItemsSubtotal([
      { unitPrice: 10000, quantity: 2 },
      { unitPrice: 5000, quantity: 1 },
    ]);

    expect(subTotal.toNumber()).toBe(25000);
  });

  it('applies percent discount and tax', () => {
    const result = computeCheckoutPricing({
      lineItems: [{ unitPrice: 100000, quantity: 1 }],
      discountType: 'PERCENT',
      discountValue: 10,
      applyTax: true,
    });

    expect(result.subTotal.toNumber()).toBe(100000);
    expect(result.discountAmount.toNumber()).toBe(10000);
    expect(result.taxableAmount.toNumber()).toBe(90000);
    expect(result.taxAmount.toNumber()).toBe(9900);
    expect(result.grandTotal.toNumber()).toBe(99900);
  });

  it('caps nominal discount to subtotal', () => {
    const result = computeCheckoutPricing({
      lineItems: [{ unitPrice: 5000, quantity: 1 }],
      discountType: 'NOMINAL',
      discountValue: 9000,
    });

    expect(result.discountAmount.toNumber()).toBe(5000);
    expect(result.grandTotal.toNumber()).toBe(0);
  });

  it('computes earned loyalty points', () => {
    expect(computeEarnedPoints(new Prisma.Decimal(99999))).toBe(9);
    expect(computeEarnedPoints(new Prisma.Decimal(10000))).toBe(1);
  });
});

describe('checkout.errors', () => {
  it('identifies CheckoutError instances', () => {
    const err = new CheckoutError('Stok habis', 'STOCK_INSUFFICIENT');
    expect(isCheckoutError(err)).toBe(true);
    expect(err.httpStatus).toBe(400);
  });

  it('maps legacy stock error messages', () => {
    const mapped = toCheckoutError(new Error('Stok tidak mencukupi untuk Produk A.'));
    expect(mapped?.code).toBe('STOCK_INSUFFICIENT');
  });
});

describe('checkout.utils', () => {
  it('generates invoice numbers with expected prefix', () => {
    const invoice = generateCheckoutInvoiceNumber(new Date('2026-06-21T10:00:00.000Z'));
    expect(invoice.startsWith('INV-20260621-')).toBe(true);
  });
});
