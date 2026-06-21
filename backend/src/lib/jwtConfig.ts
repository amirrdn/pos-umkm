/**
 * Membaca JWT secret dari environment — fail fast jika tidak diset.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Set it in backend/.env (see .env.example).'
    );
  }
  return secret;
}
