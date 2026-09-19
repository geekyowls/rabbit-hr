import { randomBytes } from 'crypto';

/**
 * Generate a secure random token with a prefix
 * @param prefix - Prefix for the token (e.g., 'inv', 'reset')
 * @param byteLength - Length of random bytes to generate (default: 32)
 * @returns Formatted token string
 */
export function generateSecureToken(prefix: string, byteLength: number = 32): string {
  return `${prefix}_${randomBytes(byteLength).toString('hex')}`;
}

/**
 * Generate an invitation token for user invites
 * @returns Invitation token with 'inv_' prefix
 */
export function generateInviteToken(): string {
  return generateSecureToken('inv', 32);
}

/**
 * Generate a password reset token
 * @returns Password reset token with 'reset_' prefix
 */
export function generatePasswordResetToken(): string {
  return generateSecureToken('reset', 32);
}
