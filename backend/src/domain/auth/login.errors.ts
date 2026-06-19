export type LoginErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'APPROVAL_PENDING'
  | 'ACCOUNT_REJECTED'
  | 'ACCOUNT_DISABLED'
  | 'INVALID_CREDENTIALS';

export class LoginError extends Error {
  readonly code: LoginErrorCode;

  constructor(code: LoginErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  EMAIL_NOT_VERIFIED:
    'Email Anda belum diverifikasi. Buka kotak masuk (termasuk folder Spam), klik tautan aktivasi, lalu coba login kembali.',
  APPROVAL_PENDING:
    'Email sudah diverifikasi. Akun staf Anda masih menunggu persetujuan Owner/Admin toko.',
  ACCOUNT_REJECTED:
    'Pendaftaran akun Anda ditolak. Silakan hubungi administrator toko.',
  ACCOUNT_DISABLED:
    'Akun Anda telah dinonaktifkan. Silakan hubungi administrator toko.',
  INVALID_CREDENTIALS:
    'Email atau kata sandi salah. Periksa kembali kredensial Anda.',
};
