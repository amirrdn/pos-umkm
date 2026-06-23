export type RegistrationErrorCode =
  | 'TENANT_NOT_FOUND'
  | 'OUTLET_REQUIRED'
  | 'INVALID_OUTLET';

export class RegistrationError extends Error {
  readonly code: RegistrationErrorCode;
  readonly httpStatus: number;

  constructor(code: RegistrationErrorCode, message: string, httpStatus = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    Object.setPrototypeOf(this, RegistrationError.prototype);
  }
}

export const REGISTRATION_ERROR_MESSAGES: Record<RegistrationErrorCode, string> = {
  TENANT_NOT_FOUND: 'Tenant tidak ditemukan.',
  OUTLET_REQUIRED: 'Minimal satu outlet harus dipilih.',
  INVALID_OUTLET: 'Salah satu outlet tidak valid untuk toko ini.',
};
