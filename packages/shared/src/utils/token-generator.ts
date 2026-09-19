import { randomBytes, randomInt } from 'crypto';

export function generateSecureToken(
  prefix: string,
  byteLength: number = 32,
): string {
  return `${prefix}_${randomBytes(byteLength).toString('hex')}`;
}

export function generateOtp(length: number = 6): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return randomInt(min, max).toString();
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
