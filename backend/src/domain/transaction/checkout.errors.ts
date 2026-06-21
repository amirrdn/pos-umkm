export type CheckoutErrorCode =
  | 'OUTLET_REQUIRED'
  | 'PRODUCT_NOT_FOUND'
  | 'STOCK_INSUFFICIENT'
  | 'CUSTOMER_NOT_FOUND'
  | 'CUSTOMER_REQUIRED_FOR_DEBT'
  | 'SHIFT_INVALID'
  | 'LIMIT_EXCEEDED'
  | 'TIER_INSUFFICIENT'
  | 'VALIDATION_FAILED'
  | 'QRIS_CHARGE_FAILED'
  | 'INTERNAL_ERROR';

/**
 * Error bisnis terstruktur untuk alur checkout POS.
 * Dipetakan ke HTTP status di controller/service.
 */
export class CheckoutError extends Error {
  readonly code: CheckoutErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code: CheckoutErrorCode,
    httpStatus = 400,
    details?: unknown
  ) {
    super(message);
    this.name = 'CheckoutError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export function isCheckoutError(error: unknown): error is CheckoutError {
  return error instanceof CheckoutError;
}

/**
 * Map legacy Error message dari controller lama ke CheckoutError.
 * Dipakai sementara selama migrasi bertahap dari transactionController.
 */
export function toCheckoutError(error: unknown): CheckoutError | null {
  if (error instanceof CheckoutError) {
    return error;
  }

  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message;
  if (message.includes('Outlet aktif')) {
    return new CheckoutError(message, 'OUTLET_REQUIRED');
  }
  if (message.includes('tidak ditemukan')) {
    return new CheckoutError(message, 'PRODUCT_NOT_FOUND');
  }
  if (message.includes('stok') || message.includes('Stok')) {
    return new CheckoutError(message, 'STOCK_INSUFFICIENT');
  }
  if (message.includes('Pelanggan')) {
    return new CheckoutError(message, 'CUSTOMER_NOT_FOUND');
  }
  if (message.includes('Shift')) {
    return new CheckoutError(message, 'SHIFT_INVALID');
  }

  return null;
}
