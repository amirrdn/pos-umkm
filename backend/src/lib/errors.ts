/** Ambil pesan error dari nilai unknown (catch block). */
export function getErrorMessage(error: unknown, fallback = ''): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

/** Error dengan field opsional statusCode/code (dipakai errorHandler). */
export function isAppError(error: unknown): error is Error & { statusCode?: number; code?: string } {
  return error instanceof Error;
}
