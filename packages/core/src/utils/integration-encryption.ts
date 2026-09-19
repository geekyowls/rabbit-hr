import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts integration data (e.g., OAuth tokens) using AES-256-GCM encryption.
 *
 * @param data - The data object to encrypt
 * @param encryptionKey - The encryption key (hex string, must be 64 characters for AES-256)
 * @returns Base64-encoded string in format: iv:tag:encrypted
 */
export function encryptIntegrationData(
  data: Record<string, any>,
  encryptionKey: string,
): string {
  // Validate key length (AES-256 requires 32 bytes = 64 hex characters)
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error(
      'Encryption key must be a 64-character hex string (32 bytes for AES-256)',
    );
  }

  const key = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts integration data that was encrypted using encryptIntegrationData.
 *
 * @param encryptedData - Base64-encoded string in format: iv:tag:encrypted
 * @param encryptionKey - The encryption key (hex string, must be 64 characters for AES-256)
 * @returns The decrypted data object
 * @throws Error if decryption fails or key is invalid
 */
export function decryptIntegrationData(
  encryptedData: string,
  encryptionKey: string,
): Record<string, any> {
  // Validate key length (AES-256 requires 32 bytes = 64 hex characters)
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error(
      'Encryption key must be a 64-character hex string (32 bytes for AES-256)',
    );
  }

  const [ivB64, tagB64, encryptedB64] = encryptedData.split(':');

  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Invalid encrypted data format. Expected: iv:tag:encrypted');
  }

  const key = Buffer.from(encryptionKey, 'hex');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64'),
  );

  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, 'base64')),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}
