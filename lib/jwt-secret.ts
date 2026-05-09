/**
 * JWT signing secret for internal sessions.
 * In production, JWT_SECRET must be set (no insecure default).
 * In development, a placeholder is used only when JWT_SECRET is unset.
 */
const DEV_FALLBACK = 'dev-only-insecure-jwt-do-not-deploy-without-JWT_SECRET';

export function getJwtSecretBytes(): Uint8Array {
  const trimmed = process.env.JWT_SECRET?.trim();
  if (trimmed) {
    return new TextEncoder().encode(trimmed);
  }
  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode(DEV_FALLBACK);
  }
  // Production without JWT_SECRET: verification cannot succeed for real tokens.
  return new TextEncoder().encode('');
}

export function requireJwtSecretForSigning(): string {
  const trimmed = process.env.JWT_SECRET?.trim();
  if (trimmed) return trimmed;
  if (process.env.NODE_ENV !== 'production') {
    return DEV_FALLBACK;
  }
  throw new Error('JWT_SECRET is required to issue session tokens in production');
}
