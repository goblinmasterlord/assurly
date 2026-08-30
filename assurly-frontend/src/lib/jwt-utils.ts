/**
 * Read JWT expiry without verifying the signature — used only to decide when to
 * call POST /api/auth/refresh while the token is still valid.
 */
export function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as { exp?: number };

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Default: renew when ≤15 minutes remain on a 60-minute access token. */
export const PROACTIVE_REFRESH_THRESHOLD_MS = 15 * 60 * 1000;

export function shouldProactivelyRefreshToken(
  token: string,
  thresholdMs: number = PROACTIVE_REFRESH_THRESHOLD_MS
): boolean {
  const expMs = getJwtExpiryMs(token);
  if (!expMs) return false;
  return expMs - Date.now() <= thresholdMs;
}
