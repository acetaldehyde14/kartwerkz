import { createHash, randomBytes } from 'crypto';

/** Generates an unguessable, URL-safe session token (256 bits of entropy). */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/** Session/reset tokens are never stored raw — only this hash is persisted. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
